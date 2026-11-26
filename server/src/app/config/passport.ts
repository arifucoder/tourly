import passport from "passport";
import { Strategy as GoogleStrategy, type Profile, type VerifyCallback } from "passport-google-oauth20";
import { IsActive, Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { envVars } from "./env";

passport.use(
	new GoogleStrategy(
		{
			clientID: envVars.GOOGLE_CLIENT_ID,
			clientSecret: envVars.GOOGLE_CLIENT_SECRET,
			callbackURL: envVars.GOOGLE_CALLBACK_URL,
		},
		async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
			try {
				const email = profile.emails?.[0]?.value;

				if (!email) {
					return done(null, false, { message: "No email found" });
				}

				let user = await User.findOne({ email });

				if (user) {
					if (user.isDeleted) {
						return done(null, false, { message: "User is deleted" });
					}

					if (user.isActive === IsActive.BLOCKED || user.isActive === IsActive.INACTIVE) {
						return done(null, false, { message: `User is ${user.isActive}` });
					}

					if (!user.isVerified) {
						return done(null, false, { message: "User is not verified" });
					}

					const hasGoogle = user.auths?.some((a) => a.provider === "google");
					if (!hasGoogle) {
						user.auths.push({ provider: "google", providerId: profile.id });
						await user.save();
					}
				} else {
					user = await User.create({
						email,
						name: profile.displayName,
						picture: profile.photos?.[0]?.value,
						role: Role.USER,
						isVerified: true,
						auths: [{ provider: "google", providerId: profile.id }],
					});
				}

				return done(null, user);
			} catch (error) {
				return done(error);
			}
		},
	),
);
