import { createCallerFactory, protectedProcedure, publicProcedure, router } from "@/server/trpc";
import { itemsRouter } from "./items";
import { locationsRouter } from "./locations";
import { sessionsRouter } from "./sessions";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: "ok" as const };
  }),

  me: protectedProcedure.query(({ ctx }) => {
    return { userId: ctx.session.user.id };
  }),

  items: itemsRouter,
  locations: locationsRouter,
  sessions: sessionsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
