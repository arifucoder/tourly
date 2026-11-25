import bcrypt from "bcryptjs";
import httpStatus from "http-status-codes";
import type { JwtPayload } from "jsonwebtoken";
import { isValidObjectId, type Types } from "mongoose";
import { deleteImageFromCLoudinary, uploadAvatarToCloudinary } from "../../config/cloudinary.config";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Booking } from "../booking/booking.model";
import {
	userFilterableFields,
	userSearchableFields,
	userSelectableFields,
	userSortableFields,
} from "./user.constant";
import { Role, type IAuthProvider, type IUser } from "./user.interface";
import { User } from "./user.model";
import type { TUpdateMyProfilePayload } from "./user.validation";

const createUser = async (payload: Partial<IUser>) => {
	const { email, password, ...rest } = payload;

	const isUserExist = await User.findOne({ email });

	if (isUserExist) {
		throw new AppError(httpStatus.BAD_REQUEST, "User already exist");
	}

	const hashedPassword = await bcrypt.hash(password as string, envVars.BCRYPT_SALT_ROUND);

	const authProvider: IAuthProvider = { provider: "credentials", providerId: email as string };

	const user = await User.create({
		email,
		auths: [authProvider],
		password: hashedPassword,
		...rest,
	});

	return user;
};

const updateUser = async (userId: string, payload: Partial<IUser>, decodedToken: JwtPayload) => {
	if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
		if (userId !== decodedToken.userId) {
			throw new AppError(401, "You are not authorized");
		}
	}

	const ifUserExist = await User.findById(userId);

	if (!ifUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
	}

	if (decodedToken.role === Role.ADMIN && ifUserExist.role === Role.SUPER_ADMIN) {
		throw new AppError(401, "You are not authorized");
	}

	const changesAccess = payload.role !== undefined || payload.isActive !== undefined || payload.isDeleted !== undefined;
	if (changesAccess && userId === decodedToken.userId) {
		throw new AppError(httpStatus.FORBIDDEN, "You can't change your own role or account status");
	}

	if (payload.role) {
		if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
			throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
		}

		if (payload.role === Role.SUPER_ADMIN && decodedToken.role === Role.ADMIN) {
			throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
		}
	}

	if (payload.isActive !== undefined || payload.isDeleted !== undefined || payload.isVerified !== undefined) {
		if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
			throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
		}
	}

	const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });

	return newUpdatedUser;
};

const getAllUsers = async (query: Record<string, string>) => {
	const queryBuilder = new QueryBuilder(User.find().where("isDeleted").ne(true).lean(), query, {
		searchableFields: userSearchableFields,
		filterableFields: userFilterableFields,
		sortableFields: userSortableFields,
		selectableFields: userSelectableFields,
	});

	const users = queryBuilder.search().filter().sort().fields().paginate();
	const [rows, meta] = await Promise.all([users.build(), queryBuilder.getMeta()]);

	const counts = await Booking.aggregate<{ _id: Types.ObjectId; count: number }>([
		{ $match: { user: { $in: rows.map((row) => row._id) } } },
		{ $group: { _id: "$user", count: { $sum: 1 } } },
	]);
	const countByUser = new Map(counts.map(({ _id, count }) => [_id.toString(), count]));

	const data = rows.map((row) => ({
		...row,
		signInMethods: [...new Set((row.auths ?? []).map((auth) => auth.provider))],
		bookingsCount: countByUser.get(row._id.toString()) ?? 0,
	}));

	return { data, meta };
};

const getMe = async (userId: string) => {
	const user = await User.findById(userId).select("+password").lean();

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	const { password, ...profile } = user;

	return {
		data: {
			...profile,
			hasPassword: Boolean(password),
			signInMethods: [...new Set((user.auths ?? []).map((auth) => auth.provider))],
		},
	};
};

const updateMyProfile = async (userId: string, payload: TUpdateMyProfilePayload, picture?: Express.Multer.File) => {
	const user = await User.findById(userId).select("picture");

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	const update: Partial<IUser> = { ...payload };
	const oldPicture = user.picture;

	if (picture) {
		const uploaded = await uploadAvatarToCloudinary(picture.buffer, userId);
		update.picture = uploaded.secure_url;
	}

	const updated = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true });

	if (picture && oldPicture?.includes("res.cloudinary.com")) {
		deleteImageFromCLoudinary(oldPicture).catch(() => undefined);
	}

	return updated;
};

const getSingleUser = async (id: string) => {
	if (!isValidObjectId(id)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid user id");
	}

	const [user, bookingsCount] = await Promise.all([User.findById(id).lean(), Booking.countDocuments({ user: id })]);

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	return {
		data: {
			...user,
			signInMethods: [...new Set((user.auths ?? []).map((auth) => auth.provider))],
			bookingsCount,
		},
	};
};

export const UserServices = {
	updateMyProfile,
	createUser,
	getAllUsers,
	updateUser,
	getMe,
	getSingleUser,
};
