import type { TRole, TUserStatus } from "@/types";

export const roleLabel: Record<TRole, string> = {
	SUPER_ADMIN: "Super Admin",
	ADMIN: "Admin",
	GUIDE: "Guide",
	USER: "User",
};

export type TAccountStatus = "Active" | "Blocked" | "Inactive" | "Unverified";

export const accountStatus = (user: { isActive?: TUserStatus; isVerified?: boolean }): TAccountStatus => {
	if (user.isActive === "BLOCKED") return "Blocked";
	if (user.isActive === "INACTIVE") return "Inactive";
	if (!user.isVerified) return "Unverified";
	return "Active";
};
