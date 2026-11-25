import { container, sectionTop } from "@/components/modules/Home/shared";
import { ContactCard, DocSections, PageIntro, type TDocSection } from "@/components/modules/Info/InfoBlocks";
import { siteContact } from "@/constants/site";
import { Link } from "react-router";

const UPDATED = "25 November 2026";
const link = "font-semibold text-primary-text hover:underline";

const terms: TDocSection[] = [
	{
		id: "using-tourly",
		title: "Using Tourly",
		body: (
			<>
				<p>
					Tourly is a platform for booking guided group tours in Bangladesh. By creating an account or booking a tour
					you agree to these terms. If you don't agree, please don't use the service.
				</p>
				<p>You must be at least 18 to create an account and book. Younger travellers can join a booking made by an adult.</p>
			</>
		),
	},
	{
		id: "accounts",
		title: "Your account",
		body: (
			<ul>
				<li>Keep your login details private. You're responsible for bookings made from your account.</li>
				<li>Give us a correct name, phone number and address — guides use them to reach you before a trip.</li>
				<li>We may block accounts that make fraudulent payments, abuse guides or other travellers, or misuse the site.</li>
			</ul>
		),
	},
	{
		id: "bookings",
		title: "Bookings & payments",
		body: (
			<>
				<p>
					A booking is confirmed only after payment succeeds and you receive an invoice. Prices are per person, in
					Bangladeshi Taka, and include only what the tour page lists as included.
				</p>
				<p>
					Unpaid bookings hold seats for 30 minutes. Cancellations and refunds follow our{" "}
					<Link to="/cancellation-policy" className={link}>
						cancellation policy
					</Link>
					.
				</p>
			</>
		),
	},
	{
		id: "guides",
		title: "Guides",
		body: (
			<>
				<p>
					Guides apply through Tourly and are approved by our team before they lead groups. Approved guides agree to
					arrive on time, follow the published tour plan and keep travellers' details private.
				</p>
				<p>We can remove guide access at any time if these standards aren't met.</p>
			</>
		),
	},
	{
		id: "on-the-trip",
		title: "On the trip",
		body: (
			<ul>
				<li>Follow your guide's safety instructions, especially on boats, hills and beaches.</li>
				<li>Carry a valid ID. Some areas (for example the Chittagong Hill Tracts) require it at checkpoints.</li>
				<li>We aren't responsible for delays or losses caused by weather, traffic, strikes or other events outside our control.</li>
			</ul>
		),
	},
];

const privacy: TDocSection[] = [
	{
		id: "data-we-collect",
		title: "Data we collect",
		body: (
			<ul>
				<li>
					<strong>Account:</strong> name, email, password (stored hashed), profile photo, phone and address.
				</li>
				<li>
					<strong>Bookings:</strong> the tours you book, guest count, booking status and invoices.
				</li>
				<li>
					<strong>Payments:</strong> transaction IDs and status from SSLCommerz. We never see or store your card or
					wallet details.
				</li>
				<li>
					<strong>Guide applications:</strong> division, experience and the message you send.
				</li>
			</ul>
		),
	},
	{
		id: "how-we-use",
		title: "How we use it",
		body: (
			<ul>
				<li>To run your bookings, send verification codes, invoices and trip updates by email.</li>
				<li>To share your name and phone with the guide assigned to your trip, close to departure.</li>
				<li>To keep the platform safe and understand which tours people like.</li>
			</ul>
		),
	},
	{
		id: "sharing",
		title: "Who we share it with",
		body: (
			<>
				<p>We don't sell your data. We only share what's needed with services that help run Tourly:</p>
				<ul>
					<li>SSLCommerz, to process payments.</li>
					<li>Cloudinary, to store images and invoice PDFs.</li>
					<li>Our email provider, to send codes and invoices.</li>
					<li>Google, only if you choose to sign in with Google.</li>
				</ul>
			</>
		),
	},
	{
		id: "cookies",
		title: "Cookies",
		body: (
			<p>
				We use secure cookies to keep you signed in, and store your light or dark theme choice in your browser. We don't
				use advertising cookies.
			</p>
		),
	},
	{
		id: "your-rights",
		title: "Your choices",
		body: (
			<p>
				You can update your profile any time from your dashboard. To get a copy of your data or delete your account,
				email{" "}
				<a href={`mailto:${siteContact.email}`} className={link}>
					{siteContact.email}
				</a>
				. We keep booking and payment records as long as the law requires.
			</p>
		),
	},
];

function PartTitle({ id, title, text }: { id: string; title: string; text: string }) {
	return (
		<div id={id} className="flex scroll-mt-6 flex-col gap-2">
			<h2 className="text-[28px] leading-tight font-bold tracking-[-0.01em] sm:text-[38px]">{title}</h2>
			<p className="text-muted-foreground">{text}</p>
		</div>
	);
}

export default function Terms() {
	return (
		<div className="bg-background">
			<PageIntro
				crumb="Terms & privacy"
				badge="Legal"
				title="Terms of service & privacy"
				text="The rules for using Tourly, and how we look after the information you share with us — in plain language."
				updated={UPDATED}
			>
				<div className="flex flex-wrap gap-3">
					<a
						href="#terms"
						className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:border-primary"
					>
						Terms of service
					</a>
					<a
						href="#privacy"
						className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:border-primary"
					>
						Privacy policy
					</a>
				</div>
			</PageIntro>

			<section className={`${container} pt-12 sm:pt-16 flex flex-col gap-8`}>
				<PartTitle id="terms" title="Terms of Service" text="What you agree to when you use Tourly." />
				<DocSections sections={terms} />
			</section>

			<section className={`${container} ${sectionTop} flex flex-col gap-8`}>
				<PartTitle id="privacy" title="Privacy Policy" text="What we collect, why, and who sees it." />
				<DocSections sections={privacy} />
			</section>

			<section className={`${container} ${sectionTop} pb-10 sm:pb-25`}>
				<ContactCard title="Questions about these terms?" className="mx-auto max-w-140" />
			</section>
		</div>
	);
}
