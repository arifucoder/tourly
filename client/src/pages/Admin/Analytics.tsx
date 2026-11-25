import { ErrorState } from "@/components/dashboard/States";
import { roleLabel } from "@/components/dashboard/status";
import { dashCard } from "@/components/dashboard/styles";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatTaka, toTitle } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
	useGetBookingStatsQuery,
	useGetPaymentStatsQuery,
	useGetTourStatsQuery,
	useGetUserStatsQuery,
} from "@/redux/features/Stats/stats.api";
import type { TRole } from "@/types";
import { Banknote, Mountain, Ticket, UserRound, Users, UsersRound, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

type TRow = { key: string; label: string; value: number; color?: string };

const STATUS_COLORS: Record<string, string> = {
	COMPLETE: "var(--status-complete)",
	PAID: "var(--status-complete)",
	PENDING: "var(--status-pending)",
	UNPAID: "var(--status-pending)",
	CANCEL: "var(--status-cancelled)",
	CANCELLED: "var(--status-cancelled)",
	FAILED: "var(--status-failed)",
	REFUNDED: "var(--info)",
};

const STATUS_LABEL: Record<string, string> = { CANCEL: "Cancelled" };

function Tile({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
	return (
		<div className={cn(dashCard, "flex flex-col gap-2 px-4.5 py-4")}>
			<span className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
				<Icon aria-hidden="true" className="size-4.25 shrink-0 text-primary-text" strokeWidth={1.9} />
				{label}
			</span>
			<span className="text-[26px] leading-tight font-semibold tabular-nums">{value}</span>
			{hint && <span className="text-[12.5px] text-muted-foreground">{hint}</span>}
		</div>
	);
}

function Panel({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
	return (
		<section className={cn(dashCard, "flex min-w-0 flex-col gap-4 p-5", className)}>
			<div className="flex items-baseline justify-between gap-2.5">
				<h2 className="text-base font-semibold">{title}</h2>
				{aside}
			</div>
			{children}
		</section>
	);
}

function Empty() {
	return <p className="text-sm text-muted-foreground">No data yet.</p>;
}

function SplitBar({ rows }: { rows: TRow[] }) {
	const total = rows.reduce((sum, row) => sum + row.value, 0);
	if (total === 0) return <Empty />;

	return (
		<div className="flex flex-col gap-2.5">
			<div
				role="img"
				aria-label={rows.map((row) => `${row.label} ${row.value}`).join(", ")}
				className="flex h-2.5 gap-0.75 overflow-hidden rounded-full"
			>
				{rows
					.filter((row) => row.value > 0)
					.map((row) => (
						<span key={row.key} style={{ flex: row.value, background: row.color }} />
					))}
			</div>
			{rows.map((row) => (
				<div key={row.key} className="flex justify-between gap-3 text-sm">
					<span className="inline-flex items-center gap-2">
						<span className="size-2 rounded-full" style={{ background: row.color }} />
						{row.label}
					</span>
					<span className="text-muted-foreground tabular-nums">
						{formatNumber(row.value)} · {Math.round((row.value / total) * 100)}%
					</span>
				</div>
			))}
		</div>
	);
}

function BarList({ rows, labelWidth = "w-28" }: { rows: TRow[]; labelWidth?: string }) {
	const max = Math.max(...rows.map((row) => row.value), 0);
	if (max === 0) return <Empty />;

	return (
		<ul className="flex flex-col gap-2.5">
			{rows.map((row) => (
				<li key={row.key} className="flex items-center gap-2.5 text-sm">
					<span className={cn("shrink-0 truncate", labelWidth)} title={row.label}>
						{row.label}
					</span>
					<span className="h-3.5 min-w-0 flex-1">
						<span
							className="block h-full rounded-r bg-primary"
							style={{ width: `${Math.max(2, Math.round((row.value / max) * 100))}%` }}
						/>
					</span>
					<span className="w-12 shrink-0 text-right text-muted-foreground tabular-nums">{formatNumber(row.value)}</span>
				</li>
			))}
		</ul>
	);
}

const toStatusRows = (rows: { _id: string; count: number }[], order: string[]) =>
	order.map((key) => ({
		key,
		label: STATUS_LABEL[key] ?? toTitle(key),
		value: rows.find((row) => row._id === key)?.count ?? 0,
		color: STATUS_COLORS[key],
	}));

export default function Analytics() {
	const booking = useGetBookingStatsQuery();
	const payment = useGetPaymentStatsQuery();
	const user = useGetUserStatsQuery();
	const tour = useGetTourStatsQuery();

	const queries = [booking, payment, user, tour];
	const isLoading = queries.some((query) => query.isLoading);
	const isError = queries.some((query) => query.isError);

	const header = (
		<div className="flex flex-col gap-1">
			<h1 className="text-[26px] font-bold tracking-[-0.01em] sm:text-[28px]">Analytics</h1>
			<p className="text-[14.5px] text-muted-foreground">All-time numbers across tours, bookings, payments and users.</p>
		</div>
	);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading analytics">
				{header}
				<div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3 2xl:grid-cols-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-28 rounded-xl" />
					))}
				</div>
				<div className="grid gap-4 lg:grid-cols-2">
					<Skeleton className="h-60 rounded-xl" />
					<Skeleton className="h-60 rounded-xl" />
				</div>
			</div>
		);
	}

	if (isError || !booking.data || !payment.data || !user.data || !tour.data) {
		return (
			<div className="flex flex-col gap-6">
				{header}
				<div className={dashCard}>
					<ErrorState
						title="Couldn't load analytics"
						onRetry={() => queries.forEach((query) => query.refetch())}
					/>
				</div>
			</div>
		);
	}

	const b = booking.data;
	const p = payment.data;
	const u = user.data;
	const t = tour.data;

	const revenue = p.totalRevenue[0]?.totalRevenue ?? 0;
	const avgTourCost = t.avgTourCost[0]?.avgCostFrom ?? 0;
	const roleOrder: TRole[] = ["USER", "GUIDE", "ADMIN", "SUPER_ADMIN"];

	const byDivision = [...t.totalTourByDivision]
		.sort((x, y) => y.count - x.count)
		.map((row) => ({ key: row._id, label: row._id, value: row.count }));
	const byType = [...t.totalTourByTourType]
		.sort((x, y) => y.count - x.count)
		.map((row) => ({ key: row._id, label: row._id, value: row.count }));
	const byRole = roleOrder.map((r) => ({
		key: r,
		label: roleLabel[r],
		value: u.usersByRole.find((row) => row._id === r)?.count ?? 0,
	}));
	const topTours = b.bookingsPerTour.slice(0, 6);
	const topMax = Math.max(...topTours.map((row) => row.bookingCount), 1);

	return (
		<div className="flex flex-col gap-6">
			{header}

			<div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3 2xl:grid-cols-6">
				<Tile icon={Banknote} label="Total revenue" value={formatTaka(revenue)} hint={`${formatNumber(p.totalPayment)} payments`} />
				<Tile
					icon={Ticket}
					label="Bookings"
					value={formatNumber(b.totalBooking)}
					hint={`${formatNumber(b.bookingsLast7Days)} in the last 7 days`}
				/>
				<Tile
					icon={UsersRound}
					label="Travellers who booked"
					value={formatNumber(b.totalBookingByUniqueUsers)}
					hint={`${(b.avgGuestCountPerBooking ?? 0).toFixed(1)} guests per booking`}
				/>
				<Tile
					icon={Users}
					label="Accounts"
					value={formatNumber(u.totalUsers)}
					hint={`${formatNumber(u.newUsersInLast30Days)} new in 30 days`}
				/>
				<Tile
					icon={UserRound}
					label="Blocked"
					value={formatNumber(u.totalBlockedUsers)}
					hint={`${formatNumber(u.totalActiveUsers)} active`}
				/>
				<Tile icon={Mountain} label="Tours" value={formatNumber(t.totalTour)} hint={`Avg. ${formatTaka(avgTourCost)} / person`} />
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Panel title="Bookings by status" aside={<span className="text-[13.5px] text-muted-foreground">All time</span>}>
					<SplitBar rows={toStatusRows(b.totalBookingByStatus, ["COMPLETE", "PENDING", "CANCEL", "FAILED"])} />
				</Panel>
				<Panel title="Payments by status" aside={<span className="text-[13.5px] text-muted-foreground">All time</span>}>
					<SplitBar
						rows={toStatusRows(p.totalPaymentByStatus, ["PAID", "UNPAID", "CANCELLED", "FAILED", "REFUNDED"])}
					/>
				</Panel>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<Panel title="Tours by division">
					<BarList rows={byDivision} />
				</Panel>
				<Panel title="Tours by type">
					<BarList rows={byType} />
				</Panel>
				<Panel title="Users by role">
					<BarList rows={byRole} />
				</Panel>
			</div>

			<Panel
				title="Most booked tours"
				aside={
					<Link to="/admin/tours" className="text-sm font-semibold text-primary-text hover:underline">
						All tours
					</Link>
				}
			>
				{topTours.length === 0 ? (
					<Empty />
				) : (
					<ol className="flex flex-col gap-3">
						{topTours.map((row, index) => (
							<li key={row._id} className="grid grid-cols-[28px_minmax(0,1fr)_56px] items-center gap-2.5 text-sm sm:grid-cols-[28px_minmax(0,260px)_1fr_56px]">
								<span className="flex size-7 items-center justify-center rounded-full bg-accent text-[12.5px] font-semibold text-accent-foreground">
									{index + 1}
								</span>
								<Link to={`/tours/${row.tour.slug}`} className="truncate font-medium hover:text-primary-text">
									{row.tour.title}
								</Link>
								<span className="hidden h-3.5 sm:block">
									<span
										className="block h-full rounded-r bg-primary"
										style={{ width: `${Math.round((row.bookingCount / topMax) * 100)}%` }}
									/>
								</span>
								<span className="text-right text-muted-foreground tabular-nums">{formatNumber(row.bookingCount)}</span>
							</li>
						))}
					</ol>
				)}
			</Panel>
		</div>
	);
}
