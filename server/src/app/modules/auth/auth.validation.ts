import { z } from "zod";
import { passwordSchema } from "../user/user.validation";

export const loginZodSchema = z.object({
	email: z.email({ error: "A valid email is required" }).trim(),
	password: z.string({ error: "Password is required" }).min(1, { error: "Password is required" }).max(128),
});

export const forgotPasswordZodSchema = z.object({
	email: z.email({ error: "A valid email is required" }).trim(),
});

export const changePasswordZodSchema = z
	.object({
		oldPassword: z.string({ error: "Current password is required" }).min(1, { error: "Current password is required" }),
		newPassword: passwordSchema,
	})
	.refine((data) => data.oldPassword !== data.newPassword, {
		path: ["newPassword"],
		error: "New password must be different from the current one",
	});

export const setPasswordZodSchema = z.object({ password: passwordSchema });

export const resetPasswordZodSchema = z.object({
	id: z.string().regex(/^[a-f\d]{24}$/i, { error: "Invalid reset link" }),
	newPassword: passwordSchema,
});

export type TLoginPayload = z.infer<typeof loginZodSchema>;
