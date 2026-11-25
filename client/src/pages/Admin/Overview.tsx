import { ErrorState } from "@/components/dashboard/States";
import { btnText, dashCard, td, th } from "@/components/dashboard/styles";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatNumber, formatTaka, formatTakaCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetDashboardStatsQuery } from "@/redux/features/Stats/stats.api";
import type { IDashboardStats } from "@/types";
import {
	Banknote,
	CalendarCheck2,
	CircleCheck,
	CircleX,
	Clock3,
	Ticket,
	type LucideIcon,
} from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

const PERIODS = [7, 14, 30] as const;
type TPeriod = (typeof PERIODS)[number];

const TYPE_COLORS = ["var(--primary)", "var(--foreground)", "var(--cyan)", "var(--status-cancelled)", "var(--pink)"];

const chartConfig = {
	bookings: { label: "Bookings", color: "var(--primary)" },
	revenue: { label: "Revenue", color: "var(--foreground)" },
} satisfies ChartConfig;

const dayLabel = (key: string, options: Intl.DateTimeFormatOptions) =>
	formatDate(new Date(`${key}T00:00:00`), options);

function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
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

function ChartTooltipBox({ active, payload }: TooltipContentProps<ValueType, NameType>) {
	if (!active || !payload?.length) return null;
	const row = payload[0].payload as IDashboardStats["series"][number];
	return (
		<div className="rounded-lg border border-border bg-popover px-3 py-2 text-[13px] shadow-soft">
			<p className="mb-1 font-semibold">{dayLabel(row.date, { weekday: "short", day: "numeric", month: "short" })}</p>
			<p className="flex items-center gap-2">
				<span className="size-2.5 rounded-[3px] bg-primary" />
				{formatNumber(row.bookings)} bookings
			</p>
			<p className="flex items-center gap-2">
				<span className="h-0.5 w-3 bg-foreground" />
				{formatTaka(row.revenue)}
			</p>
		</div>
	);
}

