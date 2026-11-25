import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { btnGhost } from "./styles";

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: {
	icon: LucideIcon;
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col items-center gap-3 px-7 py-10 text-center", className)}>
			<span className="flex size-22 items-center justify-center rounded-3xl bg-surface-2 text-primary-text">
				<Icon className="size-9" strokeWidth={1.6} />
			</span>
			<h3 className="text-lg font-semibold">{title}</h3>
			{description && <p className="max-w-sm text-[14.5px] text-muted-foreground">{description}</p>}
			{action && <div className="mt-1 flex flex-wrap justify-center gap-2.5">{action}</div>}
		</div>
	);
}

export function ErrorState({
	title = "Couldn't load this",
	onRetry,
	className,
}: {
	title?: string;
	onRetry?: () => void;
	className?: string;
}) {
	return (
		<div role="alert" className={cn("flex flex-col items-center gap-3 px-7 py-10 text-center", className)}>
			<span className="flex size-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
				<AlertCircle className="size-5" />
			</span>
			<div>
				<p className="font-semibold">{title}</p>
				<p className="text-[13.5px] text-muted-foreground">Check your connection and try again.</p>
			</div>
			{onRetry && (
				<button type="button" onClick={onRetry} className={cn(btnGhost, "h-10")}>
					<RefreshCw />
					Try again
				</button>
			)}
		</div>
	);
}

export function TableSkeleton({ rows = 6, cols }: { rows?: number; cols: number }) {
	return (
		<>
			{Array.from({ length: rows }).map((_, row) => (
				<tr key={row} className="border-t border-border" aria-hidden="true">
					{Array.from({ length: cols }).map((__, col) => (
						<td key={col} className="px-4 py-3.5">
							{col === 0 ? (
								<div className="flex items-center gap-3">
									<Skeleton className="size-9 rounded-full" />
									<div className="flex flex-col gap-1.5">
										<Skeleton className="h-3.5 w-32" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
							) : (
								<Skeleton className="h-3.5 w-16" />
							)}
						</td>
					))}
				</tr>
			))}
		</>
	);
}
