import PageHeader from "@/components/dashboard/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import { BookingStatusBadge } from "@/components/dashboard/StatusBadge";
import StatusTabs from "@/components/dashboard/StatusTabs";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/dashboard/States";
import { btnGhost, btnPrimary, btnSm, dashCard, iconBtn, td, th } from "@/components/dashboard/styles";
import { Pagination } from "@/components/dashboard/TableControls";
import { canPay, usePayBooking } from "@/hooks/usePayBooking";
import { bookingRef, formatDate, formatDateRange, formatNumber, formatTaka } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { useGetMyBookingsQuery, useGetMyBookingSummaryQuery } from "@/redux/features/Booking/booking.api";
import type { TBookingStatus } from "@/types";
import { CalendarCheck, CalendarClock, FileText, ImageIcon, Ticket, Wallet } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

const LIMIT = 10;
const COLS = 7;

type TTab = TBookingStatus | "ALL";

const TABS: { key: TTab; label: string }[] = [
	{ key: "ALL", label: "All" },
	{ key: "PENDING", label: "Pending" },
	{ key: "COMPLETE", label: "Complete" },
	{ key: "CANCEL", label: "Cancelled" },
	{ key: "FAILED", label: "Failed" },
];

const isTab = (value: string | null): value is TTab => TABS.some((tab) => tab.key === value);

export default function Bookings() {
	const [searchParams, setSearchParams] = useSearchParams();
	const tabParam = searchParams.get("status");
	const tab: TTab = isTab(tabParam) ? tabParam : "ALL";
	const [page, setPage] = useState(1);

	const { data: me } = useUserInfoQuery(undefined);
	const firstName = ((me?.data?.name as string | undefined) ?? "").split(" ")[0];

	const { data, isLoading, isError, isFetching, refetch } = useGetMyBookingsQuery({
		page,
		limit: LIMIT,
		...(tab !== "ALL" && { status: tab }),
	});
	const { data: summary } = useGetMyBookingSummaryQuery();
	const { pay, payingId } = usePayBooking();

	const bookings = data?.data ?? [];
	const meta = data?.meta;

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title={firstName ? `Welcome back, ${firstName}` : "My bookings"}
				description="Your trips, payments and invoices in one place."
			/>

			<section aria-label="Trip summary" className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
				<StatTile icon={CalendarClock} label="Upcoming trips" value={formatNumber(summary?.upcomingTrips)} />
				<StatTile icon={CalendarCheck} label="Completed trips" value={formatNumber(summary?.completedTrips)} />
				<StatTile icon={Wallet} label="Pending payment" value={formatTaka(summary?.pendingAmount ?? 0)} />
				<StatTile icon={Ticket} label="Total spent" value={formatTaka(summary?.totalSpent ?? 0)} />
			</section>

			<h2 className="mt-1 text-base font-semibold">My bookings</h2>

			<StatusTabs
				label="Filter by status"
				tabs={TABS}
				value={tab}
				counts={summary?.counts}
				onChange={(key) => {
					setPage(1);
					setSearchParams(key === "ALL" ? {} : { status: key }, { replace: true });
				}}
			/>

			<section className={cn(dashCard, "overflow-hidden")}>
				<div className="relative overflow-x-auto">
					<table className="w-full min-w-225 border-collapse text-sm">
						<thead>
							<tr className="border-b border-border">
								<th scope="col" className={th}>
									Booking
								</th>
								<th scope="col" className={th}>
									Tour
								</th>
								<th scope="col" className={th}>
									Trip dates
								</th>
								<th scope="col" className={cn(th, "text-right")}>
									Guests
								</th>
								<th scope="col" className={cn(th, "text-right")}>
									Amount
								</th>
								<th scope="col" className={th}>
									Status
								</th>
								<th scope="col" className={cn(th, "text-right")}>
									Actions
								</th>
							</tr>
						</thead>
						<tbody className={cn(isFetching && !isLoading && "opacity-60 transition-opacity")}>
							{isLoading && <TableSkeleton cols={COLS} rows={5} />}

							{isError && (
								<tr>
									<td colSpan={COLS}>
										<ErrorState title="Couldn't load your bookings" onRetry={refetch} />
									</td>
								</tr>
							)}

							{!isLoading && !isError && bookings.length === 0 && (
								<tr>
									<td colSpan={COLS}>
										<EmptyState
											icon={Ticket}
											title={tab === "ALL" ? "No bookings yet" : "No bookings with this status"}
											description={
												tab === "ALL"
													? "When you book a tour it shows up here with its invoice and trip details."
													: "Try another filter."
											}
											action={
												tab === "ALL" && (
													<Link to="/tours" className={btnPrimary}>
														Browse tours
													</Link>
												)
											}
										/>
									</td>
								</tr>
							)}

							{bookings.map((booking) => {
								const tour = booking.tour;
								const payable = canPay(booking);
								const invoice = booking.payment?.status === "PAID" ? booking.payment.invoiceUrl : undefined;
								return (
									<tr key={booking._id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
										<td className={td}>
											<div className="text-[13px] font-semibold whitespace-nowrap">{bookingRef(booking)}</div>
											<div className="text-[12.5px] whitespace-nowrap text-muted-foreground">
												Booked {formatDate(booking.createdAt, { day: "numeric", month: "short" })}
											</div>
										</td>
										<td className={td}>
											<div className="flex items-center gap-3">
												<span className="flex h-10 w-13 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-placeholder text-placeholder-foreground">
													{tour?.images?.[0] ? (
														<img src={tour.images[0]} alt="" loading="lazy" className="size-full object-cover" />
													) : (
														<ImageIcon className="size-4" />
													)}
												</span>
												<div className="min-w-0">
													<div className="max-w-60 truncate font-semibold" title={tour?.title}>
														{tour?.title ?? "Tour removed"}
													</div>
													{tour?.location && (
														<div className="max-w-60 truncate text-[12.5px] text-muted-foreground">{tour.location}</div>
													)}
												</div>
											</div>
										</td>
										<td className={cn(td, "whitespace-nowrap tabular-nums")}>
											{formatDateRange(tour?.startDate, tour?.endDate)}
										</td>
										<td className={cn(td, "text-right tabular-nums")}>{booking.guestCount}</td>
										<td className={cn(td, "text-right font-semibold whitespace-nowrap tabular-nums")}>
											{formatTaka(booking.payment?.amount)}
										</td>
										<td className={td}>
											<BookingStatusBadge status={booking.status} />
										</td>
										<td className={td}>
											<div className="flex items-center justify-end gap-1.5">
												{payable && (
													<button
														type="button"
														className={cn(btnPrimary, btnSm)}
														disabled={Boolean(payingId)}
														onClick={() => pay(booking._id)}
													>
														{booking.status === "PENDING" ? "Pay now" : "Try again"}
													</button>
												)}
												{invoice && (
													<a
														href={invoice}
														target="_blank"
														rel="noreferrer"
														className={iconBtn}
														aria-label="Open invoice"
														title="Invoice (PDF)"
													>
														<FileText />
													</a>
												)}
												<Link to={`/user/bookings/${booking._id}`} className={cn(btnGhost, btnSm)}>
													Details
												</Link>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{meta && meta.total > 0 && (
					<Pagination
						page={page}
						totalPage={meta.totalPage}
						total={meta.total}
						limit={LIMIT}
						noun="bookings"
						disabled={isFetching}
						onChange={setPage}
					/>
				)}
			</section>
		</div>
	);
}
