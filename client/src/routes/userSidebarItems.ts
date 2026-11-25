import { type ISidebarItem } from "@/types";
import { BadgeCheck, ShieldCheck, Ticket, UserRound } from "lucide-react";
import { lazy } from "react";

const Bookings = lazy(() => import("@/pages/User/Bookings"));
const BookingDetail = lazy(() => import("@/pages/User/BookingDetail"));
const Profile = lazy(() => import("@/pages/User/Profile"));
const Security = lazy(() => import("@/pages/User/Security"));
const BecomeGuide = lazy(() => import("@/pages/User/BecomeGuide"));

export const userSidebarItems: ISidebarItem[] = [
	{
		title: "My trips",
		items: [
			{ title: "Bookings", url: "/user/bookings", component: Bookings, icon: Ticket },
			{ title: "Booking details", url: "/user/bookings/:bookingId", component: BookingDetail, hidden: true },
		],
	},
	{
		title: "Account",
		items: [
			{ title: "Profile", url: "/user/profile", component: Profile, icon: UserRound },
			{ title: "Security", url: "/user/security", component: Security, icon: ShieldCheck },
			{ title: "Become a guide", url: "/user/become-a-guide", component: BecomeGuide, icon: BadgeCheck },
		],
	},
];
