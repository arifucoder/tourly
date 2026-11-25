import type { ISidebarItem } from "@/types";
import { CalendarCheck } from "lucide-react";
import { lazy } from "react";

const AssignedTrips = lazy(() => import("@/pages/Guide/AssignedTrips"));

export const guideSidebarItems: ISidebarItem[] = [
	{
		title: "Guiding",
		items: [{ title: "My trips", url: "/guide", component: AssignedTrips, icon: CalendarCheck }],
	},
];
