import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/server/db";
import {
  getLastUsedLocation,
  getLocation,
  listLocations,
  listLocationsPredicted,
} from "@/server/services/locations";
import { protectedProcedure, router } from "@/server/trpc";

export const locationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listLocations(db, ctx.userId);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const location = await getLocation(db, ctx.userId, input.id);
      if (!location) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Location not found" });
      }
      return location;
    }),

  lastUsed: protectedProcedure.query(async ({ ctx }) => {
    return getLastUsedLocation(db, ctx.userId);
  }),

  predicted: protectedProcedure.query(async ({ ctx }) => {
    return listLocationsPredicted(db, ctx.userId);
  }),
});
