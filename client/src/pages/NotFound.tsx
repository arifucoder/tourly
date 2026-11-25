import { btnGhost, btnPrimary } from "@/components/dashboard/styles";
import { cn } from "@/lib/utils";
import { useGetTrendingToursQuery } from "@/redux/features/Tour/tour.api";
import { Link } from "react-router";

function Mark({ small }: { small?: boolean }) {
	return (
		<div aria-hidden="true" className="leading-[0.9]">
			<span
				className={cn(
					"font-extrabold tracking-[-0.03em] text-primary-text",
					small ? "text-[96px] sm:text-[140px]" : "text-[120px] sm:text-[200px]",
				)}
			>
				4<span className="text-coral">0</span>4
			</span>
			<svg width="120" height="40" viewBox="0 0 120 40" className="mx-auto mt-2 block text-coral">
				<path
					d="M2 30 C 22 8, 40 8, 60 22 S 98 36, 118 10"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeLinecap="round"
					strokeDasharray="2 9"
				/>
			</svg>
		</div>
	);
}

export function DashboardNotFound() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
			<Mark small />
			<p className="text-[13px] font-bold tracking-[0.08em] text-pink uppercase">Off the map</p>
			<h1 className="max-w-140 text-[26px] font-bold tracking-[-0.02em] sm:text-[32px]">This page doesn't exist</h1>
			<p className="max-w-120 text-[15px] text-muted-foreground">
				The link may be old or mistyped. Use the menu to get back to your dashboard.
			</p>
		</div>
	);
}

export default function NotFound() {
	const { data: trending = [] } = useGetTrendingToursQuery(4);

	return (
		<main className="flex min-h-[70svh] flex-col items-center justify-center gap-4.5 px-4 pt-8 pb-16 text-center">
			<Mark />
			<p className="text-[13px] font-bold tracking-[0.08em] text-pink uppercase">Off the map</p>
			<h1 className="max-w-160 text-[28px] leading-tight font-bold tracking-[-0.02em] sm:text-[40px]">
				This trail doesn't lead anywhere
			</h1>
			<p className="max-w-130 text-[17px] text-muted-foreground">
				The page may have moved, or the tour is no longer running. Let's get you back on track.
			</p>
			<div className="flex flex-wrap justify-center gap-2.5 pt-1.5">
				<Link to="/" className={cn(btnPrimary, "h-12 px-5 text-[15px]")}>
					Go to home
				</Link>
				<Link to="/tours" className={cn(btnGhost, "h-12 px-5 text-[15px]")}>
					Browse all tours
				</Link>
			</div>
			{trending.length > 0 && (
				<nav aria-label="Popular tours" className="flex flex-wrap justify-center gap-2 pt-4.5">
					<span className="self-center text-sm text-muted-foreground">Popular:</span>
					{trending.map((tour) => (
						<Link
							key={tour._id}
							to={`/tours/${tour.slug}`}
							className="inline-flex min-h-10 max-w-60 items-center rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-primary hover:text-primary-text"
						>
							<span className="truncate">{tour.title}</span>
						</Link>
					))}
				</nav>
			)}
		</main>
	);
}
