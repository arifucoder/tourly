import PageHeader from "@/components/dashboard/PageHeader";
import { TripPhaseBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/dashboard/States";
import { btnGhost, btnSm, dashCard, iconBtn, td, th } from "@/components/dashboard/styles";
import { Pagination } from "@/components/dashboard/TableControls";
import TripDetailSheet from "@/components/modules/Guide/TripDetailSheet";
import { bookingRef, formatDate, formatDateRange, formatNumber, tripPhase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { useGetAssignedBookingsQuery } from "@/redux/features/Booking/booking.api";
import type { TAssignedScope } from "@/types";
import { CalendarCheck, CalendarClock, History, ImageIcon, Phone, UsersRound, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";

const LIMIT = 10;
const COLS = 7;

const TABS: { key: TAssignedScope; label: string }[] = [
	{ key: "upcoming", label: "Upcoming" },
	{ key: "past", label: "Past" },
	{ key: "all", label: "All" },
];

const isScope = (value: string | null): value is TAssignedScope =>
	value === "upcoming" || value === "past" || value === "all";

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
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

export default function AssignedTrips() {
	const [searchParams, setSearchParams] = useSearchParams();
	const scopeParam = searchParams.get("scope");
	const scope = isScope(scopeParam) ? scopeParam : "upcoming";
	const [page, setPage] = useState(1);
	const [openId, setOpenId] = useState<string | null>(null);

	const { data: me } = useUserInfoQuery(undefined);
	const firstName = ((me?.data?.name as string | undefined) ?? "").split(" ")[0];

	const { data, isLoading, isError, isFetching, refetch } = useGetAssignedBookingsQuery({ scope, page, limit: LIMIT });
	const { data: upcoming } = useGetAssignedBookingsQuery({ scope: "upcoming", limit: 50 });
	const { data: past } = useGetAssignedBookingsQuery({ scope: "past", limit: 1 });

	const upcomingTrips = upcoming?.data ?? [];
	const nextStart = upcomingTrips
		.map((trip) => trip.tour.startDate)
		.filter((date): date is string => Boolean(date))
		.sort()[0];
	const travellers = upcomingTrips.reduce((sum, trip) => sum + trip.guestCount, 0);

	const counts: Record<TAssignedScope, number | undefined> = {
		upcoming: upcoming?.meta.total,
		past: past?.meta.total,
		all: upcoming && past ? upcoming.meta.total + past.meta.total : undefined,
	};

	const trips = data?.data ?? [];
	const meta = data?.meta;

	const pickTab = (key: TAssignedScope) => {
		setPage(1);
		setSearchParams(key === "upcoming" ? {} : { scope: key }, { replace: true });
	};

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title={firstName ? `Welcome back, ${firstName}` : "My trips"}
				description="Trips you're leading, with dates and traveller contacts."
			/>

			<section aria-label="Trip summary" className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
				<Stat icon={CalendarClock} label="Upcoming trips" value={formatNumber(counts.upcoming)} />
				<Stat
					icon={CalendarCheck}
					label="Next departure"
					value={nextStart ? formatDate(nextStart, { day: "numeric", month: "short" }) : "—"}
				/>
				<Stat icon={UsersRound} label="Travellers ahead" value={formatNumber(travellers)} />
				<Stat icon={History} label="Past trips" value={formatNumber(counts.past)} />
			</section>

			<h2 className="mt-1 text-base font-semibold">Assigned trips</h2>

			<nav aria-label="Filter trips" className="-mb-0.5 flex gap-2 overflow-x-auto pb-0.5">
				{TABS.map((tab) => {
					const on = tab.key === scope;
					return (
						<button
							key={tab.key}
							type="button"
							aria-pressed={on}
							onClick={() => pickTab(tab.key)}
							className={cn(
								"inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
								on && "border-foreground bg-foreground text-background hover:text-background",
							)}
						>
							{tab.label}
							{counts[tab.key] !== undefined && (
								<span className="font-medium opacity-80">{formatNumber(counts[tab.key])}</span>
							)}
						</button>
					);
				})}
			</nav>

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
								<th scope="col" className={th}>
									Lead traveller
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
										<ErrorState title="Couldn't load your trips" onRetry={refetch} />
									</td>
								</tr>
							)}

							{!isLoading && !isError && trips.length === 0 && (
								<tr>
									<td colSpan={COLS}>
										<EmptyState
											icon={CalendarCheck}
											title={scope === "past" ? "No past trips yet" : "No trips assigned yet"}
											description={
												scope === "past"
													? "Trips you've finished leading will show up here."
													: "When an admin assigns you to a paid booking, it shows up here with the traveller's contact."
											}
										/>
									</td>
								</tr>
							)}

							{trips.map((trip) => {
								const route = [trip.tour.departureLocation, trip.tour.arrivalLocation].filter(Boolean).join(" → ");
								return (
									<tr key={trip._id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
										<td className={td}>
											<div className="text-[13px] font-semibold whitespace-nowrap">{bookingRef(trip)}</div>
											<div className="text-[12.5px] whitespace-nowrap text-muted-foreground">
												Assigned {formatDate(trip.guideAssignedAt, { day: "numeric", month: "short" })}
											</div>
										</td>
										<td className={td}>
											<div className="flex items-center gap-3">
												<span className="flex h-10 w-13 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-placeholder text-placeholder-foreground">
													{trip.tour.images?.[0] ? (
														<img src={trip.tour.images[0]} alt="" loading="lazy" className="size-full object-cover" />
													) : (
														<ImageIcon className="size-4" />
													)}
												</span>
												<div className="min-w-0">
													<div className="max-w-60 truncate font-semibold" title={trip.tour.title}>
														{trip.tour.title}
													</div>
													<div className="max-w-60 truncate text-[12.5px] text-muted-foreground">
														{route || trip.tour.division?.name || "—"}
													</div>
												</div>
											</div>
										</td>
										<td className={cn(td, "whitespace-nowrap tabular-nums")}>
											{formatDateRange(trip.tour.startDate, trip.tour.endDate)}
										</td>
										<td className={cn(td, "text-right tabular-nums")}>{trip.guestCount}</td>
										<td className={td}>
											<div className="max-w-44 truncate font-semibold">{trip.user.name}</div>
											<div className="max-w-44 truncate text-[12.5px] text-muted-foreground">
												{trip.user.phone || trip.user.email}
											</div>
										</td>
										<td className={td}>
											<TripPhaseBadge phase={tripPhase(trip.tour.startDate, trip.tour.endDate)} />
										</td>
										<td className={td}>
											<div className="flex justify-end gap-1.5">
												{trip.user.phone && (
													<a
														href={`tel:${trip.user.phone}`}
														className={iconBtn}
														aria-label={`Call ${trip.user.name}`}
														title={`Call ${trip.user.name}`}
													>
														<Phone />
													</a>
												)}
												<button type="button" className={cn(btnGhost, btnSm)} onClick={() => setOpenId(trip._id)}>
													View
												</button>
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
						noun="trips"
						disabled={isFetching}
						onChange={setPage}
					/>
				)}
			</section>

			<TripDetailSheet bookingId={openId} onClose={() => setOpenId(null)} />
		</div>
	);
}
