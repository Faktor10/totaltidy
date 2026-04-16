import { initTRPC } from "@trpc/server";
import superjson from "superjson";

export function createTRPCContext(opts: { headers: Headers }) {
  return {
    headers: opts.headers,
  };
}

export type TRPCContext = ReturnType<typeof createTRPCContext>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;
