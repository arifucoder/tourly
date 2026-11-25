import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tones = {
	primary: "bg-accent text-primary-text",
	success: "bg-success-soft text-success",
	warning: "bg-warning-soft text-warning",
	danger: "bg-destructive-soft text-destructive",
};

type IconBubbleProps = { tone: keyof typeof tones; size?: "md" | "lg"; children: ReactNode };

export default function IconBubble({ tone, size = "md", children }: IconBubbleProps) {
	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center",
				size === "lg" ? "size-20 rounded-3xl [&_svg]:size-9.5" : "size-16 rounded-[18px] [&_svg]:size-7.5",
				tones[tone],
			)}
		>
			{children}
		</div>
	);
}
