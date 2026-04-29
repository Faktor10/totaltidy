import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/server/db";
import { captureItem } from "@/server/services/items";
import { protectedProcedure, router } from "@/server/trpc";

export const itemsRouter = router({
  capture: protectedProcedure
    .input(
      z.object({
        cloudinaryPublicId: z.string().min(1),
        locationId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await captureItem(db, ctx.userId, input);
      } catch (error) {
        if (error instanceof Error && error.message === "Location not found") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Location not found",
          });
        }
        throw error;
      }
    }),
});
