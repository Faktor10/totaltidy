import { z } from "zod";

export const magicLinkRequestInput = z.object({
  email: z.email(),
  callbackUrl: z.string().optional(),
});
export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestInput>;
