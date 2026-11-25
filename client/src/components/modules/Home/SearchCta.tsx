import { formatNumber } from "@/lib/format";
import { useGetPublicStatsQuery } from "@/redux/features/Stats/stats.api";
import { Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { container, sectionTop } from "./shared";

export default function SearchCta() {
	const navigate = useNavigate();
	const { data: stats } = useGetPublicStatsQuery();
	const [query, setQuery] = useState("");

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const term = query.trim();
		navigate(term ? `/tours?searchTerm=${encodeURIComponent(term)}` : "/tours");
	};

	const reach =
		stats && stats.tours > 0
			? `Search ${formatNumber(stats.tours)} upcoming tours across ${formatNumber(stats.divisions)} divisions and book in a few minutes.`
			: "Search guided tours across Bangladesh and book in a few minutes.";

	return (
		<section className={`${container} ${sectionTop} pb-10 sm:pb-25`}>
			<div className="relative flex flex-col items-center gap-3.5 overflow-hidden rounded-2xl bg-cta px-5 py-9 text-center text-cta-foreground sm:px-10 sm:py-14">
				<div
					aria-hidden="true"
					className="absolute -top-1.5 left-12 size-0 border-y-34 border-r-58 border-y-transparent border-r-cta-foreground/18"
				/>
				<div aria-hidden="true" className="absolute right-17.5 -bottom-7.5 size-18 rounded-full bg-white/35" />
				<h2 className="relative text-[26px] leading-tight font-bold sm:text-[32px]">Where do you want to go next?</h2>
				<p className="relative max-w-105 text-sm text-cta-foreground/80">{reach}</p>
				<form
					role="search"
					onSubmit={handleSubmit}
					className="relative mt-2 flex w-full max-w-100 items-center gap-2 rounded-lg bg-white py-1.5 pr-1.5 pl-4"
				>
					<label htmlFor="cta-q" className="sr-only">
						Search tours
					</label>
					<input
						id="cta-q"
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Try “Sajek” or “Sylhet”"
						className="min-h-9 flex-1 border-0 bg-transparent text-[13px] text-cta-foreground outline-none placeholder:text-cta-foreground/50"
					/>
					<button
						type="submit"
						aria-label="Search"
						className="flex size-10 items-center justify-center rounded-md bg-primary-hover text-white transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
					>
						<Send className="size-4" strokeWidth={2.4} />
					</button>
				</form>
			</div>
		</section>
	);
}
