import Logo from "@/assets/icons/Logo";
import { siteContact } from "@/constants/site";
import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router";

const currentYear = new Date().getFullYear();

const footerSections = [
	{
		title: "Explore",
		links: [
			{ label: "All tours", href: "/tours" },
			{ label: "Divisions", href: "/#divisions" },
		],
	},
	{
		title: "Company",
		links: [
			{ label: "About us", href: "/about" },
			{ label: "Become a guide", href: "/user/become-a-guide" },
		],
	},
	{
		title: "Support",
		links: [
			{ label: "Help centre", href: "/help" },
			{ label: "Cancellation policy", href: "/cancellation-policy" },
			{ label: "Terms & privacy", href: "/terms" },
		],
	},
];

const contactLinks = [
	{ label: "Email us", href: `mailto:${siteContact.email}`, Icon: Mail },
	{ label: "Call us", href: `tel:${siteContact.phone}`, Icon: Phone },
	{ label: "Find our office", href: siteContact.mapUrl, Icon: MapPin, external: true },
];

const linkClass = "text-[13.5px] text-muted-foreground transition-colors hover:text-primary-text";

export default function Footer() {
	return (
		<footer className="w-full bg-background pt-20 pb-7">
			<div className="mx-auto flex max-w-300 flex-col gap-11 px-4 sm:px-10">
				<div className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-8">
					{footerSections.map((section) => (
						<nav key={section.title} aria-label={section.title} className="flex flex-col gap-3">
							<strong className="text-[15px] font-semibold text-foreground">{section.title}</strong>
							{section.links.map((link) => (
								<Link key={link.label} to={link.href} className={linkClass}>
									{link.label}
								</Link>
							))}
						</nav>
					))}

					<div className="flex flex-col gap-3">
						<strong className="text-[15px] font-semibold text-foreground">Get in Touch</strong>
						<span className="text-[13.5px] text-muted-foreground">Questions about a trip? We reply within a day.</span>
						<a
							href={`mailto:${siteContact.email}`}
							className="text-[15px] font-semibold text-cyan-text transition-opacity hover:opacity-80"
						>
							{siteContact.email}
						</a>
					</div>
				</div>

				<div className="flex flex-col items-center justify-between gap-4.5 border-t border-border pt-6 sm:flex-row">
					<Logo size="sm" />
					<span className="text-center text-[13px] text-muted-foreground">
						© {currentYear} Tourly. All rights reserved.
					</span>
					<div className="flex gap-2.5">
						{contactLinks.map(({ label, href, Icon, external }) => (
							<a
								key={label}
								href={href}
								aria-label={label}
								{...(external && { target: "_blank", rel: "noreferrer" })}
								className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary-text"
							>
								<Icon className="size-4" />
							</a>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
