import { z } from "zod";

export const itemStatusSchema = z.enum(["inbox", "kept", "sell", "donate", "sold", "donated"]);
export type ItemStatus = z.infer<typeof itemStatusSchema>;

export const captureItemInput = z.object({
  cloudinaryPublicId: z.string().min(1),
  locationId: z.uuid().optional(),
  captureSessionId: z.uuid().optional(),
});
export type CaptureItemInput = z.infer<typeof captureItemInput>;

export const itemsByLocationInput = z.object({
  locationId: z.uuid(),
});
export type ItemsByLocationInput = z.infer<typeof itemsByLocationInput>;

export const assignLocationInput = z.object({
  itemId: z.uuid(),
  locationId: z.uuid(),
});
export type AssignLocationInput = z.infer<typeof assignLocationInput>;

export const batchAssignLocationInput = z.object({
  locationId: z.uuid(),
});
export type BatchAssignLocationInput = z.infer<typeof batchAssignLocationInput>;
