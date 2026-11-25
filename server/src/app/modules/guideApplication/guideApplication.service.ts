import httpStatus from "http-status-codes";
import { isValidObjectId } from "mongoose";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/sendEmail";
import { Division } from "../division/division.model";
import { Role } from "../user/user.interface";
import { User } from "../user/user.model";
import { GUIDE_APPLICATION_STATUS } from "./guideApplication.interface";
import { GuideApplication } from "./guideApplication.model";
import type {
	TCreateGuideApplicationPayload,
	TGuideApplicationListQuery,
	TReviewGuideApplicationPayload,
} from "./guideApplication.validation";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const assertObjectId = (id: string) => {
	if (!isValidObjectId(id)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid application id.");
	}
};

const applyAsGuide = async (userId: string, payload: TCreateGuideApplicationPayload) => {
	const user = await User.findById(userId).select("role phone").lean();

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found.");
	}
	if (user.role !== Role.USER) {
		throw new AppError(httpStatus.BAD_REQUEST, "Only traveller accounts can apply to become a guide.");
	}
	if (!user.phone) {
		throw new AppError(httpStatus.BAD_REQUEST, "Please add a phone number to your profile before applying.");
	}

	const [division, pending] = await Promise.all([
		Division.exists({ _id: payload.division }),
		GuideApplication.exists({ user: userId, status: GUIDE_APPLICATION_STATUS.PENDING }),
	]);

	if (!division) {
		throw new AppError(httpStatus.NOT_FOUND, "Division not found.");
	}
	if (pending) {
		throw new AppError(httpStatus.CONFLICT, "You already have an application under review.");
	}

	const application = await GuideApplication.create({ ...payload, user: userId });
	return application.populate("division", "name slug");
};

const getMyApplications = async (userId: string) => {
	return GuideApplication.find({ user: userId })
		.sort("-createdAt")
		.select("-reviewedBy")
		.populate("division", "name slug")
		.lean();
};

const withdrawMyApplication = async (userId: string, applicationId: string) => {
	assertObjectId(applicationId);

	const deleted = await GuideApplication.findOneAndDelete({
		_id: applicationId,
		user: userId,
		status: GUIDE_APPLICATION_STATUS.PENDING,
	});

	if (!deleted) {
		throw new AppError(httpStatus.NOT_FOUND, "No pending application found to withdraw.");
	}

	return null;
};

const getAllApplications = async (query: TGuideApplicationListQuery) => {
	const filter: Record<string, unknown> = {};
	if (query.status) filter.status = query.status;
	if (query.division) filter.division = query.division;

	if (query.searchTerm) {
		const regex = { $regex: escapeRegex(query.searchTerm), $options: "i" };
		const users = await User.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] })
			.select("_id")
			.limit(500)
			.lean();
		filter.user = { $in: users.map((user) => user._id) };
	}

	const skip = (query.page - 1) * query.limit;

	const [data, total] = await Promise.all([
		GuideApplication.find(filter)
			.sort("-createdAt")
			.skip(skip)
			.limit(query.limit)
			.populate("user", "name email phone picture")
			.populate("division", "name slug")
			.lean(),
		GuideApplication.countDocuments(filter),
	]);

	return {
		data,
		meta: { page: query.page, limit: query.limit, total, totalPage: Math.ceil(total / query.limit) },
	};
};

const getApplicationSummary = async () => {
	const grouped = await GuideApplication.aggregate<{ _id: GUIDE_APPLICATION_STATUS; count: number }>([
		{ $group: { _id: "$status", count: { $sum: 1 } } },
	]);

	const counts: Record<string, number> = {};
	for (const status of Object.values(GUIDE_APPLICATION_STATUS)) counts[status] = 0;
	let all = 0;
	for (const { _id, count } of grouped) {
		counts[_id] = count;
		all += count;
	}
	counts.ALL = all;

	return { counts };
};

const getApplicationById = async (applicationId: string) => {
	assertObjectId(applicationId);

	const application = await GuideApplication.findById(applicationId)
		.populate("user", "name email phone picture address role createdAt")
		.populate("division", "name slug")
		.populate("reviewedBy", "name")
		.lean();

	if (!application) {
		throw new AppError(httpStatus.NOT_FOUND, "Application not found.");
	}

	return application;
};

const notifyApplicant = async (application: Awaited<ReturnType<typeof getApplicationById>>) => {
	const user = application.user as unknown as { name: string; email: string } | null;
	const division = application.division as unknown as { name: string } | null;
	if (!user?.email) return;

	const approved = application.status === GUIDE_APPLICATION_STATUS.APPROVED;

	await sendEmail({
		to: user.email,
		subject: approved ? "You're now a Tourly guide" : "Update on your Tourly guide application",
		templateName: "guideApplicationResult",
		templateData: {
			name: user.name,
			approved,
			divisionName: division?.name ?? "your division",
			reviewNote: application.reviewNote ?? "",
			dashboardUrl: `${envVars.FRONTEND_URL}${approved ? "/guide" : "/user"}`,
		},
	});
};

const reviewApplication = async (
	applicationId: string,
	reviewerId: string,
	{ status, reviewNote }: TReviewGuideApplicationPayload,
) => {
	assertObjectId(applicationId);

	const application = await GuideApplication.findById(applicationId);

	if (!application) {
		throw new AppError(httpStatus.NOT_FOUND, "Application not found.");
	}
	if (application.status !== GUIDE_APPLICATION_STATUS.PENDING) {
		throw new AppError(httpStatus.BAD_REQUEST, `This application was already ${application.status.toLowerCase()}.`);
	}

	const session = await GuideApplication.startSession();
	session.startTransaction();

	try {
		if (status === GUIDE_APPLICATION_STATUS.APPROVED) {
			const promoted = await User.updateOne(
				{ _id: application.user, role: Role.USER, isDeleted: { $ne: true } },
				{ role: Role.GUIDE },
				{ session },
			);

			if (promoted.modifiedCount === 0) {
				throw new AppError(httpStatus.CONFLICT, "This user is no longer a traveller account, so they can't be made a guide.");
			}
		}

		application.status = status;
		application.reviewedBy = reviewerId as unknown as typeof application.reviewedBy;
		application.reviewedAt = new Date();
		application.reviewNote = reviewNote;
		await application.save({ session });

		await session.commitTransaction();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}

	const reviewed = await getApplicationById(applicationId);
	notifyApplicant(reviewed).catch((error: unknown) => {
		console.error("Guide application email failed", applicationId, error);
	});

	return reviewed;
};

export const GuideApplicationService = {
	applyAsGuide,
	getMyApplications,
	withdrawMyApplication,
	getAllApplications,
	getApplicationSummary,
	getApplicationById,
	reviewApplication,
};
