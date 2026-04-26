import { createCallerFactory, protectedProcedure, publicProcedure, router } from "@/server/trpc";
import { itemsRouter } from "./items";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: "ok" as const };
  }),

  me: protectedProcedure.query(({ ctx }) => {
    return { userId: ctx.session.user.id };
  }),

  items: itemsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
