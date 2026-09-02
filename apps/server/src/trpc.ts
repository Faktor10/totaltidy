import { db } from "@totaltidy/db";
import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import superjson from "superjson";
import { type AuthSession, resolveSession } from "./lib/session";

export interface TRPCContext {
  session: AuthSession | null;
  userId: string | null;
  db: typeof db;
}

export async function createTRPCContext(
  opts: Pick<CreateExpressContextOptions, "req">,
): Promise<TRPCContext> {
  const session = await resolveSession(opts.req);

  return {
    session,
    userId: session?.user.id ?? null,
    db,
  };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      userId: ctx.session.user.id,
    },
  });
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuth);
