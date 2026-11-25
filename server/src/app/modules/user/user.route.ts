import { Router } from "express";
import { avatarUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import { createUserZodSchema, updateMyProfileZodSchema, updateUserZodSchema } from "./user.validation";

const router = Router();

router.post("/register", validateRequest(createUserZodSchema), UserControllers.createUser);
router.get("/all-users", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserControllers.getAllUsers);
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);
router.patch(
	"/me",
	checkAuth(...Object.values(Role)),
	avatarUpload.single("picture"),
	validateRequest(updateMyProfileZodSchema),
	UserControllers.updateMyProfile,
);
router.get("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserControllers.getSingleUser);
router.patch(
	"/:id",
	validateRequest(updateUserZodSchema),
	checkAuth(...Object.values(Role)),
	UserControllers.updateUser,
);

export const UserRoutes = router;
