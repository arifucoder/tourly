import { z } from "zod";
import { GUIDE_APPLICATION_STATUS } from "./guideApplication.interface";

const objectId = (label: string) => z.string().regex(/^[a-f\d]{24}$/i, { error: `Invalid ${label} id` });

export const createGuideApplicationZodSchema = z.object({
	division: objectId("division"),
	experienceYears: z.coerce
		.number({ error: "Experience is required" })
		.int({ error: "Experience must be whole years" })
		.min(0)
		.max(60),
	languages: z
		.array(z.string().trim().min(2).max(30))
		.max(10, { error: "List at most 10 languages" })
		.default([]),
	message: z
		.string({ error: "Tell us a little about yourself" })
		.trim()
		.min(30, { error: "Please write at least 30 characters" })
		.max(1000, { error: "Keep it under 1000 characters" }),
});

export const reviewGuideApplicationZodSchema = z.object({
	status: z.enum([GUIDE_APPLICATION_STATUS.APPROVED, GUIDE_APPLICATION_STATUS.REJECTED]),
	reviewNote: z.string().trim().max(500).optional(),
});

export const guideApplicationListQuerySchema = z.object({
	status: z.enum(GUIDE_APPLICATION_STATUS).optional(),
	division: objectId("division").optional(),
	searchTerm: z.string().trim().max(100).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type TCreateGuideApplicationPayload = z.infer<typeof createGuideApplicationZodSchema>;
export type TReviewGuideApplicationPayload = z.infer<typeof reviewGuideApplicationZodSchema>;
export type TGuideApplicationListQuery = z.infer<typeof guideApplicationListQuerySchema>;
