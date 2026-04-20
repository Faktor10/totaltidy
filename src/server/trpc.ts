import { initTRPC, TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import superjson from "superjson";
import { auth } from "@/lib/auth";

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth();

  return {
    headers: opts.headers,
    session,
    userId: session?.user?.id ?? null,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

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
      session: ctx.session as Session & { user: { id: string } },
      userId: ctx.session.user.id,
    },
  });
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuth);
