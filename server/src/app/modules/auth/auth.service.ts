/* eslint-disable @typescript-eslint/no-explicit-any */
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/sendEmail";
import { createNewAccessTokenWithRefreshToken, getPasswordResetSecret } from "../../utils/userTokens";
import { IsActive, type IAuthProvider } from "../user/user.interface";
import { User } from "../user/user.model";

const getNewAccessToken = async (refreshToken: string) => {
	const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken);

	return {
		accessToken: newAccessToken,
	};
};

const changePassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {
	const user = await User.findById(decodedToken.userId);

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	const isOldPasswordMatch = await bcryptjs.compare(oldPassword, user.password as string);

	if (!isOldPasswordMatch) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Old password does not match");
	}

	user.password = await bcryptjs.hash(newPassword, envVars.BCRYPT_SALT_ROUND);

	await user.save();
};
const setPassword = async (userId: string, plainPassword: string) => {
	const user = await User.findById(userId);

	if (!user) {
		throw new AppError(404, "User not found");
	}

	if (user.password && user.auths.some((providerObject) => providerObject.provider === "google")) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You have already set you password. Now you can change the password from your profile password update",
		);
	}

	const hashedPassword = await bcryptjs.hash(plainPassword, envVars.BCRYPT_SALT_ROUND);

	const credentialProvider: IAuthProvider = {
		provider: "credentials",
		providerId: user.email,
	};

	const auths: IAuthProvider[] = [...user.auths, credentialProvider];

	user.password = hashedPassword;

	user.auths = auths;

	await user.save();
};
const forgotPassword = async (email: string) => {
	const isUserExist = await User.findOne({ email });

	if (!isUserExist) {
		throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
	}
	if (!isUserExist.isVerified) {
		throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");
	}
	if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
		throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExist.isActive}`);
	}
	if (isUserExist.isDeleted) {
		throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
	}

	const resetToken = jwt.sign({ userId: isUserExist._id }, getPasswordResetSecret(isUserExist.password), {
		expiresIn: "10m",
	});

	const resetUILink = `${envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;

	await sendEmail({
		to: isUserExist.email,
		subject: "Password Reset",
		templateName: "forgetPassword",
		templateData: {
			name: isUserExist.name,
			resetUILink,
		},
	});
};

const resetPassword = async (payload: Record<string, any>, resetToken?: string) => {
	if (!resetToken) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Reset token is missing");
	}

	const decoded = jwt.decode(resetToken) as JwtPayload | null;

	if (!decoded?.userId || payload.id != decoded.userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired reset link");
	}

	const isUserExist = await User.findById(decoded.userId);
	if (!isUserExist) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired reset link");
	}

	try {
		jwt.verify(resetToken, getPasswordResetSecret(isUserExist.password));
	} catch {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired reset link");
	}

	isUserExist.password = await bcryptjs.hash(payload.newPassword, envVars.BCRYPT_SALT_ROUND);

	await isUserExist.save();
};

export const AuthServices = {
	getNewAccessToken,
	changePassword,
	setPassword,
	forgotPassword,
	resetPassword,
};
