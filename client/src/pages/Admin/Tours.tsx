import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import PageHeader from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState } from "@/components/dashboard/States";
import { btnPrimary, dashCard, iconBtn, td, th } from "@/components/dashboard/styles";
import { PageNumbers, SearchField, SelectField } from "@/components/dashboard/TableControls";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDateRange, formatNumber, formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
	type TTourStatus,
	useGetTourFilterOptionsQuery,
	useGetToursQuery,
	useRemoveTourMutation,
} from "@/redux/features/Tour/tour.api";
import type { TApiError } from "@/types";
import { ImageIcon, MapPinned, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const LIMIT = 10;
const COLS = 8;

const SORTS = [
	{ value: "-createdAt", label: "Newest first" },
	{ value: "costFrom", label: "Price: low to high" },
	{ value: "-costFrom", label: "Price: high to low" },
	{ value: "startDate", label: "Departure: soonest" },
];

const STATUSES: { value: TTourStatus; label: string }[] = [
	{ value: "all", label: "All statuses" },
	{ value: "active", label: "Active" },
	{ value: "expired", label: "Expired" },
];

export default function Tours() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [division, setDivision] = useState("");
	const [tourType, setTourType] = useState("");
	const [sort, setSort] = useState("-createdAt");
	const [status, setStatus] = useState<TTourStatus>("all");

	const searchTerm = useDebouncedValue(search.trim());

	const { data, isLoading, isError, isFetching, refetch } = useGetToursQuery({
		page,
		limit: LIMIT,
		sort,
		status,
		...(searchTerm && { searchTerm }),
		...(division && { division }),
		...(tourType && { tourType }),
	});
	const { data: options } = useGetTourFilterOptionsQuery("all");
	const [removeTour] = useRemoveTourMutation();

	const tours = data?.data ?? [];
	const meta = data?.meta;
	const hasFilters = Boolean(searchTerm || division || tourType || status !== "all");

	const handleRemoveTour = async (id: string) => {
		const toastId = toast.loading("Deleting tour…");
		try {
			await removeTour(id).unwrap();
			toast.success("Tour deleted", { id: toastId });
			if (tours.length === 1 && page > 1) setPage((p) => p - 1);
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't delete tour", { id: toastId });
		}
	};

	const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
		setter(value);
		setPage(1);
	};

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title="Tours"
				description={
					options
						? `${formatNumber(options.totalTours)} tours · ${formatNumber(options.divisions.length)} divisions`
						: "Loading…"
				}
				actions={
					<Link to="/admin/tours/new" className={btnPrimary}>
						<Plus strokeWidth={2.4} />
						New tour
					</Link>
				}
			/>

			<section className={cn(dashCard, "overflow-hidden")}>
				<div className="flex flex-wrap gap-3 border-b border-border p-4">
					<SearchField
						id="at-q"
						label="Search tours"
						placeholder="Search by title or location"
						value={search}
						className="flex-[1_1_260px]"
						onChange={(event) => resetPage(setSearch)(event.target.value)}
					/>
					<SelectField
						label="Division"
						className="flex-[0_1_190px]"
						value={division}
						onChange={(event) => resetPage(setDivision)(event.target.value)}
						options={[
							{ value: "", label: "All divisions" },
							...(options?.divisions ?? []).map((item) => ({ value: item._id, label: item.name })),
						]}
					/>
					<SelectField
						label="Tour type"
						value={tourType}
						onChange={(event) => resetPage(setTourType)(event.target.value)}
						options={[
							{ value: "", label: "All types" },
							...(options?.tourTypes ?? []).map((item) => ({ value: item._id, label: item.name })),
						]}
					/>
					<SelectField
						label="Status"
						value={status}
						onChange={(event) => resetPage(setStatus)(event.target.value as TTourStatus)}
						options={STATUSES}
					/>
					<SelectField
						label="Sort"
						value={sort}
						onChange={(event) => resetPage(setSort)(event.target.value)}
						options={SORTS}
					/>
				</div>

				<div className="relative overflow-x-auto">
					<table className="w-full min-w-240 border-collapse text-sm">
						<thead>
							<tr className="border-b border-border">
								<th scope="col" className={th}>
									Tour
								</th>
								<th scope="col" className={th}>
									Division
								</th>
								<th scope="col" className={th}>
									Type
								</th>
								<th scope="col" className={th}>
									Dates
								</th>
								<th scope="col" className={cn(th, "text-right")}>
									Price
								</th>
								<th scope="col" className={cn(th, "text-right")}>
									Max guests
								</th>
								<th scope="col" className={cn(th, "text-right")}>
									Bookings
								</th>
								<th scope="col" className={cn(th, "text-right")}>
									Actions
								</th>
							</tr>
						</thead>

						<tbody className={cn(isFetching && !isLoading && "opacity-60 transition-opacity")}>
							{isLoading &&
								Array.from({ length: 6 }).map((_, i) => (
									<tr key={i} className="border-b border-border" aria-hidden="true">
										<td className={td}>
											<div className="flex items-center gap-3">
												<Skeleton className="h-10 w-13 rounded-lg" />
												<div className="flex flex-col gap-1.5">
													<Skeleton className="h-3.5 w-44" />
													<Skeleton className="h-3 w-28" />
												</div>
											</div>
										</td>
										{Array.from({ length: COLS - 1 }).map((__, col) => (
											<td key={col} className={td}>
												<Skeleton className="h-3.5 w-16" />
											</td>
										))}
									</tr>
								))}

							{isError && (
								<tr>
									<td colSpan={COLS}>
										<ErrorState title="Couldn't load tours" onRetry={refetch} />
									</td>
								</tr>
							)}

							{!isLoading && !isError && tours.length === 0 && (
								<tr>
									<td colSpan={COLS}>
										<EmptyState
											icon={hasFilters ? SearchX : MapPinned}
											title={hasFilters ? "No tours match these filters" : "No tours yet"}
											description={
												hasFilters
													? "Try another division, type or status, or clear the search."
													: "Create the first tour and it will appear on its public page."
											}
											action={
												!hasFilters && (
													<Link to="/admin/tours/new" className={btnPrimary}>
														<Plus strokeWidth={2.4} />
														New tour
													</Link>
												)
											}
										/>
									</td>
								</tr>
							)}

							{tours.map((tour) => (
								<tr key={tour._id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
									<td className={td}>
										<div className="flex items-center gap-3">
											<span className="flex h-10 w-13 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-placeholder text-placeholder-foreground">
												{tour.images?.[0] ? (
													<img src={tour.images[0]} alt="" loading="lazy" className="size-full object-cover" />
												) : (
													<ImageIcon className="size-4" />
												)}
											</span>
											<div className="min-w-0">
												<Link
													to={`/tours/${tour.slug}`}
													className="block max-w-64 truncate font-semibold hover:text-primary-text"
													title={tour.title}
												>
													{tour.title}
												</Link>
												<div className="max-w-64 truncate text-[12.5px] text-muted-foreground">/{tour.slug}</div>
											</div>
										</div>
									</td>
									<td className={td}>{tour.division?.name ?? "—"}</td>
									<td className={td}>{tour.tourType ? <Badge tone="accent">{tour.tourType.name}</Badge> : "—"}</td>
									<td className={cn(td, "whitespace-nowrap tabular-nums")}>
										<div className="flex flex-col items-start gap-1">
											{formatDateRange(tour.startDate, tour.endDate)}
											{tour.isExpired ? (
												<Badge tone="neutral">Expired</Badge>
											) : (
												<Badge tone="success">Active</Badge>
											)}
										</div>
									</td>
									<td className={cn(td, "text-right font-semibold whitespace-nowrap tabular-nums")}>
										{formatTaka(tour.costFrom)}
									</td>
									<td className={cn(td, "text-right tabular-nums")}>{tour.maxGuest ?? "—"}</td>
									<td className={cn(td, "text-right tabular-nums")}>{formatNumber(tour.bookingsCount)}</td>
									<td className={td}>
										<div className="flex justify-end gap-1.5">
											<Link to={`/admin/tours/${tour.slug}/edit`} className={iconBtn} aria-label={`Edit ${tour.title}`}>
												<Pencil />
											</Link>
											<DeleteConfirmation
												itemName={tour.title}
												description="The tour, its images and its tour plan will be removed. Existing bookings keep their invoices. This can't be undone."
												confirmText="Delete tour"
												onConfirm={() => handleRemoveTour(tour._id)}
											>
												<button
													type="button"
													className={cn(iconBtn, "text-destructive")}
													aria-label={`Delete ${tour.title}`}
												>
													<Trash2 />
												</button>
											</DeleteConfirmation>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{meta && meta.total > 0 && (
					<PageNumbers
						page={page}
						totalPage={meta.totalPage}
						total={meta.total}
						limit={LIMIT}
						noun="tours"
						disabled={isFetching}
						onChange={setPage}
					/>
				)}
			</section>
		</div>
	);
}
