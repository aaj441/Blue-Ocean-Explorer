import { defineEventHandler, toWebRequest } from "@tanstack/react-start/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./root";
import { logger } from "~/server/utils/logger";
import { authenticateUser } from "~/server/utils/auth";
import { env } from "~/server/env";
import { createId } from "@paralleldrive/cuid2";

interface Context {
  user?: any;
  requestId: string;
  startTime: number;
}

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event);
  if (!request) {
    return new Response("No request", { status: 400 });
  }

  const requestId = createId();
  const startTime = Date.now();

  return fetchRequestHandler({
    endpoint: "/trpc",
    req: request,
    router: appRouter,
    async createContext(): Promise<Context> {
      const context: Context = {
        requestId,
        startTime,
      };

      // Try to authenticate user from Authorization header
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7);
          context.user = await authenticateUser(token);
        } catch (error) {
          // Invalid token, but don't fail the request
          // Some endpoints don't require authentication
          logger.debug("Invalid auth token", { requestId, error });
        }
      }

      return context;
    },
    onError({ error, type, path, input, ctx, req }) {
      const duration = Date.now() - (ctx?.startTime || startTime);
      
      logger.error(`tRPC error on '${path}'`, {
        requestId: ctx?.requestId || requestId,
        type,
        path,
        input: env.NODE_ENV === "development" ? input : undefined,
        error: {
          message: error.message,
          code: error.code,
          stack: env.NODE_ENV === "development" ? error.stack : undefined,
        },
        duration,
        userId: ctx?.user?.id,
      });
    },
    responseMeta({ ctx, paths, type, errors }) {
      const duration = Date.now() - (ctx?.startTime || startTime);
      const allOk = errors.length === 0;
      const isQuery = type === "query";
      
      // Log successful requests in development
      if (env.NODE_ENV === "development" && allOk) {
        logger.debug(`tRPC ${type} completed`, {
          requestId: ctx?.requestId || requestId,
          paths,
          duration,
          userId: ctx?.user?.id,
        });
      }

      // Add cache headers for queries
      if (allOk && isQuery) {
        return {
          headers: {
            "cache-control": `s-maxage=1, stale-while-revalidate`,
            "x-request-id": ctx?.requestId || requestId,
          },
        };
      }

      return {
        headers: {
          "x-request-id": ctx?.requestId || requestId,
        },
      };
    },
  });
});
