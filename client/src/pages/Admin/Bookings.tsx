import PageHeader from "@/components/dashboard/PageHeader";
import { BookingStatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/dashboard/States";
import { btnGhost, btnSm, dashCard, td, th } from "@/components/dashboard/styles";
import { Pagination, SearchField, SelectField } from "@/components/dashboard/TableControls";
import BookingDetailSheet from "@/components/modules/Admin/Booking/BookingDetailSheet";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { axiosInstance } from "@/lib/axios";
import { formatDate, formatDateRange, formatNumber, formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetAllBookingsQuery, useGetBookingSummaryQuery } from "@/redux/features/Booking/booking.api";
import type { TBookingStatus } from "@/types";
import { Download, SearchX, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

const LIMIT = 10;
const COLS = 9;
const cell = "px-3.5";

const TABS: { key: TBookingStatus | "ALL"; label: string }[] = [
	{ key: "ALL", label: "All" },
	{ key: "PENDING", label: "Pending" },
	{ key: "COMPLETE", label: "Complete" },
	{ key: "CANCEL", label: "Cancelled" },
	{ key: "FAILED", label: "Failed" },
];

const RANGES = [
	{ value: "all", label: "All time" },
	{ value: "30", label: "Last 30 days" },
	{ value: "180", label: "Last 6 months" },
];

const isStatus = (value: string | null): value is TBookingStatus =>
	value === "PENDING" || value === "COMPLETE" || value === "CANCEL" || value === "FAILED";

const rangeFrom = (range: string) => {
	if (range === "all") return undefined;
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	date.setDate(date.getDate() - Number(range) + 1);
	return date.toISOString();
};

export default function Bookings() {
	const [searchParams, setSearchParams] = useSearchParams();
	const statusParam = searchParams.get("status");
	const status = isStatus(statusParam) ? statusParam : undefined;

	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [range, setRange] = useState("all");
	const [openId, setOpenId] = useState<string | null>(null);
	const [exporting, setExporting] = useState(false);

	const searchTerm = useDebouncedValue(search.trim());
	const from = useMemo(() => rangeFrom(range), [range]);

	const filters = {
		...(status && { status }),
		...(searchTerm && { searchTerm }),
		...(from && { from }),
	};

	const { data, isLoading, isError, isFetching, refetch } = useGetAllBookingsQuery({ page, limit: LIMIT, ...filters });
	const { data: counts } = useGetBookingSummaryQuery(from ? { from } : {});

	const bookings = data?.data ?? [];
	const meta = data?.meta;
	const activeTab = TABS.find((tab) => tab.key === (status ?? "ALL")) ?? TABS[0];

	const pickTab = (key: TBookingStatus | "ALL") => {
		setPage(1);
		setSearchParams(key === "ALL" ? {} : { status: key }, { replace: true });
	};

	const exportCsv = async () => {
		setExporting(true);
		try {
			const response = await axiosInstance.get<Blob>("/booking/export", {
				params: filters,
				responseType: "blob",
			});
			const url = URL.createObjectURL(response.data);
			const link = document.createElement("a");
			link.href = url;
			link.download = `tourly-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
			link.click();
			URL.revokeObjectURL(url);
			const count = response.headers["x-total-count"];
			toast.success(count ? `Exported ${count} bookings` : "Export ready");
		} catch {
			toast.error("Couldn't export bookings");
		} finally {
			setExporting(false);
		}
	};

	const hasFilters = Boolean(status || searchTerm || from);

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title="Bookings"
				description="All bookings across every tour."
				actions={
					<button type="button" className={btnGhost} onClick={exportCsv} disabled={exporting}>
						<Download />
						{exporting ? "Exporting…" : "Export CSV"}
					</button>
				}
			/>

			<div role="tablist" aria-label="Filter by status" className="-mb-0.5 flex gap-2 overflow-x-auto pb-0.5">
				{TABS.map((tab) => {
					const on = tab.key === activeTab.key;
					return (
						<button
							key={tab.key}
							type="button"
							role="tab"
							aria-selected={on}
							onClick={() => pickTab(tab.key)}
							className={cn(
								"inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
								on && "border-foreground bg-foreground text-background hover:text-background",
							)}
						>
							{tab.label}
							{counts && <span className="font-medium opacity-80">{formatNumber(counts[tab.key])}</span>}
						</button>
					);
				})}
			</div>

			<section className={cn(dashCard, "overflow-hidden")}>
				<div className="flex flex-wrap gap-3 border-b border-border p-4">
					<SearchField
						id="ab-q"
						label="Search bookings"
						placeholder="Booking code, transaction ID, user or tour"
						value={search}
						className="flex-[1_1_260px]"
						onChange={(event) => {
							setSearch(event.target.value);
							setPage(1);
						}}
					/>
					<SelectField
						label="Date range"
						options={RANGES}
						value={range}
						className="flex-[0_1_180px]"
						onChange={(event) => {
							setRange(event.target.value);
							setPage(1);
						}}
					/>
				</div>

				<div className="relative overflow-x-auto">
					<table className="w-full min-w-240 border-collapse text-sm">
						<thead>
							<tr className="border-b border-border">
								<th scope="col" className={cn(th, cell)}>
									Booking
								</th>
								<th scope="col" className={cn(th, cell)}>
									User
								</th>
								<th scope="col" className={cn(th, cell)}>
									Tour
								</th>
								<th scope="col" className={cn(th, cell)}>
									Trip dates
								</th>
								<th scope="col" className={cn(th, cell, "text-right")}>
									Guests
								</th>
								<th scope="col" className={cn(th, cell, "text-right")}>
									Amount
								</th>
								<th scope="col" className={cn(th, cell)}>
									Transaction
								</th>
								<th scope="col" className={cn(th, cell)}>
									Status
								</th>
								<th scope="col" className={cn(th, cell)}>
									<span className="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody className={cn(isFetching && !isLoading && "opacity-60 transition-opacity")}>
							{isLoading && <TableSkeleton cols={COLS} rows={8} />}

							{isError && (
								<tr>
									<td colSpan={COLS}>
										<ErrorState title="Couldn't load bookings" onRetry={refetch} />
									</td>
								</tr>
							)}

							{!isLoading && !isError && bookings.length === 0 && (
								<tr>
									<td colSpan={COLS}>
										<EmptyState
											icon={hasFilters ? SearchX : Ticket}
											title={status ? "No bookings with this status" : hasFilters ? "No bookings found" : "No bookings yet"}
											description={
												hasFilters
													? "Try a different filter or date range."
													: "Bookings appear here as soon as travellers book a tour."
											}
										/>
									</td>
								</tr>
							)}

							{bookings.map((booking) => (
								<tr key={booking._id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
									<td className={cn(td, cell)}>
										<div className="text-[13px] font-semibold whitespace-nowrap">{booking.bookingCode}</div>
										<div className="text-[12.5px] text-muted-foreground">
											{formatDate(booking.createdAt, { day: "numeric", month: "short" })}
										</div>
									</td>
									<td className={cn(td, cell)}>
										<div className="max-w-40 truncate font-semibold">{booking.user.name}</div>
										<div className="max-w-40 truncate text-[12.5px] text-muted-foreground">{booking.user.email}</div>
									</td>
									<td className={cn(td, cell)}>
										<div className="max-w-52 truncate" title={booking.tour.title}>
											{booking.tour.title}
										</div>
										{booking.status === "COMPLETE" && (
											<div
												className={cn(
													"text-[12.5px]",
													booking.guide ? "text-muted-foreground" : "font-medium text-warning",
												)}
											>
												{booking.guide ? `Guide: ${booking.guide.name}` : "No guide yet"}
											</div>
										)}
									</td>
									<td className={cn(td, cell, "whitespace-nowrap tabular-nums")}>
										{formatDateRange(booking.tour.startDate, booking.tour.endDate)}
									</td>
									<td className={cn(td, cell, "text-right tabular-nums")}>{booking.guestCount}</td>
									<td className={cn(td, cell, "text-right font-semibold whitespace-nowrap tabular-nums")}>
										{formatTaka(booking.payment?.amount)}
									</td>
									<td className={cn(td, cell, "text-[13px] whitespace-nowrap text-muted-foreground")}>
										{booking.payment?.status === "PAID" ? booking.payment.transactionId : "—"}
									</td>
									<td className={cn(td, cell)}>
										<BookingStatusBadge status={booking.status} />
									</td>
									<td className={cn(td, cell, "text-right")}>
										<button type="button" className={cn(btnGhost, btnSm)} onClick={() => setOpenId(booking._id)}>
											View
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{meta && meta.total > 0 && (
					<Pagination
						page={page}
						totalPage={meta.totalPage}
						total={meta.total}
						limit={LIMIT}
						noun={status ? `${activeTab.label.toLowerCase()} bookings` : "bookings"}
						disabled={isFetching}
						onChange={setPage}
					/>
				)}
			</section>

			<BookingDetailSheet bookingId={openId} onClose={() => setOpenId(null)} />
		</div>
	);
}
