import { sessionIdInput } from "@totaltidy/shared/schemas/sessions";
import { TRPCError } from "@trpc/server";
import { endSession, getSession, startSession } from "../services/sessions";
import { protectedProcedure, router } from "../trpc";

export const sessionsRouter = router({
  startSession: protectedProcedure.mutation(async ({ ctx }) => {
    return startSession(ctx.db, ctx.userId);
  }),

  endSession: protectedProcedure.input(sessionIdInput).mutation(async ({ ctx, input }) => {
    try {
      return await endSession(ctx.db, ctx.userId, input.sessionId);
    } catch (error) {
      if (error instanceof Error && error.message === "Session not found") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }
      throw error;
    }
  }),

  get: protectedProcedure.input(sessionIdInput).query(async ({ ctx, input }) => {
    const session = await getSession(ctx.db, ctx.userId, input.sessionId);
    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }
    return session;
  }),
});
