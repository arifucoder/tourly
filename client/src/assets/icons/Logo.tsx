import tourlyMark from "@/assets/brand/tourly-mark.svg";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

const BRAND_NAME = "tourly";

type LogoProps = {
	className?: string;
	to?: string;
	size?: "default" | "sm";
};

export function LogoMark({ className }: { className?: string }) {
	return (
		<img
			src={tourlyMark}
			alt=""
			aria-hidden="true"
			width={34}
			height={34}
			className={cn("size-8.5 shrink-0", className)}
		/>
	);
}

export function LogoText({ className }: { className?: string }) {
	return (
		<span className={cn("text-[21px] font-bold leading-none tracking-[-0.01em]", className)}>
			{BRAND_NAME}
			<span className="text-primary">.</span>
		</span>
	);
}

export default function Logo({ className, to = "/", size = "default" }: LogoProps) {
	const small = size === "sm";

	return (
		<Link
			to={to}
			aria-label="Tourly home"
			className={cn("flex items-center gap-2.5 text-foreground no-underline", className)}
		>
			<LogoMark className={small ? "size-7.5" : undefined} />
			<LogoText className={small ? "text-[19px]" : undefined} />
		</Link>
	);
}
