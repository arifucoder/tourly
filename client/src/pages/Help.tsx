import { container, sectionTop } from "@/components/modules/Home/shared";
import { ContactCard, PageIntro } from "@/components/modules/Info/InfoBlocks";
import { ChevronDown, Compass, CreditCard, SearchX, Ticket, UserRound } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router";

type TFaq = { q: string; a: ReactNode; text: string };
type TTopic = { id: string; title: string; text: string; icon: typeof Ticket; faqs: TFaq[] };

const faq = (q: string, a: string, extra?: ReactNode): TFaq => ({ q, a: extra ?? a, text: `${q} ${a}` });

const link = "font-semibold text-primary-text hover:underline";

const topics: TTopic[] = [
	{
		id: "booking",
		title: "Booking a tour",
		text: "Seats, dates and guests",
		icon: Ticket,
		faqs: [
			faq(
				"How do I book a tour?",
				"Open a tour, choose the number of guests and press Book now. You review the booking, then pay securely. Your phone and address must be in your profile first.",
			),
			faq(
				"Why can't I book a tour I can still see?",
				"Tours close for booking once their start date has passed or every seat is taken. The button then shows Booking closed or Fully booked.",
			),
			faq(
				"How long is my seat held?",
				"An unpaid booking holds your seats for 30 minutes. If you don't pay in time it is cancelled automatically and the seats go back on sale — you can retry from My bookings if seats are still free.",
			),
			faq(
				"Can I cancel and get a refund?",
				"Unpaid bookings can be cancelled from My bookings at no cost. For paid bookings, refunds depend on how early you cancel — see the cancellation policy.",
				<>
					Unpaid bookings can be cancelled from My bookings at no cost. For paid bookings the refund depends on how early
					you cancel — see the <Link to="/cancellation-policy" className={link}>cancellation policy</Link>.
				</>,
			),
			faq(
				"Is there a minimum age?",
				"Some tours set a minimum age, shown on the tour page next to the group size. Every guest in your booking must meet it.",
			),
		],
	},
	{
		id: "payment",
		title: "Payments & invoices",
		text: "SSLCommerz, receipts",
		icon: CreditCard,
		faqs: [
			faq(
				"How can I pay?",
				"Payments go through SSLCommerz, so you can pay in taka by card, mobile banking (bKash, Nagad, Rocket) or internet banking.",
			),
			faq(
				"My payment failed. What now?",
				"Nothing was charged for a failed payment. Open the booking in My bookings and press Pay again while the seat hold is still active.",
			),
			faq(
				"Where is my invoice?",
				"Once a payment succeeds we email you a PDF invoice. You can also download it any time from the booking page in My bookings.",
			),
		],
	},
	{
		id: "trip",
		title: "Your trip & guide",
		text: "Guides, meeting point",
		icon: Compass,
		faqs: [
			faq(
				"When do I get my guide's contact?",
				"A verified guide is assigned to every paid booking. Their name and phone number appear on your booking page within 48 hours of departure.",
			),
			faq(
				"What's included in the price?",
				"Each tour page lists what's included and excluded — usually transport, stays and listed meals. Personal expenses are not included.",
			),
			faq(
				"Can I become a guide?",
				"Yes. Apply from your account with your division and experience.",
				<>
					Yes. <Link to="/user/become-a-guide" className={link}>Apply as a guide</Link> with your division and
					experience — once an admin approves it, you get a guide dashboard with your assigned trips.
				</>,
			),
		],
	},
	{
		id: "account",
		title: "Account & security",
		text: "Login, password, profile",
		icon: UserRound,
		faqs: [
			faq(
				"I didn't get the verification code.",
				"Check your spam folder, then request a new code from the verify screen. Codes expire after a few minutes.",
			),
			faq(
				"How do I reset my password?",
				"Use Forgot password on the login page — we email you a reset link.",
				<>
					Use <Link to="/forgot-password" className={link}>Forgot password</Link> on the login page — we email you a
					reset link. If you signed up with Google you can also set a password from Security in your dashboard.
				</>,
			),
			faq(
				"How do I update my phone or address?",
				"Open Profile in your dashboard. Your guide uses these details to reach you before a trip.",
			),
		],
	},
];

function FaqItem({ item }: { item: TFaq }) {
	return (
		<details className="group rounded-xl border border-border bg-card open:shadow-card">
			<summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
				{item.q}
				<ChevronDown className="size-4.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
			</summary>
			<p className="px-5 pb-5 text-[14px] text-muted-foreground">{item.a}</p>
		</details>
	);
}

export default function Help() {
	const [query, setQuery] = useState("");
	const term = query.trim().toLowerCase();

	const filtered = useMemo(
		() =>
			topics
				.map((topic) => ({ ...topic, faqs: topic.faqs.filter((item) => item.text.toLowerCase().includes(term)) }))
				.filter((topic) => topic.faqs.length > 0),
		[term],
	);

	return (
		<div className="bg-background">
			<PageIntro
				crumb="Help centre"
				badge="Help centre"
				title="How can we help?"
				text="Answers to the questions travellers ask most — about booking, paying, your guide and your account."
			>
				<div className="mt-2 w-full max-w-140">
					<label htmlFor="help-q" className="sr-only">
						Search help articles
					</label>
					<input
						id="help-q"
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search, e.g. “invoice” or “refund”"
						className="min-h-13 w-full rounded-xl border border-border bg-card px-5 text-[15px] shadow-card outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30"
					/>
				</div>
			</PageIntro>

			<section className={`${container} pt-12 sm:pt-16`}>
				<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{topics.map(({ id, title, text, icon: Icon }) => (
						<li key={id}>
							<a
								href={`#${id}`}
								className="flex h-full items-center gap-3.5 rounded-xl bg-card p-5 shadow-card transition-colors hover:text-primary-text"
							>
								<span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-accent text-primary-hover">
									<Icon className="size-5.5" />
								</span>
								<span className="leading-tight">
									<strong className="block text-[15px] font-semibold">{title}</strong>
									<span className="text-[12.5px] text-muted-foreground">{text}</span>
								</span>
							</a>
						</li>
					))}
				</ul>
			</section>

			<section className={`${container} ${sectionTop} grid items-start gap-8 pb-10 sm:pb-25 lg:grid-cols-[minmax(0,1fr)_340px]`}>
				<div className="flex flex-col gap-10">
					{filtered.length === 0 ? (
						<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center">
							<SearchX className="size-8 text-muted-foreground" />
							<strong>No answers match “{query.trim()}”</strong>
							<p className="text-sm text-muted-foreground">Try another word, or contact us — we reply within a day.</p>
						</div>
					) : (
						filtered.map((topic) => (
							<div key={topic.id} id={topic.id} className="flex scroll-mt-6 flex-col gap-4">
								<h2 className="text-[24px] font-bold sm:text-[28px]">{topic.title}</h2>
								<div className="flex flex-col gap-3">
									{topic.faqs.map((item) => (
										<FaqItem key={item.q} item={item} />
									))}
								</div>
							</div>
						))
					)}
				</div>

				<aside className="flex flex-col gap-5 lg:sticky lg:top-6">
					<ContactCard title="Still need help?" />
					<div className="rounded-2xl bg-cta p-6 text-cta-foreground">
						<strong className="block text-[17px]">Need to cancel?</strong>
						<p className="mt-1 text-[13.5px] text-cta-foreground/80">
							See what you get back and how to cancel a booking.
						</p>
						<Link
							to="/cancellation-policy"
							className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-cta-foreground px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						>
							Cancellation policy
						</Link>
					</div>
				</aside>
			</section>
		</div>
	);
}
