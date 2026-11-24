import type { CookieOptions, Response } from "express";
import { envVars } from "../config/env";

export interface AuthTokens {
	accessToken?: string;
	refreshToken?: string;
}

const isProduction = envVars.NODE_ENV === "production";

export const authCookieOptions: CookieOptions = {
	httpOnly: true,
	secure: true,
	sameSite: isProduction ? "none" : "lax",
};

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
	if (tokenInfo.accessToken) {
		res.cookie("accessToken", tokenInfo.accessToken, authCookieOptions);
	}

	if (tokenInfo.refreshToken) {
		res.cookie("refreshToken", tokenInfo.refreshToken, authCookieOptions);
	}
};
