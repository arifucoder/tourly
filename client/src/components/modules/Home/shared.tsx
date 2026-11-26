import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const container = "mx-auto w-full max-w-300 px-4 sm:px-10";

export const sectionTop = "pt-18 sm:pt-28";

export const btnOrange =
	"inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6.5 text-[15px] font-semibold whitespace-nowrap text-primary-foreground shadow-[0_14px_28px_rgb(255_123_41/0.32)] transition-colors hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function SectionHead({
	title,
	text,
	action,
	className,
}: {
	title: string;
	text: string;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
			<div className="flex max-w-120 flex-col gap-3">
				<h2 className="text-[28px] leading-tight font-bold tracking-[-0.01em] sm:text-[38px]">{title}</h2>
				<p className="text-muted-foreground">{text}</p>
			</div>
			{action}
		</div>
	);
}
