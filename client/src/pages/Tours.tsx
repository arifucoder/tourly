import TourCard from "@/components/modules/Tour/TourCard";
import TourFilters, { type TTourFilters } from "@/components/modules/Tour/TourFilters";
import { countActiveFilters, emptyTourFilters } from "@/components/modules/Tour/tourFilters.utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { inputCls, outlineBtn, primaryBtn } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useGetTourFilterOptionsQuery, useGetTourPagesInfiniteQuery } from "@/redux/features/Tour/tour.api";
import { AlertCircle, Loader2, RefreshCw, Search, SearchX } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";

const LIMIT = 12;

const SORT_OPTIONS = [
	{ value: "-createdAt", label: "Newest first" },
	{ value: "costFrom", label: "Price: low to high" },
	{ value: "-costFrom", label: "Price: high to low" },
];

const gridCls = "grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-6";

function TourCardSkeleton() {
	return (
		<div className="overflow-hidden rounded-[14px] bg-card shadow-soft">
			<Skeleton className="h-50 rounded-none" />
			<div className="flex flex-col gap-2.5 p-4.5">
				<Skeleton className="h-3.5 w-28" />
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-3.5 w-40" />
				<Skeleton className="mt-2 h-6 w-24" />
			</div>
		</div>
	);
}

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
	const [filters, setFilters] = useState<TTourFilters>(() => filtersFromParams(searchParams));
	// wait until the user stops dragging or typing before asking for new prices
	const minPrice = useDebouncedValue(filters.minPrice, 400);
	const maxPrice = useDebouncedValue(filters.maxPrice, 400);
	const [sort, setSort] = useState("-createdAt");
	const [sheetOpen, setSheetOpen] = useState(false);

	const tourQuery = {
		limit: LIMIT,
		sort,
		...(searchTerm && { searchTerm }),
		...(filters.divisions.length > 0 && { division: filters.divisions.join(",") }),
		...(filters.tourType && { tourType: filters.tourType }),
		...(filters.location && { location: filters.location }),
		...(minPrice !== undefined && { minPrice }),
		...(maxPrice !== undefined && { maxPrice }),
	};
	const { data, isLoading, isError, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
		useGetTourPagesInfiniteQuery(tourQuery);
	const { data: filterOptions } = useGetTourFilterOptionsQuery();

	const tours = data?.pages.flatMap((pageData) => pageData.data) ?? [];
	const total = data?.pages[0]?.meta?.total ?? 0;
	const activeCount = countActiveFilters(filters);

	// load the next page when the sentinel below the grid comes near the viewport
	const sentinelRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !hasNextPage) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
			},
			{ rootMargin: "400px 0px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const handleSearch = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSearchTerm(searchInput.trim());
	};
	const handleReset = () => setFilters(emptyTourFilters);
	const handleClearAll = () => {
		handleReset();
		setSearchInput("");
		setSearchTerm("");
	};

	const filterProps = {
		options: filterOptions,
		value: filters,
		onChange: setFilters,
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
								className={cn(inputCls, "border-transparent pl-10.5")}
							/>
						</div>
						<button type="submit" className={primaryBtn}>
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
								onOpenChange={setSheetOpen}
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
									<TourFilters
										{...filterProps}
										idPrefix="mob"
										footer={
											<button type="button" onClick={() => setSheetOpen(false)} className={primaryBtn}>
												{isFetching && !isFetchingNextPage ? "Updating…" : `Show ${total} ${total === 1 ? "tour" : "tours"}`}
											</button>
										}
									/>
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
								}}
								className={cn(inputCls, "w-auto min-w-47.5 flex-1")}
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
								<TourCardSkeleton key={i} />
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
						<>
							<div
								className={cn(gridCls, "transition-opacity", isFetching && !isFetchingNextPage && "opacity-60")}
							>
								{tours.map((tour) => (
									<TourCard key={tour._id} tour={tour} />
								))}
								{isFetchingNextPage &&
									Array.from({ length: 3 }).map((_, i) => <TourCardSkeleton key={`next-${i}`} />)}
							</div>

							<div ref={sentinelRef} className="flex justify-center pt-2" aria-live="polite">
								{hasNextPage ? (
									<button
										type="button"
										onClick={() => void fetchNextPage()}
										disabled={isFetchingNextPage}
										className={outlineBtn}
									>
										{isFetchingNextPage ? (
											<>
												<Loader2 className="size-4 animate-spin" />
												Loading more tours…
											</>
										) : (
											"Load more tours"
										)}
									</button>
								) : (
									<p className="text-[13.5px] text-muted-foreground">
										You've seen all {total} {total === 1 ? "tour" : "tours"}.
									</p>
								)}
							</div>
						</>
					)}
				</main>
			</div>
		</div>
	);
}
