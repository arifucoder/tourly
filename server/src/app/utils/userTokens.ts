import httpStatus from "http-status-codes";
import { type JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IsActive, type IUser } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { generateToken, verifyToken } from "./jwt";

export const createUserTokens = (user: Partial<IUser>) => {
	const jwtPayload = { userId: user._id, role: user.role };
	const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES);

	const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES);

	return {
		accessToken,
		refreshToken,
	};
};

export const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => {
	const verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload;

	const isUserExist = await User.findById(verifiedRefreshToken.userId);

	if (!isUserExist) {
		throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
	}
	if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
		throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExist.isActive}`);
	}
	if (isUserExist.isDeleted) {
		throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
	}

	const accessToken = generateToken(
		{ userId: isUserExist._id, role: isUserExist.role },
		envVars.JWT_ACCESS_SECRET,
		envVars.JWT_ACCESS_EXPIRES,
	);

	return accessToken;
};

export const getPasswordResetSecret = (passwordHash?: string) =>
	`${envVars.JWT_ACCESS_SECRET}.password-reset.${passwordHash ?? ""}`;
