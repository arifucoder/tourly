import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { GuideApplicationController } from "./guideApplication.controller";
import { createGuideApplicationZodSchema, reviewGuideApplicationZodSchema } from "./guideApplication.validation";

const router = Router();

const adminRoles = [Role.ADMIN, Role.SUPER_ADMIN];

router.post(
	"/",
	checkAuth(Role.USER),
	validateRequest(createGuideApplicationZodSchema),
	GuideApplicationController.applyAsGuide,
);
router.get("/me", checkAuth(Role.USER, Role.GUIDE), GuideApplicationController.getMyApplications);
router.delete("/me/:id", checkAuth(Role.USER), GuideApplicationController.withdrawMyApplication);

router.get("/", checkAuth(...adminRoles), GuideApplicationController.getAllApplications);
router.get("/summary", checkAuth(...adminRoles), GuideApplicationController.getApplicationSummary);
router.get("/:id", checkAuth(...adminRoles), GuideApplicationController.getApplicationById);
router.patch(
	"/:id/review",
	checkAuth(...adminRoles),
	validateRequest(reviewGuideApplicationZodSchema),
	GuideApplicationController.reviewApplication,
);

export const GuideApplicationRoutes = router;
