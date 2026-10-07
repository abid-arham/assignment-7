import { z } from "zod";

// Mirrors users.validation.ts (name 2–100) and the upload middleware (image/*, ≤ 2 MB).
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const avatarFileSchema = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), "Choose an image file (JPG, PNG, WebP or GIF).")
  .refine((file) => file.size <= AVATAR_MAX_BYTES, "Images must be 2 MB or smaller.");
