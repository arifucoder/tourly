import TourCard from "@/components/modules/Tour/TourCard";
import TourFilters, {
	countActiveFilters,
	emptyTourFilters,
	tourInputCls,
	tourPrimaryBtn,
	type TTourFilters,
} from "@/components/modules/Tour/TourFilters";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetTourFilterOptionsQuery, useGetToursQuery } from "@/redux/features/Tour/tour.api";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search, SearchX } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";

const LIMIT = 12;

const SORT_OPTIONS = [
	{ value: "-createdAt", label: "Newest first" },
	{ value: "costFrom", label: "Price: low to high" },
	{ value: "-costFrom", label: "Price: high to low" },
];

const gridCls = "grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-6";

const outlineBtn =
	"inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-primary bg-transparent px-5.5 text-[14.5px] font-medium whitespace-nowrap text-primary-text transition-colors hover:bg-accent";

const squareBtn =
	"inline-flex h-11 min-w-11 items-center justify-center rounded-[10px] border-[1.5px] border-border bg-card px-2.5 font-medium text-foreground transition-colors hover:border-primary/50 disabled:pointer-events-none disabled:opacity-50";

const squareActive =
	"border-primary bg-primary text-primary-foreground shadow-[0_10px_22px_rgb(255_123_41/0.25)] hover:border-primary";

const getPageNumbers = (current: number, total: number): (number | "…")[] => {
	if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
	const pages: (number | "…")[] = [1];
	if (current > 3) pages.push("…");
	for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
	if (current < total - 2) pages.push("…");
	pages.push(total);
	return pages;
};

const filtersFromParams = (params: URLSearchParams): TTourFilters => ({
	divisions: params.get("division")?.split(",").filter(Boolean) ?? [],
	tourType: params.get("tourType") ?? "",
	location: params.get("location") ?? "",
});

function StateCard({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-[14px] bg-card px-6 py-16 text-center shadow-soft">
			{children}
		</div>
	);
}

