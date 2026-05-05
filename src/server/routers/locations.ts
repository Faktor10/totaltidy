import { db } from "@/server/db";
import { getLastUsedLocation, listLocations } from "@/server/services/locations";
import { protectedProcedure, router } from "@/server/trpc";

export const locationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listLocations(db, ctx.userId);
  }),

  lastUsed: protectedProcedure.query(async ({ ctx }) => {
    return getLastUsedLocation(db, ctx.userId);
  }),
});
