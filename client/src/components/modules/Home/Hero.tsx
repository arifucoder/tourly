import heroImage from "@/assets/images/auth/inani-beach.jpeg";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { useGetPublicStatsQuery } from "@/redux/features/Stats/stats.api";
import { useGetTourFilterOptionsQuery } from "@/redux/features/Tour/tour.api";
import { Map, Mountain, Play, Search, UsersRound } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { btnOrange, container } from "./shared";

const segLabel = "block text-sm font-semibold text-foreground";
const segField =
	"block min-h-7 w-full border-0 bg-transparent pt-1 text-[13px] text-muted-foreground outline-none placeholder:text-muted-foreground";
const seg = "min-w-0 flex-1 border-b border-border px-1 py-2.5 sm:border-0 sm:px-5 sm:py-0";

export default function Hero() {
	const navigate = useNavigate();
	const { data: stats, isLoading: statsLoading } = useGetPublicStatsQuery();
	const { data: options } = useGetTourFilterOptionsQuery();
	const [location, setLocation] = useState("");
	const [division, setDivision] = useState("");
	const [tourType, setTourType] = useState("");

	const month = new Date().toLocaleDateString("en-GB", { month: "long" });
	const departures = stats?.departuresThisMonth ?? 0;
	const share = stats?.tours ? Math.min(100, Math.round((departures / stats.tours) * 100)) : 0;

	const facts = [
		{ icon: Map, value: stats?.divisions, label: "Divisions covered" },
		{ icon: Mountain, value: stats?.tours, label: "Upcoming tours" },
		{ icon: UsersRound, value: stats?.maxGroupSize, label: "Max guests per group" },
	];

	const handleSearch = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const params = new URLSearchParams();
		if (location.trim()) params.set("searchTerm", location.trim());
		if (division) params.set("division", division);
		if (tourType) params.set("tourType", tourType);
		const query = params.toString();
		navigate(query ? `/tours?${query}` : "/tours");
	};

	return (
		<section className={`${container} pt-6 sm:pt-10`}>
			<div className="flex flex-col items-stretch gap-10 lg:flex-row lg:items-center">
				<div className="flex flex-col gap-6 lg:flex-[1.15_1_0]">
					<h1 className="text-[38px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[58px]">
						Explore Bangladesh, One Trip at a Time
					</h1>
					<p className="max-w-100 text-muted-foreground">
						Book guided group tours to hills, mangroves and beaches — with verified local guides, clear prices in
						taka and secure online payment.
					</p>
					<div className="flex flex-wrap items-center gap-5.5">
						<Link to="/tours" className={btnOrange}>
							Discover Tours
						</Link>
						<a href="#divisions" className="inline-flex items-center gap-3 text-sm font-semibold text-foreground">
							<span
								aria-hidden="true"
								className="flex size-12 items-center justify-center rounded-full border-3 border-primary border-r-transparent"
							>
								<Play className="size-3.5 fill-foreground" strokeWidth={0} />
							</span>
							Browse divisions
						</a>
					</div>
				</div>

				<div className="relative mx-auto h-90 w-full max-w-105 min-w-0 shrink-0 sm:h-110 lg:flex-1">
					<div
						aria-hidden="true"
						className="absolute top-[4%] left-[12%] h-[72%] w-[86%] -rotate-14 rounded-[62%_38%_55%_45%/48%_60%_40%_52%] bg-pink-soft"
					/>
					<div className="absolute top-0 left-[18%] h-[86%] w-[72%] overflow-hidden rounded-[26px] shadow-card">
						<img
							src={heroImage}
							alt="Inani beach at Cox's Bazar"
							className="size-full object-cover"
							fetchPriority="high"
						/>
					</div>
					<div className="absolute bottom-2 left-0 flex w-37.5 flex-col items-center gap-2 rounded-xl bg-card p-4 text-center shadow-card">
						<span
							aria-hidden="true"
							className="flex size-17.5 items-center justify-center rounded-full"
							style={{ background: `conic-gradient(var(--primary) 0 ${share}%, var(--border) ${share}% 100%)` }}
						>
							<span className="flex size-13.5 items-center justify-center rounded-full bg-card text-base font-bold">
								{statsLoading ? "…" : formatNumber(departures)}
							</span>
						</span>
						<strong className="text-sm leading-tight">Departures</strong>
						<span className="text-[11.5px] leading-tight text-muted-foreground">left this {month}</span>
					</div>
				</div>

				<ul className="flex flex-row flex-wrap justify-between gap-6 lg:flex-[0_0_180px] lg:flex-col lg:gap-7.5">
					{facts.map(({ icon: Icon, value, label }) => (
						<li key={label} className="flex items-center gap-3.5">
							<span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-card text-primary-hover shadow-card">
								<Icon className="size-5.5" strokeWidth={2} />
							</span>
							<div className="leading-tight">
								{statsLoading ? (
									<Skeleton className="mb-1 h-6 w-10" />
								) : (
									<strong className="block text-[26px] font-bold">{value ? formatNumber(value) : "—"}</strong>
								)}
								<span className="text-[12.5px] text-muted-foreground">{label}</span>
							</div>
						</li>
					))}
				</ul>
			</div>

			<form
				role="search"
				aria-label="Search tours"
				onSubmit={handleSearch}
				className="mx-auto mt-14 flex max-w-200 flex-col items-stretch gap-1.5 rounded-xl bg-card p-4 shadow-card sm:flex-row sm:items-center sm:py-4.5 sm:pr-4.5 sm:pl-1"
			>
				<div className={`${seg} sm:flex-[1.3_1_0]`}>
					<label htmlFor="home-q" className={segLabel}>
						Location
					</label>
					<input
						id="home-q"
						type="search"
						value={location}
						onChange={(event) => setLocation(event.target.value)}
						placeholder="Sajek, Sundarbans, tea gardens…"
						className={segField}
					/>
				</div>
				<div className={seg}>
					<label htmlFor="home-division" className={segLabel}>
						Division
					</label>
					<select
						id="home-division"
						value={division}
						onChange={(event) => setDivision(event.target.value)}
						className={segField}
					>
						<option value="">All divisions</option>
						{options?.divisions.map((item) => (
							<option key={item._id} value={item._id}>
								{item.name}
							</option>
						))}
					</select>
				</div>
				<div className={seg}>
					<label htmlFor="home-type" className={segLabel}>
						Tour type
					</label>
					<select
						id="home-type"
						value={tourType}
						onChange={(event) => setTourType(event.target.value)}
						className={segField}
					>
						<option value="">Any type</option>
						{options?.tourTypes.map((item) => (
							<option key={item._id} value={item._id}>
								{item.name}
							</option>
						))}
					</select>
				</div>
				<button
					type="submit"
					className="mt-2 inline-flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-lg bg-navy px-7 text-[15px] font-semibold text-white shadow-[0_14px_28px_rgb(10_25_45/0.25)] transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:mt-0"
				>
					<Search className="size-4.5" strokeWidth={2.4} />
					Search
				</button>
			</form>
		</section>
	);
}
