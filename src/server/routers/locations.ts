import { db } from "@/server/db";
import { listLocations } from "@/server/services/locations";
import { protectedProcedure, router } from "@/server/trpc";

export const locationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listLocations(db, ctx.userId);
  }),
});
