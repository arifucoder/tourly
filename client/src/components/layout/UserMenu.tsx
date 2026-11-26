import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { role } from "@/constants/role";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { authApi, useLogoutMutation } from "@/redux/features/auth/auth.api";
import { useAppDispatch } from "@/redux/hook";
import type { TRole } from "@/types";
import { ChevronDown, ExternalLink, LayoutDashboard, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router";

export type TMenuUser = { name?: string; email?: string; picture?: string; role?: TRole };

const accountBase = (userRole?: TRole) => {
	if (userRole === role.admin || userRole === role.superAdmin) return "/admin";
	if (userRole === role.guide) return "/guide";
	return "/user";
};

export function Avatar({ name, picture, className }: { name?: string; picture?: string; className?: string }) {
	return (
		<span
			className={cn(
				"flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-[13px] font-semibold text-accent-foreground",
				className,
			)}
		>
			{picture ? <img src={picture} alt="" className="size-full object-cover" /> : initials(name)}
		</span>
	);
}

export default function UserMenu({
	user,
	variant,
	avatarClassName,
}: {
	user?: TMenuUser;
	variant: "site" | "dashboard";
	avatarClassName?: string;
}) {
	const [logout] = useLogoutMutation();
	const dispatch = useAppDispatch();
	const base = accountBase(user?.role);

	const handleLogout = async () => {
		try {
			await logout(undefined).unwrap();
		} finally {
			dispatch(authApi.util.resetApiState());
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label="Account menu"
				className="flex min-h-11 items-center gap-1.5 rounded-full text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
			>
				<Avatar name={user?.name} picture={user?.picture} className={avatarClassName} />
				<ChevronDown className="size-4" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="flex flex-col">
					<span className="truncate font-semibold">{user?.name}</span>
					<span className="truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{variant === "site" && (
					<DropdownMenuItem asChild>
						<Link to={base}>
							<LayoutDashboard />
							Dashboard
						</Link>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem asChild>
					<Link to={`${base}/profile`}>
						<UserRound />
						Profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link to={`${base}/security`}>
						<ShieldCheck />
						Security
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{variant === "dashboard" && (
					<DropdownMenuItem asChild>
						<Link to="/">
							<ExternalLink />
							View public site
						</Link>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem onClick={handleLogout} variant="destructive">
					<LogOut />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
