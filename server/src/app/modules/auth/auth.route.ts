import { Router, type NextFunction, type Request, type Response } from "express";
import passport from "passport";
import { envVars } from "../../config/env";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { createOAuthState, verifyOAuthState } from "../../utils/oauthState";
import { AuthController } from "./auth.controller";
import { forgotPasswordZodSchema, loginZodSchema } from "./auth.validation";

const router = Router();

router.post("/login", validateRequest(loginZodSchema), AuthController.credentialLogin);
router.post("/refresh-token", AuthController.getNewAccessToken);
router.post("/logout", AuthController.logout);
router.post("/change-password", checkAuth(...Object.values(Role)), AuthController.changePassword);
router.post("/set-password", checkAuth(...Object.values(Role)), AuthController.setPassword);
router.post("/forgot-password", validateRequest(forgotPasswordZodSchema), AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

router.get("/google", (req: Request, res: Response, next: NextFunction) => {
	const state = createOAuthState(res, req.query.redirect);
	passport.authenticate("google", { scope: ["profile", "email"], state, session: false })(req, res, next);
});

const googleLoginFailedUrl = `${envVars.FRONTEND_URL}/login?error=${encodeURIComponent(
	"Google sign-in failed. Please try again or contact support.",
)}`;

router.get(
	"/google/callback",
	verifyOAuthState,
	(req: Request, res: Response, next: NextFunction) => {
		passport.authenticate("google", { session: false }, (err: unknown, user: Express.User | false) => {
			if (err || !user) {
				res.redirect(googleLoginFailedUrl);
				return;
			}
			req.user = user;
			next();
		})(req, res, next);
	},
	AuthController.googleCallbackController,
);

export const AuthRoutes = router;
