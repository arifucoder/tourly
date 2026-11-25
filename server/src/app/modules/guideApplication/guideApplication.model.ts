import { model, Schema } from "mongoose";
import { GUIDE_APPLICATION_STATUS, type IGuideApplication } from "./guideApplication.interface";

const guideApplicationSchema = new Schema<IGuideApplication>(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
		division: { type: Schema.Types.ObjectId, ref: "Division", required: true },
		experienceYears: { type: Number, required: true, min: 0, max: 60 },
		languages: { type: [String], default: [] },
		message: { type: String, required: true, trim: true },
		status: {
			type: String,
			enum: Object.values(GUIDE_APPLICATION_STATUS),
			default: GUIDE_APPLICATION_STATUS.PENDING,
			index: true,
		},
		reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
		reviewedAt: { type: Date },
		reviewNote: { type: String, trim: true },
	},
	{ timestamps: true, versionKey: false },
);

guideApplicationSchema.index(
	{ user: 1 },
	{ unique: true, partialFilterExpression: { status: GUIDE_APPLICATION_STATUS.PENDING }, name: "one_pending_per_user" },
);
guideApplicationSchema.index({ createdAt: -1 });

export const GuideApplication = model<IGuideApplication>("GuideApplication", guideApplicationSchema);
