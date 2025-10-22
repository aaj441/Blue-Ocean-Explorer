import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { env } from "~/server/env";

export const healthCheck = baseProcedure.query(async () => {
  const checks = {
    status: "healthy" as "healthy" | "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    checks: {
      database: { status: "unknown" as "ok" | "error" | "unknown", message: "" },
      memory: { status: "ok" as "ok" | "warning" | "critical", usage: 0 },
    },
  };

  // Database health check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.checks.database = { status: "ok", message: "Database connection successful" };
  } catch (error) {
    checks.checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown database error",
    };
    checks.status = "unhealthy";
  }

  // Memory health check
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  checks.checks.memory = {
    status: heapUsedPercent > 90 ? "critical" : heapUsedPercent > 70 ? "warning" : "ok",
    usage: Math.round(heapUsedPercent),
  };

  if (checks.checks.memory.status === "critical") {
    checks.status = "unhealthy";
  }

  return checks;
});
