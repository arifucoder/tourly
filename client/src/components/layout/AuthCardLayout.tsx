import Logo from "@/assets/icons/Logo";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { ModeToggle } from "./ModeToggler";

type AuthCardLayoutProps = {
	children: ReactNode;
	centered?: boolean;
};

export default function AuthCardLayout({ children, centered }: AuthCardLayoutProps) {
	return (
		<div className="flex min-h-screen flex-col bg-background px-4 py-6 sm:px-8 sm:py-10">
			<div className="mx-auto flex w-full max-w-310 items-center justify-between">
				<Logo />
				<ModeToggle className="size-11 rounded-[10px] bg-card" />
			</div>
			<div className="flex flex-1 items-center justify-center py-10">
				<div
					className={cn(
						"flex w-full max-w-100 flex-col gap-4.5 rounded-[14px] border border-border bg-card px-7 py-8 shadow-soft",
						centered && "items-center text-center",
					)}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
