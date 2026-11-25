import Bookings from "@/pages/User/Bookings";
import { type ISidebarItem } from "@/types";
import { Ticket } from "lucide-react";

export const userSidebarItems: ISidebarItem[] = [
	{
		title: "History",
		items: [
			{
				title: "Bookings",
				url: "/user/bookings",
				component: Bookings,
				icon: Ticket,
			},
		],
	},
];
