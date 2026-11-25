import { container } from "@/components/modules/Home/shared";
import { siteContact } from "@/constants/site";
import { cn } from "@/lib/utils";
import { Mail, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

const contacts = [
	{ icon: Mail, label: "Email", value: siteContact.email, href: `mailto:${siteContact.email}` },
	{ icon: Phone, label: "Phone", value: siteContact.phoneLabel, href: `tel:${siteContact.phone}` },
	{ icon: MapPin, label: "Office", value: "Dhaka, Bangladesh", href: siteContact.mapUrl, external: true },
];

export function PageIntro({
	crumb,
	badge,
	title,
	text,
	updated,
	children,
}: {
	crumb: string;
	badge: string;
	title: string;
	text: string;
	updated?: string;
	children?: ReactNode;
}) {
	return (
		<section className="bg-soft">
			<div className={`${container} flex flex-col gap-5 pt-6 pb-12 sm:pt-10 sm:pb-16`}>
				<nav aria-label="Breadcrumb" className="flex gap-2 text-[13.5px] text-muted-foreground">
					<Link to="/" className="hover:text-foreground">
						Home
					</Link>
					<span aria-hidden="true">/</span>
					<span className="font-medium text-primary-text">{crumb}</span>
				</nav>
				<span className="w-fit rounded-full bg-accent px-3 py-1.25 text-[12.5px] font-semibold text-accent-foreground">
					{badge}
				</span>
				<h1 className="max-w-180 text-[34px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[48px]">{title}</h1>
				<p className="max-w-150 text-muted-foreground">{text}</p>
				{updated && <p className="text-[13px] text-muted-foreground">Last updated: {updated}</p>}
				{children}
			</div>
		</section>
	);
}

export function ContactCard({ title = "Get in touch", className }: { title?: string; className?: string }) {
	return (
		<div className={cn("flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-card sm:p-8", className)}>
			<div className="flex flex-col gap-1.5">
				<h2 className="text-[22px] font-bold">{title}</h2>
				<p className="text-[13.5px] text-muted-foreground">Questions about a trip? We reply within a day.</p>
			</div>
			<ul className="flex flex-col gap-3">
				{contacts.map(({ icon: Icon, label, value, href, external }) => (
					<li key={label}>
						<a
							href={href}
							{...(external && { target: "_blank", rel: "noreferrer" })}
							className="group flex items-center gap-3.5 rounded-xl border border-border p-3.5 transition-colors hover:border-primary"
						>
							<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary-hover">
								<Icon className="size-4.5" />
							</span>
							<span className="min-w-0 leading-tight">
								<span className="block text-[12px] text-muted-foreground">{label}</span>
								<span className="block truncate text-[14.5px] font-semibold group-hover:text-primary-text">
									{value}
								</span>
							</span>
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}

export type TDocSection = { id: string; title: string; body: ReactNode };

export function DocSections({ sections, aside }: { sections: TDocSection[]; aside?: ReactNode }) {
	return (
		<div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
			<nav
				aria-label="On this page"
				className="hidden flex-col gap-1 rounded-xl bg-card p-4 shadow-card lg:sticky lg:top-6 lg:flex"
			>
				<strong className="px-2 pb-1 text-[13px] font-semibold text-muted-foreground">On this page</strong>
				{sections.map((section) => (
					<a
						key={section.id}
						href={`#${section.id}`}
						className="rounded-md px-2 py-1.5 text-[13.5px] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
					>
						{section.title}
					</a>
				))}
				{aside}
			</nav>
			<div className="flex flex-col gap-5">
				{sections.map((section, i) => (
					<section
						key={section.id}
						id={section.id}
						aria-labelledby={`${section.id}-h`}
						className="scroll-mt-6 rounded-xl bg-card p-6 shadow-card sm:p-8"
					>
						<h2 id={`${section.id}-h`} className="mb-3 flex items-baseline gap-3 text-[20px] font-bold">
							<span className="text-[15px] font-semibold text-primary-text tabular-nums">
								{String(i + 1).padStart(2, "0")}
							</span>
							{section.title}
						</h2>
						<div className="flex flex-col gap-3 text-[14.5px] text-muted-foreground [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
							{section.body}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}
