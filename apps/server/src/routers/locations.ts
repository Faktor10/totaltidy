import { locationIdInput } from "@totaltidy/shared/schemas/locations";
import { TRPCError } from "@trpc/server";
import {
  getLastUsedLocation,
  getLocation,
  listLocations,
  listLocationsPredicted,
} from "../services/locations";
import { protectedProcedure, router } from "../trpc";

export const locationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listLocations(ctx.db, ctx.userId);
  }),

  get: protectedProcedure.input(locationIdInput).query(async ({ ctx, input }) => {
    const location = await getLocation(ctx.db, ctx.userId, input.id);
    if (!location) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Location not found" });
    }
    return location;
  }),

  lastUsed: protectedProcedure.query(async ({ ctx }) => {
    return getLastUsedLocation(ctx.db, ctx.userId);
  }),

  predicted: protectedProcedure.query(async ({ ctx }) => {
    return listLocationsPredicted(ctx.db, ctx.userId);
  }),
});
