import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { auth } from "@/lib/auth";
import { appRouter } from "@/server/routers";
import { createTRPCContext } from "@/server/trpc";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await auth();
      return createTRPCContext({ headers: req.headers, session });
    },
  });
}

export { handler as GET, handler as POST };
