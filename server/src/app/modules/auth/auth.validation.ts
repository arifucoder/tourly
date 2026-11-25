import { z } from "zod";

export const loginZodSchema = z.object({
	email: z.email({ error: "A valid email is required" }).trim(),
	password: z.string({ error: "Password is required" }).min(1, { error: "Password is required" }).max(128),
});

export const forgotPasswordZodSchema = z.object({
	email: z.email({ error: "A valid email is required" }).trim(),
});

export type TLoginPayload = z.infer<typeof loginZodSchema>;
