import App from "@/App";
import DashboardLayout from "@/components/layout/DashboardLayout";

import { role } from "@/constants/role";
import About from "@/pages/About";
import CancellationPolicy from "@/pages/CancellationPolicy";
import Help from "@/pages/Help";
import Terms from "@/pages/Terms";
import ForgotPassword from "@/pages/ForgotPassword";
import Home from "@/pages/Home";
import LoginPage from "@/pages/Login";
import NotFound, { DashboardNotFound } from "@/pages/NotFound";
import PaymentResult from "@/pages/PaymentResult";
import RegisterPage from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import TourDetails from "@/pages/TourDetails";
import Tours from "@/pages/Tours";
import Unauthorized from "@/pages/Unauthorized";
import Verify from "@/pages/verify";
import { generateRoutes } from "@/utils/generateRoutes";
import { withAuth } from "@/utils/withAuth";
import { withGuest } from "@/utils/withGuest";
import { createBrowserRouter, Navigate } from "react-router";
import { adminSidebarItems } from "./adminSidebarItems";
import { guideSidebarItems } from "./guideSidebarItems";
import { userSidebarItems } from "./userSidebarItems";

export const router = createBrowserRouter([
	{
		Component: App,
		path: "/",
		children: [
			{
				index: true,
				Component: Home,
			},
			{
				Component: About,
				path: "about",
			},
			{ Component: Help, path: "help" },
			{ Component: CancellationPolicy, path: "cancellation-policy" },
			{ Component: Terms, path: "terms" },
			{ Component: Tours, path: "tours" },
			{ Component: TourDetails, path: "tours/:slug" },
			{ path: "payment/success", element: <PaymentResult status="success" /> },
			{ path: "payment/fail", element: <PaymentResult status="fail" /> },
			{ path: "payment/cancel", element: <PaymentResult status="cancel" /> },
			{ path: "*", Component: NotFound },
		],
	},
	{
		Component: withAuth(DashboardLayout, [role.superAdmin, role.admin]),
		path: "/admin",
		children: [
			...generateRoutes(adminSidebarItems),
			{ path: "/admin/add-tour", element: <Navigate to="/admin/tours/new" replace /> },
			{ path: "/admin/add-division", element: <Navigate to="/admin/divisions" replace /> },
			{ path: "*", Component: DashboardNotFound },
		],
	},
	{
		Component: withAuth(DashboardLayout, role.guide),
		path: "/guide",
		children: [...generateRoutes(guideSidebarItems), { path: "*", Component: DashboardNotFound }],
	},
	{
		Component: withAuth(DashboardLayout, role.user),
		path: "/user",
		children: [
			{ index: true, element: <Navigate to="/user/bookings" /> },
			...generateRoutes(userSidebarItems),
			{ path: "*", Component: DashboardNotFound },
		],
	},
	{
		Component: withGuest(LoginPage),
		path: "/login",
	},
	{
		Component: withGuest(RegisterPage),
		path: "/signup",
	},
	{
		Component: withGuest(Verify),
		path: "/verify",
	},
	{
		Component: withGuest(ForgotPassword),
		path: "/forgot-password",
	},
	{
		Component: ResetPassword,
		path: "/reset-password",
	},
	{
		Component: Unauthorized,
		path: "/unauthorized",
	},
]);
