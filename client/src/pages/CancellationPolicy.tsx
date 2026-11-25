import { container, SectionHead, sectionTop } from "@/components/modules/Home/shared";
import { ContactCard, DocSections, PageIntro, type TDocSection } from "@/components/modules/Info/InfoBlocks";
import { cn } from "@/lib/utils";
import { CalendarClock, CircleSlash, Clock4, MessageCircle, Ticket } from "lucide-react";
import { Link } from "react-router";

const UPDATED = "25 November 2026";

const tiers = [
	{ when: "7 days or more", before: "before departure", refund: "100%", note: "Full refund of the tour price.", tone: "success" },
	{ when: "3 – 6 days", before: "before departure", refund: "50%", note: "Half of the tour price is refunded.", tone: "warning" },
	{ when: "Under 72 hours", before: "or no-show", refund: "0%", note: "Seats, stays and transport are already paid out.", tone: "danger" },
] as const;

const toneClass = {
	success: "bg-success-soft text-success",
	warning: "bg-warning-soft text-warning",
	danger: "bg-destructive-soft text-destructive",
};

const link = "font-semibold text-primary-text hover:underline";

const sections: TDocSection[] = [
	{
		id: "unpaid",
		title: "Unpaid bookings",
		body: (
			<>
				<p>
					A booking you haven't paid for holds your seats for <strong>30 minutes</strong>. If payment isn't completed in
					that time, the booking is cancelled automatically and the seats return to sale. Nothing is charged.
				</p>
				<p>
					You can also cancel an unpaid booking yourself at any time from{" "}
					<Link to="/user/bookings" className={link}>
						My bookings
					</Link>
					.
				</p>
			</>
		),
	},
	{
		id: "paid",
		title: "Paid bookings",
		body: (
			<>
				<p>
					Paid bookings are cancelled by our team so we can release your seats with the guide and partners. Contact us
					with your booking code and we confirm the cancellation and refund amount within one working day.
				</p>
				<p>The refund depends on how long before the start date we receive your request:</p>
				<ul>
					<li>
						<strong>7 days or more:</strong> 100% of the tour price.
					</li>
					<li>
						<strong>3 to 6 days:</strong> 50% of the tour price.
					</li>
					<li>
						<strong>Less than 72 hours, or not showing up:</strong> no refund.
					</li>
				</ul>
			</>
		),
	},
	{
		id: "refunds",
		title: "How refunds are paid",
		body: (
			<>
				<p>
					Refunds go back to the card or mobile banking account you paid with, through SSLCommerz. Once we approve a
					refund your booking shows as cancelled and the payment as refunded.
				</p>
				<p>
					Banks and mobile wallets usually take <strong>7–10 working days</strong> to show the money. Payment gateway
					charges are not refundable on customer-requested cancellations.
				</p>
			</>
		),
	},
	{
		id: "we-cancel",
		title: "If we cancel or change a tour",
		body: (
			<>
				<p>
					Weather, river conditions or travel restrictions sometimes make a trip unsafe. If we cancel a departure, you
					choose between a <strong>full refund</strong> or moving to another date at no extra cost.
				</p>
				<p>
					If we change the dates of a tour after you booked and the new dates don't work for you, you also get a full
					refund.
				</p>
			</>
		),
	},
	{
		id: "changes",
		title: "Changing guests or dates",
		body: (
			<p>
				To add guests, make a new booking for the extra people while seats are available. To move to another departure,
				contact us at least 7 days before your trip — we cancel the original booking with a full refund once your new
				booking is paid.
			</p>
		),
	},
];

export default function CancellationPolicy() {
	return (
		<div className="bg-background">
			<PageIntro
				crumb="Cancellation policy"
				badge="Policies"
				title="Cancellation & refund policy"
				text="Plans change. Here is exactly what you get back if you cancel, and what happens if we have to cancel a trip."
				updated={UPDATED}
			/>

			<section className={`${container} pt-12 sm:pt-16`}>
				<ul className="grid gap-5 md:grid-cols-3">
					{tiers.map((tier) => (
						<li key={tier.when} className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-card">
							<div className="flex items-center justify-between gap-3">
								<span className="flex size-11 items-center justify-center rounded-[10px] bg-accent text-primary-hover">
									<CalendarClock className="size-5.5" />
								</span>
								<span className={cn("rounded-full px-3 py-1 text-[13px] font-bold", toneClass[tier.tone])}>
									{tier.refund} refund
								</span>
							</div>
							<div>
								<strong className="block text-[19px] font-bold">{tier.when}</strong>
								<span className="text-[13px] text-muted-foreground">{tier.before}</span>
							</div>
							<p className="text-[13.5px] text-muted-foreground">{tier.note}</p>
						</li>
					))}
				</ul>
			</section>

			<section className={`${container} ${sectionTop} flex flex-col gap-10`}>
				<SectionHead title="How to Cancel" text="It depends on whether you've already paid." />
				<div className="grid gap-5 md:grid-cols-2">
					<div className="flex gap-4 rounded-xl bg-card p-6 shadow-card">
						<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
							<Ticket className="size-5" />
						</span>
						<div className="flex flex-col gap-1.5">
							<h3 className="text-[17px] font-semibold">Not paid yet</h3>
							<p className="text-[13.5px] text-muted-foreground">
								Open the booking in My bookings and press Cancel booking. It's instant and nothing is charged.
							</p>
							<Link to="/user/bookings" className={cn(link, "mt-1 text-sm")}>
								Go to My bookings →
							</Link>
						</div>
					</div>
					<div className="flex gap-4 rounded-xl bg-card p-6 shadow-card">
						<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
							<MessageCircle className="size-5" />
						</span>
						<div className="flex flex-col gap-1.5">
							<h3 className="text-[17px] font-semibold">Already paid</h3>
							<p className="text-[13.5px] text-muted-foreground">
								Email or call us with your booking code (for example TRL-…). We confirm the refund amount within one
								working day.
							</p>
							<a href="#contact" className={cn(link, "mt-1 text-sm")}>
								Contact us →
							</a>
						</div>
					</div>
				</div>
			</section>

			<section className={`${container} ${sectionTop}`}>
				<DocSections sections={sections} />
			</section>

			<section id="contact" className={`${container} ${sectionTop} scroll-mt-6 pb-10 sm:pb-25`}>
				<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
					<div className="flex flex-col justify-center gap-4 rounded-2xl bg-soft p-6 sm:p-10">
						<div className="flex gap-3">
							<Clock4 className="size-5 shrink-0 text-primary-text" />
							<p className="text-[14px] text-muted-foreground">
								<strong className="text-foreground">Requests are timed by when we receive them</strong> — send yours as
								early as you can.
							</p>
						</div>
						<div className="flex gap-3">
							<CircleSlash className="size-5 shrink-0 text-primary-text" />
							<p className="text-[14px] text-muted-foreground">
								<strong className="text-foreground">Missed departures</strong> because of late arrival at the meeting
								point count as a no-show.
							</p>
						</div>
					</div>
					<ContactCard title="Request a cancellation" />
				</div>
			</section>
		</div>
	);
}
