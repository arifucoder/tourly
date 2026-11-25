import heroImage from "@/assets/images/auth/inani-beach.jpeg";
import { BadgeCheck, ShieldCheck, Tag } from "lucide-react";
import { container, sectionTop } from "./shared";

const reasons = [
	{
		icon: BadgeCheck,
		title: "Verified local guides",
		text: "Every guide applies, is reviewed by our team and approved before leading a group.",
	},
	{
		icon: ShieldCheck,
		title: "Secure online payment",
		text: "Pay in taka by card or mobile banking through SSLCommerz — every booking gets a PDF invoice.",
	},
	{
		icon: Tag,
		title: "All-in pricing, small groups",
		text: "Clear per-person prices with what's included listed up front, and every departure has a guest limit.",
	},
];

export default function WhyChooseUs({ image }: { image?: string }) {
	return (
		<section className={`${container} ${sectionTop}`}>
			<div className="flex flex-col items-stretch gap-10 lg:flex-row lg:items-center lg:gap-18">
				<div className="h-72 min-w-0 shrink-0 overflow-hidden lg:flex-1 rounded-[26px] sm:h-110 sm:rounded-[44px]">
					<img src={image ?? heroImage} alt="" loading="lazy" className="size-full object-cover" />
				</div>
				<div className="flex flex-col gap-6.5 lg:flex-1">
					<div className="flex flex-col gap-3">
						<h2 className="text-[28px] leading-tight font-bold tracking-[-0.01em] sm:text-[38px]">Why Choose Us?</h2>
						<p className="text-muted-foreground">We plan the trip end to end, so you only pack and show up.</p>
					</div>
					<ul className="flex flex-col gap-6.5">
						{reasons.map(({ icon: Icon, title, text }) => (
							<li key={title} className="flex gap-4">
								<span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-accent text-primary-hover">
									<Icon className="size-5.5" strokeWidth={2} />
								</span>
								<div>
									<strong className="text-[15px] font-semibold">{title}</strong>
									<p className="text-[13px] text-muted-foreground">{text}</p>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}
