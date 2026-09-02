import {
  assignLocationInput,
  batchAssignLocationInput,
  captureItemInput,
  itemsByLocationInput,
} from "@totaltidy/shared/schemas/items";
import { TRPCError } from "@trpc/server";
import {
  assignLocation,
  batchAssignLocation,
  captureItem,
  countInbox,
  listGalleryItems,
  listInbox,
  listItems,
  listItemsByLocation,
} from "../services/items";
import { protectedProcedure, router } from "../trpc";

/** Services signal missing rows with plain Errors; map them at the boundary. */
function asNotFound(error: unknown, ...messages: string[]): never {
  if (error instanceof Error && messages.includes(error.message)) {
    throw new TRPCError({ code: "NOT_FOUND", message: error.message });
  }
  throw error;
}

export const itemsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listItems(ctx.db, ctx.userId);
  }),

  gallery: protectedProcedure.query(async ({ ctx }) => {
    return listGalleryItems(ctx.db, ctx.userId);
  }),

  byLocation: protectedProcedure.input(itemsByLocationInput).query(async ({ ctx, input }) => {
    return listItemsByLocation(ctx.db, ctx.userId, input.locationId);
  }),

  inbox: protectedProcedure.query(async ({ ctx }) => {
    return listInbox(ctx.db, ctx.userId);
  }),

  inboxCount: protectedProcedure.query(async ({ ctx }) => {
    return countInbox(ctx.db, ctx.userId);
  }),

  capture: protectedProcedure.input(captureItemInput).mutation(async ({ ctx, input }) => {
    try {
      return await captureItem(ctx.db, ctx.userId, input);
    } catch (error) {
      asNotFound(error, "Location not found");
    }
  }),

  assignLocation: protectedProcedure.input(assignLocationInput).mutation(async ({ ctx, input }) => {
    try {
      return await assignLocation(ctx.db, ctx.userId, input);
    } catch (error) {
      asNotFound(error, "Location not found", "Item not found");
    }
  }),

  batchAssignLocation: protectedProcedure
    .input(batchAssignLocationInput)
    .mutation(async ({ ctx, input }) => {
      try {
        return await batchAssignLocation(ctx.db, ctx.userId, input.locationId);
      } catch (error) {
        asNotFound(error, "Location not found");
      }
    }),
});
