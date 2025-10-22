import { publicProcedure } from "~/server/trpc/main";
import { performHealthCheck, livenessCheck, readinessCheck } from "~/server/utils/health";

export const healthCheck = publicProcedure
  .query(async () => {
    return await performHealthCheck();
  });

export const liveness = publicProcedure
  .query(async () => {
    return livenessCheck();
  });

export const readiness = publicProcedure
  .query(async () => {
    return await readinessCheck();
  });