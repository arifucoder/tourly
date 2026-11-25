import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetDivisionsQuery } from "@/redux/features/Division/division.api";
import { useGetTourFilterOptionsQuery } from "@/redux/features/Tour/tour.api";
import { MapPinned } from "lucide-react";
import { Link } from "react-router";
import { btnOrange, container, SectionHead, sectionTop } from "./shared";

const MAX_TILES = 8;

const bento = [
	"lg:col-start-1 lg:row-span-2",
	"lg:col-span-2",
	"lg:col-start-4 lg:row-span-2",
	"",
	"",
	"lg:col-span-2",
	"",
	"",
];

export default function DivisionGrid() {
	const { data: divisions = [], isLoading: divisionsLoading } = useGetDivisionsQuery();
	const { data: options, isLoading: optionsLoading } = useGetTourFilterOptionsQuery();
	const isLoading = divisionsLoading || optionsLoading;

	const counts = new Map((options?.divisions ?? []).map((item) => [item._id, item.count]));
	const tiles = divisions
		.map((division) => ({ ...division, count: counts.get(division._id) ?? 0 }))
		.filter((division) => division.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, MAX_TILES);
	const useBento = tiles.length === MAX_TILES;

	if (!isLoading && tiles.length === 0) return null;

	return (
		<section id="divisions" className={`${container} ${sectionTop} flex scroll-mt-6 flex-col gap-9`}>
			<SectionHead
				title="Browse by Division"
				text="From the hill tracts of Chattogram to the tea gardens of Sylhet."
				action={
					<Link to="/tours" className={btnOrange}>
						See all tours
					</Link>
				}
			/>
			<div className="grid auto-rows-[170px] grid-cols-2 gap-4.5 lg:auto-rows-[180px] lg:grid-cols-4">
				{isLoading
					? Array.from({ length: MAX_TILES }).map((_, i) => (
							<Skeleton key={i} className={cn("rounded-[14px]", bento[i])} />
						))
					: tiles.map((division, i) => (
							<Link
								key={division._id}
								to={`/tours?division=${division._id}`}
								className={cn(
									"group relative flex items-end overflow-hidden rounded-[14px] bg-linear-to-br from-primary to-coral text-white focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
									useBento && bento[i],
								)}
							>
								{division.thumbnail ? (
									<img
										src={division.thumbnail}
										alt=""
										loading="lazy"
										className="absolute inset-0 size-full object-cover transition-transform duration-400 group-hover:scale-105"
									/>
								) : (
									<MapPinned aria-hidden="true" className="absolute top-4 right-4 size-8 opacity-40" />
								)}
								<div className="absolute inset-0 bg-linear-to-b from-transparent from-40% to-black/65" />
								<span className="absolute top-3.5 left-3.5 rounded-full bg-white px-2.5 py-0.75 text-[11.5px] font-semibold text-accent-foreground">
									{division.count} {division.count === 1 ? "tour" : "tours"}
								</span>
								<div className="relative px-4.5 py-4 leading-tight">
									<strong className="block text-[19px] font-semibold">{division.name}</strong>
									{division.description && (
										<span className="line-clamp-1 text-xs text-white/85">{division.description}</span>
									)}
								</div>
							</Link>
						))}
			</div>
		</section>
	);
}
