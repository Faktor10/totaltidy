import { createCallerFactory, protectedProcedure, publicProcedure, router } from "@/server/trpc";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: "ok" as const };
  }),

  me: protectedProcedure.query(({ ctx }) => {
    return { userId: ctx.session.user.id };
  }),
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
