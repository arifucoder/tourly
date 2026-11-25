import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { dashCard } from "./styles";

export default function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
	return (
		<div className={cn(dashCard, "flex flex-col gap-3 px-4.5 py-4")}>
			<span className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
				<Icon aria-hidden="true" className="size-4.25 shrink-0 text-primary-text" strokeWidth={1.9} />
				{label}
			</span>
			<span className="text-[26px] leading-tight font-semibold tabular-nums">{value}</span>
		</div>
	);
}
