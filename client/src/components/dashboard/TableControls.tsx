import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ComponentProps } from "react";
import { btnGhost, btnSm, dashInput } from "./styles";

export function SearchField({ label, className, ...props }: ComponentProps<"input"> & { label: string }) {
	return (
		<div className={cn("relative min-w-0 flex-[1_1_240px]", className)}>
			<label htmlFor={props.id} className="sr-only">
				{label}
			</label>
			<Search
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
			/>
			<input type="search" {...props} className={cn(dashInput, "pl-10")} />
		</div>
	);
}

export function SelectField({
	label,
	options,
	className,
	...props
}: ComponentProps<"select"> & { label: string; options: { value: string; label: string }[] }) {
	return (
		<label className={cn("min-w-0 flex-[0_1_170px]", className)}>
			<span className="sr-only">{label}</span>
			<select {...props} className={cn(dashInput, "cursor-pointer pr-8")}>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</label>
	);
}

export function Pagination({
	page,
	totalPage,
	total,
	limit,
	noun = "results",
	disabled,
	onChange,
}: {
	page: number;
	totalPage: number;
	total: number;
	limit: number;
	noun?: string;
	disabled?: boolean;
	onChange: (page: number) => void;
}) {
	const from = total === 0 ? 0 : (page - 1) * limit + 1;
	const to = Math.min(page * limit, total);

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3.5">
			<span className="text-sm text-muted-foreground">
				Showing {from.toLocaleString("en-IN")}–{to.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")} {noun}
			</span>
			<div className="flex gap-2">
				<button
					type="button"
					className={cn(btnGhost, btnSm)}
					disabled={disabled || page <= 1}
					onClick={() => onChange(page - 1)}
				>
					Previous
				</button>
				<button
					type="button"
					className={cn(btnGhost, btnSm)}
					disabled={disabled || page >= totalPage}
					onClick={() => onChange(page + 1)}
				>
					Next
				</button>
			</div>
		</div>
	);
}

const pageWindow = (page: number, totalPage: number): (number | "…")[] => {
	if (totalPage <= 7) return Array.from({ length: totalPage }, (_, i) => i + 1);
	const pages = new Set([1, totalPage, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPage));
	const sorted = [...pages].sort((a, b) => a - b);
	return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (["…", p] as const) : [p]));
};

export function PageNumbers({
	page,
	totalPage,
	total,
	limit,
	noun = "results",
	disabled,
	onChange,
}: {
	page: number;
	totalPage: number;
	total: number;
	limit: number;
	noun?: string;
	disabled?: boolean;
	onChange: (page: number) => void;
}) {
	const from = total === 0 ? 0 : (page - 1) * limit + 1;
	const to = Math.min(page * limit, total);
	const pg =
		"inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] border border-border bg-card px-2.5 text-sm font-semibold transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40";

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3.5">
			<span className="text-sm text-muted-foreground">
				Showing {from}–{to} of {total.toLocaleString("en-IN")} {noun}
			</span>
			{totalPage > 1 && (
				<nav aria-label="Pagination" className="flex gap-1.5">
					<button
						type="button"
						className={pg}
						aria-label="Previous page"
						disabled={disabled || page <= 1}
						onClick={() => onChange(page - 1)}
					>
						<ChevronLeft className="size-4" />
					</button>
					{pageWindow(page, totalPage).map((item, i) =>
						item === "…" ? (
							<span key={`gap-${i}`} className={cn(pg, "border-transparent bg-transparent hover:bg-transparent max-sm:hidden")}>
								…
							</span>
						) : (
							<button
								key={item}
								type="button"
								aria-current={item === page ? "page" : undefined}
								disabled={disabled}
								onClick={() => onChange(item)}
								className={cn(
									pg,
									"max-sm:hidden",
									item === page &&
										"border-primary bg-primary text-primary-foreground hover:bg-primary max-sm:inline-flex",
								)}
							>
								{item}
							</button>
						),
					)}
					<button
						type="button"
						className={pg}
						aria-label="Next page"
						disabled={disabled || page >= totalPage}
						onClick={() => onChange(page + 1)}
					>
						<ChevronRight className="size-4" />
					</button>
				</nav>
			)}
		</div>
	);
}
