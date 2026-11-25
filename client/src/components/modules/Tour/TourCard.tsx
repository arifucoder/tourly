import type { ITour } from "@/types";
import { ImageIcon } from "lucide-react";
import { Link } from "react-router";

const FEW_SEATS = 5;

const formatPrice = (amount?: number) => (amount === undefined ? "—" : amount.toLocaleString("en-IN"));

const dayMonth = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const formatDateRange = (start: string, end: string) => {
	const from = new Date(start);
	const to = new Date(end);
	if (from.toDateString() === to.toDateString()) return dayMonth(from);
	if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
		return `${from.getDate()}–${dayMonth(to)}`;
	}
	return `${dayMonth(from)} – ${dayMonth(to)}`;
};

const getTourMeta = (tour: ITour) => {
	const parts: string[] = [];
	if (tour.startDate && tour.endDate) {
		const days =
			Math.round((new Date(tour.endDate).getTime() - new Date(tour.startDate).getTime()) / 86_400_000) + 1;
		parts.push(`${days} ${days === 1 ? "day" : "days"}`, formatDateRange(tour.startDate, tour.endDate));
	}
	if (tour.maxGuest) parts.push(`Max ${tour.maxGuest} guests`);
	return parts.join(" · ");
};

function SeatsBadge({ seatsLeft }: { seatsLeft?: number | null }) {
	if (seatsLeft === undefined || seatsLeft === null || seatsLeft > FEW_SEATS) return null;
	if (seatsLeft === 0) {
		return (
			<span className="rounded-full bg-destructive-soft px-2.5 py-0.75 text-xs font-semibold text-destructive">
				Fully booked
			</span>
		);
	}
	return (
		<span className="rounded-full bg-warning-soft px-2.5 py-0.75 text-xs font-semibold text-warning">
			{seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left
		</span>
	);
}

export default function TourCard({ tour }: { tour: ITour }) {
	const meta = getTourMeta(tour);
	const place = [tour.location, tour.division?.name].filter(Boolean).join(", ");

	return (
		<Link
			to={`/tours/${tour.slug}`}
			className="group flex flex-col overflow-hidden rounded-[14px] bg-card text-foreground shadow-soft transition-shadow hover:shadow-card focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
		>
			<div className="relative flex h-50 items-center justify-center overflow-hidden bg-placeholder text-placeholder-foreground">
				{tour.images?.[0] ? (
					<img
						src={tour.images[0]}
						alt={tour.title}
						loading="lazy"
						className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<span className="flex flex-col items-center gap-1.5 p-2.5 text-center text-xs font-medium">
						<ImageIcon className="size-6.5" strokeWidth={1.6} />
						No photo yet
					</span>
				)}
				{tour.tourType && (
					<span className="absolute top-3 left-3 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
						{tour.tourType.name}
					</span>
				)}
			</div>

			<div className="flex flex-1 flex-col gap-1.5 px-4.5 pt-4 pb-4.5">
				{place && (
					<span className="inline-flex items-center gap-1.25 text-[12.5px] font-medium text-primary-text">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
							<path d="M12 2C8 2 5 5 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
						</svg>
						<span className="truncate">{place}</span>
					</span>
				)}
				<h3 className="text-base leading-[1.35] font-semibold">{tour.title}</h3>
				{meta && <p className="text-[12.5px] text-muted-foreground">{meta}</p>}
				<div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
					<span>
						<span className="text-xs text-muted-foreground">from </span>
						<strong className="text-lg font-bold text-primary-text">৳{formatPrice(tour.costFrom)}</strong>
					</span>
					<SeatsBadge seatsLeft={tour.seatsLeft} />
				</div>
			</div>
		</Link>
	);
}
