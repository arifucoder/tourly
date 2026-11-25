import { role } from "@/constants/role";
import { useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { type ComponentType } from "react";
import { Navigate, useLocation } from "react-router";

const ADMIN_ROLES: string[] = [role.admin, role.superAdmin];

export const withGuest = (Component: ComponentType) => {
	return function GuestWrapper() {
		const { data, isLoading } = useUserInfoQuery(undefined);
		const location = useLocation();

		if (isLoading) return null;

		const user = data?.data;
		if (user?.email) {
			const from = (location.state as { from?: string } | null)?.from;
			const fallback = ADMIN_ROLES.includes(user.role) ? "/admin" : "/";
			return <Navigate to={from ?? fallback} replace />;
		}

		return <Component />;
	};
};
