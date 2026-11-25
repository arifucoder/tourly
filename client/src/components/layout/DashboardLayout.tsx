import { LogoMark, LogoText } from "@/assets/icons/Logo";
import { roleLabel } from "@/components/dashboard/status";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { role } from "@/constants/role";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { authApi, useLogoutMutation, useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { useAppDispatch } from "@/redux/hook";
import type { TRole } from "@/types";
import { getSidebarItems } from "@/utils/getSidebarItems";
import { ChevronDown, ExternalLink, LogOut } from "lucide-react";
import { Suspense } from "react";
import { Link, matchPath, NavLink, Outlet, useLocation } from "react-router";
import { ModeToggle } from "./ModeToggler";

const consoleLabel = (userRole?: TRole) => {
	if (userRole === role.admin || userRole === role.superAdmin) return { crumb: "Admin", label: "Admin console" };
	if (userRole === role.guide) return { crumb: "Guide", label: "Guide console" };
	return { crumb: "Account", label: "My account" };
};

const isActive = (pathname: string, url: string, rootUrl: string) =>
	url === rootUrl ? pathname === url : pathname === url || pathname.startsWith(`${url}/`);

function Avatar({ name, picture, className }: { name?: string; picture?: string; className?: string }) {
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

function PageFallback() {
	return (
		<div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading page">
			<Skeleton className="h-8 w-48" />
			<div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-24 rounded-xl" />
				))}
			</div>
			<Skeleton className="h-72 rounded-xl" />
		</div>
	);
}

export default function DashboardLayout() {
	const { pathname } = useLocation();
	const { data } = useUserInfoQuery(undefined);
	const [logout] = useLogoutMutation();
	const dispatch = useAppDispatch();

	const user = data?.data as { name?: string; email?: string; picture?: string; role?: TRole } | undefined;
	const sections = getSidebarItems(user?.role as TRole);
	const allItems = sections.flatMap((section) => section.items);
	const visibleItems = allItems.filter((item) => !item.hidden);
	const rootUrl = visibleItems[0]?.url ?? "/";
	const current = allItems.find((item) => matchPath({ path: item.url, end: true }, pathname));
	const pageTitle = current?.title ?? "Page not found";
	const { crumb, label } = consoleLabel(user?.role);

	const handleLogout = async () => {
		try {
			await logout(undefined).unwrap();
		} finally {
			dispatch(authApi.util.resetApiState());
		}
	};

	return (
		<div className="flex min-h-svh bg-page text-foreground">
			<aside
				aria-label={`${label} navigation`}
				className="sticky top-0 hidden h-svh w-62 shrink-0 flex-col overflow-y-auto border-r border-border bg-card px-3.5 pt-4 pb-3.5 min-[900px]:flex"
			>
				<Link
					to={rootUrl}
					className="-mx-3.5 mb-1 flex items-center gap-2.5 border-b border-border pr-2 pb-3.5 pl-5.5 text-foreground"
				>
					<LogoMark />
					<span className="flex flex-col gap-1 leading-none">
						<LogoText className="text-[19px]" />
						<span className="text-[10.5px] font-semibold tracking-widest text-muted-foreground uppercase">
							{label}
						</span>
					</span>
				</Link>

				<nav className="flex flex-col">
					{sections.map((section) => {
						const items = section.items.filter((item) => !item.hidden);
						if (items.length === 0) return null;
						return (
							<div key={section.title} className="flex flex-col gap-0.5">
								<span className="px-3 pt-4.5 pb-2 text-[11px] font-semibold tracking-[0.09em] text-muted-foreground uppercase">
									{section.title}
								</span>
								{items.map((item) => {
									const active = isActive(pathname, item.url, rootUrl);
									const Icon = item.icon;
									return (
										<Link
											key={item.url}
											to={item.url}
											aria-current={active ? "page" : undefined}
											className={cn(
												"relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-[14.5px] font-medium text-foreground transition-colors hover:bg-surface-2",
												active &&
													"bg-accent font-semibold text-accent-foreground before:absolute before:top-2 before:bottom-2 before:-left-3.5 before:w-0.75 before:rounded-r-sm before:bg-primary hover:bg-accent",
											)}
										>
											{Icon && (
												<Icon
													aria-hidden="true"
													className={cn("size-4.5 shrink-0", active ? "text-accent-foreground" : "text-muted-foreground")}
													strokeWidth={1.9}
												/>
											)}
											{item.title}
										</Link>
									);
								})}
							</div>
						);
					})}

					<span className="px-3 pt-4.5 pb-2 text-[11px] font-semibold tracking-[0.09em] text-muted-foreground uppercase">
						Site
					</span>
					<Link
						to="/"
						className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-[14.5px] font-medium text-foreground transition-colors hover:bg-surface-2"
					>
						<ExternalLink aria-hidden="true" className="size-4.5 text-muted-foreground" strokeWidth={1.9} />
						View public site
					</Link>
				</nav>

				<div className="mt-auto flex items-center gap-2.5 rounded-[10px] border border-border p-2.5">
					<Avatar name={user?.name} picture={user?.picture} />
					<span className="min-w-0 flex-1 leading-snug">
						<strong className="block truncate text-sm font-semibold">{user?.name ?? "…"}</strong>
						<span className="text-[12.5px] text-muted-foreground">{user?.role ? roleLabel[user.role] : ""}</span>
					</span>
					<button
						type="button"
						onClick={handleLogout}
						aria-label="Log out"
						className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
					>
						<LogOut className="size-4.25" />
					</button>
				</div>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex h-16 items-center justify-between gap-3.5 border-b border-border bg-card px-4 min-[900px]:px-7">
					<div className="min-w-0 leading-snug">
						<span className="block text-[12.5px] text-muted-foreground">
							{crumb} / {pageTitle}
						</span>
						<strong className="block truncate text-[17px] font-semibold">{pageTitle}</strong>
					</div>

					<div className="flex items-center gap-2">
						<ModeToggle className="size-10 rounded-[10px] bg-card" />
						<DropdownMenu>
							<DropdownMenuTrigger
								aria-label="Account menu"
								className="flex min-h-11 items-center gap-1.5 rounded-lg text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
							>
								<Avatar name={user?.name} picture={user?.picture} />
								<ChevronDown className="size-4" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel className="flex flex-col">
									<span className="truncate font-semibold">{user?.name}</span>
									<span className="truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link to="/">
										<ExternalLink />
										View public site
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleLogout} variant="destructive">
									<LogOut />
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				<nav
					aria-label={`${label} sections`}
					className="flex gap-1.5 overflow-x-auto border-b border-border bg-card px-4 py-2.5 min-[900px]:hidden"
				>
					{visibleItems.map((item) => (
						<NavLink
							key={item.url}
							to={item.url}
							end={item.url === rootUrl}
							className={({ isActive: active }) =>
								cn(
									"inline-flex min-h-9 shrink-0 items-center rounded-full border border-border px-3.5 text-[13.5px] font-medium text-muted-foreground",
									(active || isActive(pathname, item.url, rootUrl)) &&
										"border-transparent bg-accent font-semibold text-accent-foreground",
								)
							}
						>
							{item.title}
						</NavLink>
					))}
				</nav>

				<main className="flex flex-1 flex-col gap-6 px-4 pt-5 pb-12 sm:px-8 sm:pt-7">
					<Suspense fallback={<PageFallback />}>
						<Outlet />
					</Suspense>
				</main>
			</div>
		</div>
	);
}
