import Logo from "@/assets/icons/Logo";
import type { ReactNode } from "react";

export default function AuthFormShell({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col px-4 py-8 sm:px-6">
			<div className="lg:hidden">
				<Logo />
			</div>
			<div className="flex flex-1 items-center justify-center py-8">{children}</div>
		</div>
	);
}