function BookingsRevenueChart({ data }: { data: IDashboardStats }) {
	const dense = data.series.length > 14;

	return (
		<section className={cn(dashCard, "flex min-w-0 flex-col gap-2.5 p-5 xl:col-span-2")}>
			<div className="flex flex-wrap items-baseline justify-between gap-2.5">
				<h2 className="text-base font-semibold">Bookings &amp; revenue</h2>
				<span className="text-[13.5px] text-muted-foreground">
					{formatNumber(data.totals.bookings)} bookings · last {data.period.days} days
				</span>
			</div>

			<ChartContainer config={chartConfig} className="aspect-auto h-64 w-full sm:h-72">
				<ComposedChart data={data.series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
					<CartesianGrid vertical={false} stroke="var(--grid)" />
					<XAxis
						dataKey="date"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						interval="preserveStartEnd"
						minTickGap={6}
						tickFormatter={(value: string) => String(Number(value.slice(8)))}
					/>
					<YAxis
						yAxisId="bookings"
						allowDecimals={false}
						tickLine={false}
						axisLine={false}
						width={32}
					/>
					<YAxis
						yAxisId="revenue"
						orientation="right"
						tickLine={false}
						axisLine={false}
						width={52}
						tickFormatter={(value: number) => formatTakaCompact(value)}
					/>
					<ChartTooltip cursor={{ fill: "var(--surface-2)" }} content={ChartTooltipBox} />
					<Bar
						yAxisId="bookings"
						dataKey="bookings"
						fill="var(--color-bookings)"
						radius={[4, 4, 0, 0]}
						maxBarSize={dense ? 14 : 22}
					/>
					<Line
						yAxisId="revenue"
						type="linear"
						dataKey="revenue"
						stroke="var(--color-revenue)"
						strokeWidth={2}
						dot={{ r: 3.5, fill: "var(--card)", strokeWidth: 2 }}
						activeDot={{ r: 5 }}
					/>
				</ComposedChart>
			</ChartContainer>

			<div className="flex justify-center gap-5.5 text-[13.5px]">
				<span className="inline-flex items-center gap-2">
					<span className="size-2.5 rounded-[3px] bg-primary" />
					Bookings
				</span>
				<span className="inline-flex items-center gap-2">
					<span className="h-0.5 w-3.5 bg-foreground" />
					Revenue (৳)
				</span>
			</div>
		</section>
	);
}

function PeriodSummary({ data }: { data: IDashboardStats }) {
	const { totals, byTourType } = data;

	return (
		<section className={cn(dashCard, "flex flex-col gap-4.5 p-5")}>
			<h2 className="text-base font-semibold">Last {data.period.days} days</h2>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<span className="text-[13px] text-muted-foreground">Revenue</span>
					<div className="text-[22px] font-semibold tabular-nums">{formatTaka(totals.revenue)}</div>
				</div>
				<div>
					<span className="text-[13px] text-muted-foreground">New travellers</span>
					<div className="text-[22px] font-semibold tabular-nums">{formatNumber(totals.newTravellers)}</div>
				</div>
			</div>

			<div className="flex flex-col gap-2.5">
				<span className="text-[13px] text-muted-foreground">Bookings by tour type</span>
				{byTourType.length === 0 ? (
					<p className="text-sm text-muted-foreground">No bookings in this period yet.</p>
				) : (
					<>
						<div
							role="img"
							aria-label={byTourType.map((row) => `${row.name} ${row.percent} percent`).join(", ")}
							className="flex h-2 gap-0.75 overflow-hidden rounded-full"
						>
							{byTourType.map((row, i) => (
								<span
									key={row._id}
									style={{ flex: Math.max(row.count, 1), background: TYPE_COLORS[i % TYPE_COLORS.length] }}
								/>
							))}
						</div>
						{byTourType.map((row, i) => (
							<div key={row._id} className="flex justify-between gap-3 text-sm">
								<span className="inline-flex min-w-0 items-center gap-2">
									<span
										className="size-2 shrink-0 rounded-full"
										style={{ background: TYPE_COLORS[i % TYPE_COLORS.length] }}
									/>
									<span className="truncate">{row.name}</span>
								</span>
								<span className="text-muted-foreground tabular-nums">
									{formatNumber(row.count)} · {row.percent}%
								</span>
							</div>
						))}
					</>
				)}
			</div>

			<div className="mt-auto flex items-center justify-between gap-2.5 border-t border-border pt-3.5">
				<span className="text-[13.5px] text-muted-foreground">
					{formatNumber(totals.awaitingPayment)} booking{totals.awaitingPayment === 1 ? "" : "s"} awaiting payment
				</span>
				<Link to="/admin/bookings?status=PENDING" className={btnText}>
					Review
				</Link>
			</div>
		</section>
	);
}

function ByTourTable({ data }: { data: IDashboardStats }) {
	return (
		<section className={cn(dashCard, "overflow-hidden")}>
			<div className="flex items-center justify-between px-5 pt-4.5 pb-1.5">
				<h2 className="text-base font-semibold">By tour · last {data.period.days} days</h2>
				<Link to="/admin/tours" className={btnText}>
					All tours
				</Link>
			</div>
			{data.byTour.length === 0 ? (
				<p className="px-5 pt-2 pb-6 text-sm text-muted-foreground">No bookings in this period yet.</p>
			) : (
				<div className="relative overflow-x-auto">
					<table className="w-full min-w-180 border-collapse text-sm tabular-nums">
						<thead>
							<tr className="border-b border-border">
								<th scope="col" className={cn(th, "px-5")}>
									Tour
								</th>
								<th scope="col" className={cn(th, "px-5 text-right")}>
									Bookings
								</th>
								<th scope="col" className={cn(th, "px-5 text-right")}>
									Guests
								</th>
								<th scope="col" className={cn(th, "px-5 text-right")}>
									Revenue
								</th>
								<th scope="col" className={cn(th, "px-5 text-right")}>
									Cancelled
								</th>
								<th scope="col" className={cn(th, "px-5 text-right")}>
									Seats filled
								</th>
							</tr>
						</thead>
						<tbody>
							{data.byTour.map((row) => (
								<tr key={row._id} className="border-b border-border last:border-0">
									<td className={cn(td, "px-5 font-medium")}>
										<Link to={`/tours/${row.slug}`} className="hover:text-primary-text">
											{row.title}
										</Link>
									</td>
									<td className={cn(td, "px-5 text-right")}>{formatNumber(row.bookings)}</td>
									<td className={cn(td, "px-5 text-right")}>{formatNumber(row.guests)}</td>
									<td className={cn(td, "px-5 text-right")}>{formatTaka(row.revenue)}</td>
									<td className={cn(td, "px-5 text-right")}>{formatNumber(row.cancelled)}</td>
									<td className={cn(td, "px-5 text-right")}>
										{row.seatsFilled === null ? "—" : `${row.seatsFilled}%`}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}

function OverviewSkeleton() {
	return (
		<div aria-busy="true" aria-label="Loading dashboard" className="flex flex-col gap-6">
			<div className="grid grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-3.5">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-24 rounded-xl" />
				))}
			</div>
			<div className="grid gap-4 xl:grid-cols-3">
				<Skeleton className="h-90 rounded-xl xl:col-span-2" />
				<Skeleton className="h-90 rounded-xl" />
			</div>
			<Skeleton className="h-64 rounded-xl" />
		</div>
	);
}

export default function Overview() {
	const [searchParams, setSearchParams] = useSearchParams();
	const requested = Number(searchParams.get("days"));
	const days: TPeriod = (PERIODS as readonly number[]).includes(requested) ? (requested as TPeriod) : 14;

	const { data, isLoading, isError, isFetching, refetch } = useGetDashboardStatsQuery(days);

	const [today] = useState(() => formatDate(new Date(), { weekday: "short", day: "numeric", month: "short" }));
	const range = data
		? `${dayLabel(data.period.from, { weekday: "short", day: "numeric", month: "short" })} – ${dayLabel(data.period.to, { weekday: "short", day: "numeric", month: "short" })}`
		: "";

	const tiles: { icon: LucideIcon; label: string; value: string }[] = data
		? [
				{ icon: Ticket, label: "New bookings", value: formatNumber(data.today.newBookings) },
				{ icon: Clock3, label: "Awaiting payment", value: formatNumber(data.today.awaitingPayment) },
				{ icon: CircleCheck, label: "Confirmed", value: formatNumber(data.today.confirmed) },
				{ icon: CalendarCheck2, label: "Departing today", value: formatNumber(data.today.departingToday) },
				{ icon: CircleX, label: "Cancelled", value: formatNumber(data.today.cancelled) },
				{ icon: Banknote, label: "Collected today", value: formatTaka(data.today.collected) },
			]
		: [];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="text-[26px] font-bold tracking-[-0.01em] sm:text-[28px]">Dashboard</h1>
					<p className="text-[14.5px] text-muted-foreground">
						Today is {today}
						{range && ` · ${range}`}
					</p>
				</div>
				<nav aria-label="Period" className="inline-flex gap-1 rounded-[10px] border border-border bg-card p-1">
					{PERIODS.map((period) => (
						<button
							key={period}
							type="button"
							aria-pressed={period === days}
							onClick={() => setSearchParams(period === 14 ? {} : { days: String(period) }, { replace: true })}
							className={cn(
								"inline-flex min-h-8.5 items-center rounded-[7px] px-3 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground",
								period === days && "bg-accent font-semibold text-accent-foreground hover:text-accent-foreground",
							)}
						>
							{period} days
						</button>
					))}
				</nav>
			</div>

			{isLoading && <OverviewSkeleton />}

			{isError && !data && (
				<div className={dashCard}>
					<ErrorState title="Couldn't load the dashboard" onRetry={refetch} />
				</div>
			)}

			{data && (
				<div className={cn("flex flex-col gap-6 transition-opacity", isFetching && "opacity-60")}>
					<section aria-labelledby="ov-today" className="flex flex-col gap-3">
						<h2 id="ov-today" className="text-base font-semibold">
							Today
						</h2>
						<div className="grid grid-cols-2 gap-3.5 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
							{tiles.map((tile) => (
								<StatTile key={tile.label} {...tile} />
							))}
						</div>
					</section>

					<div className="grid gap-4 xl:grid-cols-3">
						<BookingsRevenueChart data={data} />
						<PeriodSummary data={data} />
					</div>

					<ByTourTable data={data} />
				</div>
			)}
		</div>
	);
}
