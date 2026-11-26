import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useGetToursQuery } from "@/redux/features/Tour/tour.api";
import type { ITour } from "@/types";
import { CalendarDays, Clock, ImageIcon, MapPin } from "lucide-react";
import { Link } from "react-router";
import { tourDays } from "@/lib/format";
import { btnOrange, container, SectionHead, sectionTop } from "./shared";

const meta = "inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground";

function BestTourCard({ tour }: { tour: ITour }) {
	const place = [tour.location, tour.division?.name].filter(Boolean).join(", ");
	const days = tourDays(tour);

	return (
		<Link
			to={`/tours/${tour.slug}`}
			className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-card focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
		>
			<div className="flex h-57.5 items-center justify-center overflow-hidden bg-placeholder text-placeholder-foreground">
				{tour.images?.[0] ? (
					<img
						src={tour.images[0]}
						alt={tour.title}
						loading="lazy"
						className="size-full object-cover transition-transform duration-400 group-hover:scale-105"
					/>
				) : (
					<ImageIcon className="size-7" />
				)}
			</div>
			<div className="flex flex-col gap-1.5 px-5.5 pt-5 pb-5.5">
				<strong className="text-xl font-bold text-primary-text">
					৳{(tour.costFrom ?? 0).toLocaleString("en-IN")}
					<span className="text-[13px] font-medium">/person</span>
				</strong>
				<strong className="text-lg font-semibold text-foreground group-hover:text-primary-text">{tour.title}</strong>
				{place && (
					<span className={`${meta} mt-2`}>
						<MapPin className="size-3.5" />
						{place}
					</span>
				)}
				<div className="flex flex-wrap gap-4.5">
					{tour.startDate && (
						<span className={meta}>
							<CalendarDays className="size-3.5" />
							{formatDate(tour.startDate)}
						</span>
					)}
					{days && (
						<span className={meta}>
							<Clock className="size-3.5" />
							{days}
						</span>
					)}
				</div>
			</div>
		</Link>
	);
}

export default function BestTours() {
	const { data, isLoading, isError } = useGetToursQuery({ limit: 3, sort: "startDate" });
	const tours = data?.data ?? [];

	if (!isLoading && (isError || tours.length === 0)) return null;

	return (
		<section className={`${container} ${sectionTop} flex flex-col gap-10`}>
			<SectionHead
				title="Our Best Tours"
				text="The next departures leaving soon — pick a date, bring your friends and we handle the rest."
				action={
					<Link to="/tours" className={btnOrange}>
						See all tours
					</Link>
				}
			/>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-7">
				{isLoading
					? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-95 rounded-xl" />)
					: tours.map((tour) => <BestTourCard key={tour._id} tour={tour} />)}
			</div>
		</section>
	);
}
