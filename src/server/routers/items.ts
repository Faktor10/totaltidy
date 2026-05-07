import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/server/db";
import {
  assignLocation,
  batchAssignLocation,
  captureItem,
  countInbox,
  listGalleryItems,
  listInbox,
  listItems,
} from "@/server/services/items";
import { protectedProcedure, router } from "@/server/trpc";

export const itemsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listItems(db, ctx.userId);
  }),

  gallery: protectedProcedure.query(async ({ ctx }) => {
    return listGalleryItems(db, ctx.userId);
  }),

  inbox: protectedProcedure.query(async ({ ctx }) => {
    return listInbox(db, ctx.userId);
  }),

  inboxCount: protectedProcedure.query(async ({ ctx }) => {
    return countInbox(db, ctx.userId);
  }),

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

  assignLocation: protectedProcedure
    .input(
      z.object({
        itemId: z.string().uuid(),
        locationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await assignLocation(db, ctx.userId, input);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Location not found") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Location not found",
            });
          }
          if (error.message === "Item not found") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Item not found",
            });
          }
        }
        throw error;
      }
    }),

  batchAssignLocation: protectedProcedure
    .input(
      z.object({
        locationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await batchAssignLocation(db, ctx.userId, input.locationId);
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