export default function Tours() {
	const [searchParams] = useSearchParams();
	const initialSearch = searchParams.get("searchTerm") ?? "";

	const [searchInput, setSearchInput] = useState(initialSearch);
	const [searchTerm, setSearchTerm] = useState(initialSearch);
	const [applied, setApplied] = useState<TTourFilters>(() => filtersFromParams(searchParams));
	const [draft, setDraft] = useState<TTourFilters>(applied);
	const [sort, setSort] = useState("-createdAt");
	const [page, setPage] = useState(1);
	const [sheetOpen, setSheetOpen] = useState(false);

	const { data, isLoading, isError, isFetching, refetch } = useGetToursQuery({
		page,
		limit: LIMIT,
		sort,
		...(searchTerm && { searchTerm }),
		...(applied.divisions.length > 0 && { division: applied.divisions.join(",") }),
		...(applied.tourType && { tourType: applied.tourType }),
		...(applied.location && { location: applied.location }),
		...(applied.minPrice !== undefined && { minPrice: applied.minPrice }),
		...(applied.maxPrice !== undefined && { maxPrice: applied.maxPrice }),
	});
	const { data: filterOptions } = useGetTourFilterOptionsQuery();

	const tours = data?.data ?? [];
	const total = data?.meta?.total ?? 0;
	const totalPage = data?.meta?.totalPage ?? 1;
	const activeCount = countActiveFilters(applied);

	const handleSearch = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSearchTerm(searchInput.trim());
		setPage(1);
	};
	const handleApply = () => {
		setApplied(draft);
		setPage(1);
		setSheetOpen(false);
	};
	const handleReset = () => {
		setDraft(emptyTourFilters);
		setApplied(emptyTourFilters);
		setPage(1);
	};
	const handleClearAll = () => {
		handleReset();
		setSearchInput("");
		setSearchTerm("");
	};
	const goToPage = (p: number) => {
		setPage(p);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const filterProps = {
		options: filterOptions,
		value: draft,
		onChange: setDraft,
		onApply: handleApply,
		onReset: handleReset,
	};

	return (
		<div className="bg-background">
			<section className="bg-surface-2">
				<div className="mx-auto flex max-w-300 flex-col gap-4.5 px-4 py-12 sm:px-10">
					<nav aria-label="Breadcrumb" className="flex gap-2 text-[13.5px] text-muted-foreground">
						<Link to="/" className="hover:text-foreground">
							Home
						</Link>
						<span aria-hidden="true">/</span>
						<span className="font-medium text-primary-text">Tours</span>
					</nav>

					<h1 className="text-[28px] font-bold sm:text-[40px]">Find your tour</h1>

					<form
						role="search"
						onSubmit={handleSearch}
						className="flex max-w-180 flex-col gap-2.5 rounded-[14px] bg-card p-2.5 shadow-soft sm:flex-row"
					>
						<label htmlFor="tour-search" className="sr-only">
							Search tours
						</label>
						<div className="relative flex-1">
							<Search className="pointer-events-none absolute top-3.5 left-3.5 size-4.5 text-muted-foreground" />
							<input
								id="tour-search"
								type="search"
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder="Search by tour name or location…"
								className={cn(tourInputCls, "border-transparent pl-10.5")}
							/>
						</div>
						<button type="submit" className={tourPrimaryBtn}>
							Search
						</button>
					</form>
				</div>
			</section>

			<div className="mx-auto flex max-w-300 flex-wrap items-start gap-8 px-4 pt-10 pb-22 sm:px-10">
				<aside
					aria-label="Filters"
					className="hidden shrink-0 grow-0 basis-70 rounded-[14px] bg-card p-6 shadow-soft min-[981px]:block"
				>
					<TourFilters {...filterProps} idPrefix="desk" />
				</aside>

				<main className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
						<p>
							{isLoading ? (
								<span className="text-muted-foreground">Loading tours…</span>
							) : (
								<>
									<strong>
										{total} {total === 1 ? "tour" : "tours"}
									</strong>{" "}
									<span className="text-muted-foreground">found{searchTerm && <> for “{searchTerm}”</>}</span>
								</>
							)}
						</p>

						<div className="flex items-center gap-2.5">
							<Sheet
								open={sheetOpen}
								onOpenChange={(open) => {
									if (open) setDraft(applied);
									setSheetOpen(open);
								}}
							>
								<SheetTrigger className={cn(outlineBtn, "flex-1 min-[981px]:hidden")}>
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										aria-hidden="true"
									>
										<path d="M4 6h16M7 12h10M10 18h4" />
									</svg>
									Filters{activeCount > 0 && ` · ${activeCount}`}
								</SheetTrigger>
								<SheetContent side="left" className="w-80 overflow-y-auto bg-background p-6">
									<SheetHeader className="sr-only">
										<SheetTitle>Filters</SheetTitle>
									</SheetHeader>
									<TourFilters {...filterProps} idPrefix="mob" />
								</SheetContent>
							</Sheet>

							<label htmlFor="tour-sort" className="hidden text-sm text-muted-foreground sm:block">
								Sort by
							</label>
							<select
								id="tour-sort"
								value={sort}
								onChange={(e) => {
									setSort(e.target.value);
									setPage(1);
								}}
								className={cn(tourInputCls, "w-auto min-w-47.5 flex-1")}
							>
								{SORT_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</div>
					</div>

					{isLoading && (
						<div className={gridCls}>
							{Array.from({ length: 6 }).map((_, i) => (
								<div key={i} className="overflow-hidden rounded-[14px] bg-card shadow-soft">
									<Skeleton className="h-50 rounded-none" />
									<div className="flex flex-col gap-2.5 p-4.5">
										<Skeleton className="h-3.5 w-28" />
										<Skeleton className="h-5 w-full" />
										<Skeleton className="h-3.5 w-40" />
										<Skeleton className="mt-2 h-6 w-24" />
									</div>
								</div>
							))}
						</div>
					)}

					{isError && (
						<StateCard>
							<span className="flex size-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
								<AlertCircle className="size-5" />
							</span>
							<div>
								<p className="font-semibold">Couldn't load tours</p>
								<p className="text-[13.5px] text-muted-foreground">Check your connection and try again.</p>
							</div>
							<button type="button" onClick={() => refetch()} className={outlineBtn}>
								<RefreshCw className="size-4" />
								Try again
							</button>
						</StateCard>
					)}

					{!isLoading && !isError && tours.length === 0 && (
						<StateCard>
							<span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
								<SearchX className="size-5" />
							</span>
							<div>
								<p className="font-semibold">No tours found</p>
								<p className="text-[13.5px] text-muted-foreground">Try a different search or clear the filters.</p>
							</div>
							<button type="button" onClick={handleClearAll} className={outlineBtn}>
								Clear search & filters
							</button>
						</StateCard>
					)}

					{!isLoading && !isError && tours.length > 0 && (
						<div className={cn(gridCls, "transition-opacity", isFetching && "opacity-60")}>
							{tours.map((tour) => (
								<TourCard key={tour._id} tour={tour} />
							))}
						</div>
					)}

					{!isLoading && !isError && totalPage > 1 && (
						<nav aria-label="Pagination" className="flex flex-wrap justify-center gap-2 pt-4">
							<button
								type="button"
								onClick={() => goToPage(page - 1)}
								disabled={page === 1 || isFetching}
								aria-label="Previous page"
								className={squareBtn}
							>
								<ChevronLeft className="size-4.5" strokeWidth={2.2} />
							</button>

							{getPageNumbers(page, totalPage).map((p, i) =>
								p === "…" ? (
									<span key={`dots-${i}`} className={cn(squareBtn, "border-transparent bg-transparent")}>
										…
									</span>
								) : (
									<button
										key={p}
										type="button"
										onClick={() => goToPage(p)}
										disabled={isFetching}
										aria-current={p === page ? "page" : undefined}
										className={cn(squareBtn, p === page && squareActive)}
									>
										{p}
									</button>
								),
							)}

							<button
								type="button"
								onClick={() => goToPage(page + 1)}
								disabled={page >= totalPage || isFetching}
								aria-label="Next page"
								className={squareBtn}
							>
								<ChevronRight className="size-4.5" strokeWidth={2.2} />
							</button>
						</nav>
					)}
				</main>
			</div>
		</div>
	);
}
