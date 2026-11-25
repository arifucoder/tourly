import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function StatusTabs<T extends string>({
	label,
	tabs,
	value,
	counts,
	onChange,
}: {
	label: string;
	tabs: { key: T; label: string }[];
	value: T;
	counts?: Partial<Record<T, number | undefined>>;
	onChange: (key: T) => void;
}) {
	return (
		<div role="tablist" aria-label={label} className="-mb-0.5 flex gap-2 overflow-x-auto pb-0.5">
			{tabs.map((tab) => {
				const on = tab.key === value;
				const count = counts?.[tab.key];
				return (
					<button
						key={tab.key}
						type="button"
						role="tab"
						aria-selected={on}
						onClick={() => onChange(tab.key)}
						className={cn(
							"inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
							on && "border-foreground bg-foreground text-background hover:text-background",
						)}
					>
						{tab.label}
						{count !== undefined && <span className="font-medium opacity-80">{formatNumber(count)}</span>}
					</button>
				);
			})}
		</div>
	);
}
