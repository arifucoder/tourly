import type { Types } from "mongoose";

export enum GUIDE_APPLICATION_STATUS {
	PENDING = "PENDING",
	APPROVED = "APPROVED",
	REJECTED = "REJECTED",
}

export interface IGuideApplication {
	user: Types.ObjectId;
	division: Types.ObjectId;
	experienceYears: number;
	languages: string[];
	message: string;
	status: GUIDE_APPLICATION_STATUS;
	reviewedBy?: Types.ObjectId;
	reviewedAt?: Date;
	reviewNote?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
