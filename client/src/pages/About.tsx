import heroImage from "@/assets/images/auth/inani-beach.jpeg";
import { btnOrange, container, SectionHead, sectionTop } from "@/components/modules/Home/shared";
import { ContactCard } from "@/components/modules/Info/InfoBlocks";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { useGetPublicStatsQuery } from "@/redux/features/Stats/stats.api";
import { useGetTrendingToursQuery } from "@/redux/features/Tour/tour.api";
import {
	BadgeCheck,
	CalendarCheck,
	Compass,
	HandCoins,
	HeartHandshake,
	Leaf,
	Search,
	ShieldCheck,
	UsersRound,
} from "lucide-react";
import { Link } from "react-router";

const values = [
	{
		icon: BadgeCheck,
		title: "Local guides first",
		text: "Every trip is led by someone who grew up near the trail. Guides apply, we review them, and only approved guides lead groups.",
	},
	{
		icon: HandCoins,
		title: "Honest prices in taka",
		text: "One per-person price with what's included listed up front. No surprise fees at the jetty or the hotel desk.",
	},
	{
		icon: UsersRound,
		title: "Small groups",
		text: "Every departure has a guest limit, so boats aren't crowded and the guide actually knows your name.",
	},
	{
		icon: Leaf,
		title: "Leave places better",
		text: "We favour local homestays, eateries and boatmen, and we keep hill and mangrove trips plastic-light.",
	},
];

const steps = [
	{
		icon: Search,
		title: "Find a tour",
		text: "Filter by division, tour type, dates and budget. Every tour shows seats left and what's included.",
	},
	{
		icon: ShieldCheck,
		title: "Book and pay securely",
		text: "Review your booking, then pay through SSLCommerz by card or mobile banking. Your seat is held while you pay.",
	},
	{
		icon: CalendarCheck,
		title: "Get your invoice",
		text: "A PDF invoice lands in your email and stays in My bookings, along with the full trip plan.",
	},
	{
		icon: Compass,
		title: "Meet your guide",
		text: "A verified guide is assigned before departure and their contact details appear close to the trip date.",
	},
];


function Intro() {
	const { data: stats, isLoading } = useGetPublicStatsQuery();
	const { data: trending } = useGetTrendingToursQuery(8);
	const sideImage = trending?.find((tour) => tour.images?.[0])?.images?.[0];

	const facts = [
		{ value: stats?.tours, label: "Upcoming tours" },
		{ value: stats?.divisions, label: "Divisions covered" },
		{ value: stats?.maxGroupSize, label: "Max guests per group" },
	];

	return (
		<section className={`${container} pt-6 sm:pt-10`}>
			<nav aria-label="Breadcrumb" className="flex gap-2 text-[13.5px] text-muted-foreground">
				<Link to="/" className="hover:text-foreground">
					Home
				</Link>
				<span aria-hidden="true">/</span>
				<span className="font-medium text-primary-text">About</span>
			</nav>

			<div className="mt-6 flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
				<div className="flex flex-col gap-6 lg:flex-[1.1_1_0]">
					<span className="w-fit rounded-full bg-accent px-3 py-1.25 text-[12.5px] font-semibold text-accent-foreground">
						About Tourly
					</span>
					<h1 className="text-[38px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[52px]">
						We make Bangladesh easy to explore
					</h1>
					<p className="max-w-130 text-muted-foreground">
						Tourly started with a simple frustration: great trips to Sajek, the Sundarbans or Srimangal were planned
						over phone calls, cash deposits and guesswork. We put guided group tours online — with clear prices,
						verified local guides and secure payment — so you can book a trip in minutes and just enjoy it.
					</p>

					<dl className="grid grid-cols-3 gap-3 sm:max-w-120">
						{facts.map(({ value, label }) => (
							<div key={label} className="flex flex-col rounded-xl bg-card p-4 shadow-card">
								<dt className="order-2 text-[12px] leading-tight text-muted-foreground">{label}</dt>
								<dd className="text-[26px] font-bold text-primary-text">
									{isLoading ? <Skeleton className="my-1 h-7 w-10" /> : value ? formatNumber(value) : "—"}
								</dd>
							</div>
						))}
					</dl>
				</div>

				<div className="relative mx-auto h-90 w-full max-w-115 shrink-0 sm:h-110 lg:flex-1">
					<div
						aria-hidden="true"
						className="absolute top-[6%] right-0 h-[70%] w-[80%] rotate-10 rounded-[62%_38%_55%_45%/48%_60%_40%_52%] bg-pink-soft"
					/>
					<div className="absolute top-0 left-0 h-[78%] w-[68%] overflow-hidden rounded-[26px] shadow-card">
						<img src={heroImage} alt="Sunset at Inani beach, Cox's Bazar" className="size-full object-cover" />
					</div>
					<div className="absolute right-0 bottom-0 h-[52%] w-[50%] overflow-hidden rounded-[22px] border-4 border-background bg-placeholder shadow-card">
						<img src={sideImage ?? heroImage} alt="" loading="lazy" className="size-full object-cover" />
					</div>
				</div>
			</div>
		</section>
	);
}

