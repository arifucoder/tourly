import type { ISidebarItem } from "@/types";
import { BadgeCheck, CalendarCheck, ShieldCheck, UserRound } from "lucide-react";
import { lazy } from "react";

const AssignedTrips = lazy(() => import("@/pages/Guide/AssignedTrips"));
const GuideProfile = lazy(() => import("@/pages/Guide/GuideProfile"));
const Profile = lazy(() => import("@/pages/User/Profile"));
const Security = lazy(() => import("@/pages/User/Security"));

export const guideSidebarItems: ISidebarItem[] = [
	{
		title: "Guiding",
		items: [
			{ title: "My trips", url: "/guide", component: AssignedTrips, icon: CalendarCheck },
			{ title: "Guide profile", url: "/guide/guide-profile", component: GuideProfile, icon: BadgeCheck },
		],
	},
	{
		title: "Account",
		items: [
			{ title: "Profile", url: "/guide/profile", component: Profile, icon: UserRound },
			{ title: "Security", url: "/guide/security", component: Security, icon: ShieldCheck },
		],
	},
];
