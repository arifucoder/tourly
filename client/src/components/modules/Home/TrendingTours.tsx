import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetTrendingToursQuery } from "@/redux/features/Tour/tour.api";
import type { ITour } from "@/types";
import { ArrowLeft, ArrowRight, ImageIcon, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { tourDays } from "@/lib/format";
import { container, SectionHead, sectionTop } from "./shared";

const PAGE_SIZE = 4;

const circleBtn =
	"inline-flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

function TrendingCard({ tour, highlight }: { tour: ITour; highlight: boolean }) {
	const days = tourDays(tour);
	const details = [days, tour.maxGuest && `Max ${tour.maxGuest} guests`].filter(Boolean).join(" | ");

	return (
		<article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
			<div className="flex h-42.5 items-center justify-center overflow-hidden rounded-lg bg-placeholder text-placeholder-foreground">
				{tour.images?.[0] ? (
					<img src={tour.images[0]} alt={tour.title} loading="lazy" className="size-full object-cover" />
				) : (
					<ImageIcon className="size-6" />
				)}
			</div>
			<div className="flex flex-col gap-0.5 px-1">
				<Link to={`/tours/${tour.slug}`} className="line-clamp-1 text-[15.5px] font-semibold hover:text-primary-text">
					{tour.title}
				</Link>
				{details && <span className="text-xs text-muted-foreground">{details}</span>}
			</div>
			<div className="mt-auto flex items-center justify-between gap-3 px-1">
				<strong className="text-[19px] font-bold">৳{(tour.costFrom ?? 0).toLocaleString("en-IN")}</strong>
				<Link
					to={`/tours/${tour.slug}`}
					className={cn(
						"inline-flex min-h-9 items-center justify-center rounded-md border-[1.5px] border-cyan px-3.5 text-[13px] font-semibold transition-colors",
						highlight ? "bg-cyan text-white hover:opacity-90" : "text-cyan-text hover:bg-cyan hover:text-white",
					)}
				>
					Book now
				</Link>
			</div>
			<div className="flex items-center gap-2.5 border-t border-border px-1 pt-2.5 pb-0.5">
				<span
					aria-hidden="true"
					className="flex size-6.5 items-center justify-center rounded-full bg-accent text-primary-hover"
				>
					<Send className="size-3.25" strokeWidth={2.6} />
				</span>
				<span className="text-[12.5px] text-muted-foreground">
					{tour.division?.name ?? "Bangladesh"} · verified guide
				</span>
			</div>
		</article>
	);
}

export default function TrendingTours() {
	const { data: tours = [], isLoading, isError } = useGetTrendingToursQuery(8);
	const [page, setPage] = useState(0);

	if (!isLoading && (isError || tours.length === 0)) return null;

	const pageCount = Math.max(1, Math.ceil(tours.length / PAGE_SIZE));
	const visible = tours.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

	return (
		<section className={`${container} ${sectionTop} flex flex-col gap-9`}>
			<SectionHead
				title="Trending This Season"
				text="Tours travellers are booking most right now."
				action={
					pageCount > 1 && (
						<div className="flex gap-3">
							<button
								type="button"
								aria-label="Previous tours"
								className={circleBtn}
								disabled={page === 0}
								onClick={() => setPage((p) => p - 1)}
							>
								<ArrowLeft className="size-4.5" />
							</button>
							<button
								type="button"
								aria-label="Next tours"
								className={cn(
									circleBtn,
									"border-primary bg-primary text-primary-foreground shadow-[0_10px_22px_rgb(255_123_41/0.35)] hover:bg-primary-hover",
								)}
								disabled={page >= pageCount - 1}
								onClick={() => setPage((p) => p + 1)}
							>
								<ArrowRight className="size-4.5" />
							</button>
						</div>
					)
				}
			/>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-5">
				{isLoading
					? Array.from({ length: PAGE_SIZE }).map((_, i) => <Skeleton key={i} className="h-90 rounded-xl" />)
					: visible.map((tour, i) => <TrendingCard key={tour._id} tour={tour} highlight={i === 0} />)}
			</div>
		</section>
	);
}