function Values() {
	return (
		<section className={`${container} ${sectionTop} flex flex-col gap-10`}>
			<SectionHead
				title="What We Stand For"
				text="Four promises that shape every tour we list and every guide we approve."
			/>
			<ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{values.map(({ icon: Icon, title, text }) => (
					<li key={title} className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-card">
						<span className="flex size-11 items-center justify-center rounded-[10px] bg-accent text-primary-hover">
							<Icon className="size-5.5" strokeWidth={2} />
						</span>
						<div className="flex flex-col gap-1.5">
							<h3 className="text-[17px] font-semibold">{title}</h3>
							<p className="text-[13.5px] text-muted-foreground">{text}</p>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}

function HowItWorks() {
	return (
		<section className={`${sectionTop}`}>
			<div className="bg-soft py-16 sm:py-24">
				<div className={`${container} flex flex-col gap-10`}>
					<SectionHead
						title="How Tourly Works"
						text="From the first search to the first sunrise — here's what booking with us looks like."
						action={
							<Link to="/tours" className={btnOrange}>
								Browse tours
							</Link>
						}
					/>
					<ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{steps.map(({ icon: Icon, title, text }, i) => (
							<li key={title} className="relative flex flex-col gap-4 rounded-xl bg-card p-6 shadow-card">
								<div className="flex items-center justify-between">
									<span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_22px_rgb(255_123_41/0.35)]">
										<Icon className="size-5" strokeWidth={2.2} />
									</span>
									<span aria-hidden="true" className="text-[34px] leading-none font-bold text-border">
										{String(i + 1).padStart(2, "0")}
									</span>
								</div>
								<div className="flex flex-col gap-1.5">
									<h3 className="text-[17px] font-semibold">
										<span className="sr-only">Step {i + 1}: </span>
										{title}
									</h3>
									<p className="text-[13.5px] text-muted-foreground">{text}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</div>
		</section>
	);
}

function GuideAndContact() {
	return (
		<section className={`${container} ${sectionTop} pb-10 sm:pb-25`}>
			<div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
				<div className="relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl bg-cta px-6 py-9 text-cta-foreground sm:px-10 sm:py-12">
					<div aria-hidden="true" className="absolute -right-6 -bottom-8 size-36 rounded-full bg-white/35" />
					<div
						aria-hidden="true"
						className="absolute -top-1.5 right-24 size-0 border-y-30 border-l-50 border-y-transparent border-l-cta-foreground/15"
					/>
					<span className="relative flex size-11 items-center justify-center rounded-[10px] bg-white/60">
						<HeartHandshake className="size-5.5" strokeWidth={2} />
					</span>
					<h2 className="relative text-[26px] leading-tight font-bold sm:text-[32px]">Know a place like the back of your hand?</h2>
					<p className="relative max-w-115 text-sm text-cta-foreground/80">
						Become a Tourly guide. Tell us your division and experience — once approved, we assign you groups and
						you get every traveller's details right in your guide dashboard.
					</p>
					<Link
						to="/user/become-a-guide"
						className="relative mt-2 inline-flex min-h-12 items-center justify-center rounded-lg bg-cta-foreground px-6.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
					>
						Apply as a guide
					</Link>
				</div>

				<ContactCard />
			</div>
		</section>
	);
}

export default function About() {
	return (
		<div className="bg-background">
			<Intro />
			<Values />
			<HowItWorks />
			<GuideAndContact />
		</div>
	);
}
