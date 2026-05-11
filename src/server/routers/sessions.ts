import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/server/db";
import { endSession, getSession, startSession } from "@/server/services/sessions";
import { protectedProcedure, router } from "@/server/trpc";

export const sessionsRouter = router({
  startSession: protectedProcedure.mutation(async ({ ctx }) => {
    return startSession(db, ctx.userId);
  }),

  endSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await endSession(db, ctx.userId, input.sessionId);
      } catch (error) {
        if (error instanceof Error && error.message === "Session not found") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }
        throw error;
      }
    }),

  get: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const session = await getSession(db, ctx.userId, input.sessionId);
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }
      return session;
    }),
});
