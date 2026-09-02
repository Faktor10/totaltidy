import { z } from "zod";

export const locationIdInput = z.object({
  id: z.uuid(),
});
export type LocationIdInput = z.infer<typeof locationIdInput>;
