import type { ISidebarItem } from "@/types";
import {
	BadgeCheck,
	ChartColumn,
	LayoutDashboard,
	Map,
	Mountain,
	ShieldCheck,
	Tag,
	Ticket,
	UserRound,
	Users,
} from "lucide-react";
import { lazy } from "react";

const Overview = lazy(() => import("@/pages/Admin/Overview"));
const Analytics = lazy(() => import("@/pages/Admin/Analytics"));
const Tours = lazy(() => import("@/pages/Admin/Tours"));
const TourForm = lazy(() => import("@/pages/Admin/AddTour"));
const TourTypes = lazy(() => import("@/pages/Admin/AddTourType"));
const Divisions = lazy(() => import("@/pages/Admin/AddDivision"));
const Bookings = lazy(() => import("@/pages/Admin/Bookings"));
const UsersPage = lazy(() => import("@/pages/Admin/Users"));
const GuideApplications = lazy(() => import("@/pages/Admin/GuideApplications"));
const Profile = lazy(() => import("@/pages/User/Profile"));
const Security = lazy(() => import("@/pages/User/Security"));

export const adminSidebarItems: ISidebarItem[] = [
	{
		title: "Overview",
		items: [
			{ title: "Dashboard", url: "/admin", component: Overview, icon: LayoutDashboard },
			{ title: "Analytics", url: "/admin/analytics", component: Analytics, icon: ChartColumn },
		],
	},
	{
		title: "Catalogue",
		items: [
			{ title: "Tours", url: "/admin/tours", component: Tours, icon: Mountain },
			{ title: "New tour", url: "/admin/tours/new", component: TourForm, hidden: true },
			{ title: "Edit tour", url: "/admin/tours/:slug/edit", component: TourForm, hidden: true },
			{ title: "Tour types", url: "/admin/tour-types", component: TourTypes, icon: Tag },
			{ title: "Divisions", url: "/admin/divisions", component: Divisions, icon: Map },
		],
	},
	{
		title: "Operations",
		items: [
			{ title: "Bookings", url: "/admin/bookings", component: Bookings, icon: Ticket },
			{ title: "Users", url: "/admin/users", component: UsersPage, icon: Users },
			{ title: "Guide applications", url: "/admin/guide-applications", component: GuideApplications, icon: BadgeCheck },
		],
	},
	{
		title: "Account",
		items: [
			{ title: "Profile", url: "/admin/profile", component: Profile, icon: UserRound },
			{ title: "Security", url: "/admin/security", component: Security, icon: ShieldCheck },
		],
	},
];
