import z from "zod";
import { IsActive, Role } from "./user.interface";

export const passwordSchema = z
	.string({ error: "Password must be string" })
	.min(8, { error: "Password must be at least 8 characters long." })
	.max(128, { error: "Password cannot exceed 128 characters." })
	.regex(/[A-Z]/, { error: "Password must contain at least 1 uppercase letter." })
	.regex(/\d/, { error: "Password must contain at least 1 number." })
	.regex(/[^A-Za-z0-9]/, { error: "Password must contain at least 1 special character." });

export const createUserZodSchema = z.object({
	name: z
		.string({ error: "Name must be string" })
		.min(2, { error: "Name must be at least 2 characters long." })
		.max(50, { error: "Name cannot exceed 50 characters." }),
	email: z
		.email({
			error: (issue) => (issue.code === "invalid_type" ? "Email must be string" : "Invalid email address format."),
		})
		.min(5, { error: "Email must be at least 5 characters long." })
		.max(100, { error: "Email cannot exceed 100 characters." }),
	password: passwordSchema,
	phone: z
		.string({ error: "Phone Number must be string" })
		.regex(/^(?:\+8801\d{9}|01\d{9})$/, {
			error: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
		})
		.optional(),
	address: z
		.string({ error: "Address must be string" })
		.max(200, { error: "Address cannot exceed 200 characters." })
		.optional(),
});

export const updateUserZodSchema = z.object({
	name: z
		.string({ error: "Name must be string" })
		.min(2, { error: "Name must be at least 2 characters long." })
		.max(50, { error: "Name cannot exceed 50 characters." })
		.optional(),
	phone: z
		.string({ error: "Phone Number must be string" })
		.regex(/^(?:\+8801\d{9}|01\d{9})$/, {
			error: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
		})
		.optional(),
	role: z.enum(Role).optional(),
	isActive: z.enum(IsActive).optional(),
	isDeleted: z.boolean({ error: "isDeleted must be true or false" }).optional(),
	isVerified: z.boolean({ error: "isVerified must be true or false" }).optional(),
	address: z
		.string({ error: "Address must be string" })
		.max(200, { error: "Address cannot exceed 200 characters." })
		.optional(),
});

export const updateMyProfileZodSchema = z.object({
	name: z.string().trim().min(2, { error: "Name must be at least 2 characters long." }).max(50).optional(),
	phone: z
		.string()
		.trim()
		.regex(/^(?:\+8801\d{9}|01\d{9})$/, { error: "Enter an 11-digit mobile number, e.g. 01712345678" })
		.optional(),
	address: z.string().trim().max(200, { error: "Address cannot exceed 200 characters." }).optional(),
});

export type TUpdateMyProfilePayload = z.infer<typeof updateMyProfileZodSchema>;
