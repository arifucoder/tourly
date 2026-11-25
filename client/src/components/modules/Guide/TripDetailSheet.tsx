import { TripPhaseBadge } from "@/components/dashboard/StatusBadge";
import { ErrorState } from "@/components/dashboard/States";
import { btnGhost, btnPrimary } from "@/components/dashboard/styles";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { bookingRef, formatDateRange, formatDateTime, formatNumber, tripPhase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetBookingQuery } from "@/redux/features/Booking/booking.api";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

function Row({ k, v }: { k: string; v: ReactNode }) {
	return (
		<div className="flex justify-between gap-4 text-[14.5px]">
			<dt className="text-muted-foreground">{k}</dt>
			<dd className="min-w-0 text-right font-semibold break-words">{v}</dd>
		</div>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="flex flex-col gap-2.5 border-t border-border pt-4">
			<h3 className="text-[13px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>
			{children}
		</section>
	);
}

export default function TripDetailSheet({ bookingId, onClose }: { bookingId: string | null; onClose: () => void }) {
	const { data, isLoading, isError, refetch } = useGetBookingQuery(bookingId ?? "", { skip: !bookingId });
	const tour = data?.tour;
	const route = [tour?.departureLocation, tour?.arrivalLocation].filter(Boolean).join(" → ");

	return (
		<Sheet open={Boolean(bookingId)} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full gap-0 overflow-y-auto bg-card sm:max-w-md">
				<SheetHeader className="px-5 pt-5 pb-4">
					<SheetTitle className="text-lg font-bold">{data ? bookingRef(data) : "Trip"}</SheetTitle>
					<SheetDescription>{data ? `You're guiding ${data.user.name}'s group` : "Loading trip details…"}</SheetDescription>
				</SheetHeader>

				{isLoading && (
					<div className="flex flex-col gap-3 px-5" aria-busy="true">
						<Skeleton className="h-14 rounded-lg" />
						<Skeleton className="h-32 rounded-lg" />
						<Skeleton className="h-28 rounded-lg" />
					</div>
				)}
				{isError && <ErrorState title="Couldn't load this trip" onRetry={refetch} />}

				{data && tour && !isLoading && (
					<div className="flex flex-col gap-4 px-5 pb-6">
						<div className="flex items-center gap-3">
							<div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-placeholder">
								{tour.images?.[0] && <img src={tour.images[0]} alt="" className="size-full object-cover" />}
							</div>
							<div className="min-w-0">
								<p className="line-clamp-2 font-semibold">{tour.title}</p>
								<p className="text-[13px] text-muted-foreground">
									{[tour.division?.name, tour.location].filter(Boolean).join(" · ")}
								</p>
							</div>
						</div>

						<dl className="flex flex-col gap-2">
							<Row k="Status" v={<TripPhaseBadge phase={tripPhase(tour.startDate, tour.endDate)} />} />
							<Row k="Dates" v={formatDateRange(tour.startDate, tour.endDate)} />
							<Row k="Guests" v={formatNumber(data.guestCount)} />
							{route && <Row k="Route" v={route} />}
							{data.guideAssignedAt && <Row k="Assigned" v={formatDateTime(data.guideAssignedAt)} />}
						</dl>

						<Section title="Lead traveller">
							<dl className="flex flex-col gap-2">
								<Row k="Name" v={data.user.name} />
								<Row k="Phone" v={data.user.phone || "—"} />
								<Row k="Email" v={data.user.email} />
							</dl>
							<div className="flex gap-2 pt-1">
								{data.user.phone && (
									<a href={`tel:${data.user.phone}`} className={cn(btnPrimary, "flex-1")}>
										<Phone />
										Call
									</a>
								)}
								<a href={`mailto:${data.user.email}`} className={cn(btnGhost, "flex-1")}>
									<Mail />
									Email
								</a>
							</div>
						</Section>

						{tour.departureLocation && (
							<Section title="Meeting point">
								<p className="flex items-start gap-2 text-[14.5px]">
									<MapPin className="mt-0.5 size-4 shrink-0 text-primary-text" />
									{tour.departureLocation}
								</p>
							</Section>
						)}
					</div>
				)}

				{tour && (
					<div className="mt-auto border-t border-border px-5 py-3">
						<Link
							to={`/tours/${tour.slug}`}
							target="_blank"
							className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-text hover:underline"
						>
							<ExternalLink className="size-4" />
							Open tour page (plan &amp; inclusions)
						</Link>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
