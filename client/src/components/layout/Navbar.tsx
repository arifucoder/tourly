import Logo from "@/assets/icons/Logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { role } from "@/constants/role";
import { cn } from "@/lib/utils";
import { authApi, useLogoutMutation, useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { useAppDispatch } from "@/redux/hook";
import { LogOut, Menu } from "lucide-react";
import { Link, NavLink } from "react-router";
import { ModeToggle } from "./ModeToggler";

type NavItem = { href: string; label: string; roles?: string[] };

const navLinks: NavItem[] = [
	{ href: "/", label: "Home" },
	{ href: "/tours", label: "Tours" },
	{ href: "/about", label: "About" },
	{ href: "/admin", label: "Dashboard", roles: [role.admin, role.superAdmin] },
	{ href: "/guide", label: "Dashboard", roles: [role.guide] },
	{ href: "/user", label: "Dashboard", roles: [role.user] },
];

const desktopLink =
	"relative py-1.5 text-[14.5px] font-medium text-foreground transition-colors hover:text-primary-text after:absolute after:-bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary after:opacity-0 aria-[current=page]:after:opacity-100";

const mobileLink =
	"rounded-lg px-3 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground";

const textLink = "px-2.5 py-1.5 text-[14.5px] font-medium text-foreground transition-colors hover:text-primary-text";

const primaryBtn =
	"inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover";

const outlineBtn =
	"inline-flex h-11 items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary px-6 text-sm font-semibold text-primary-text transition-colors hover:bg-accent";

const circleBtn =
	"inline-flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted";

export default function Navbar() {
	const { data } = useUserInfoQuery(undefined);
	const [logout] = useLogoutMutation();
	const dispatch = useAppDispatch();

	const userRole = data?.data?.role;
	const isLoggedIn = Boolean(data?.data?.email);
	const links = navLinks.filter((link) => !link.roles || (userRole && link.roles.includes(userRole)));

	const handleLogout = async () => {
		try {
			await logout(undefined).unwrap();
		} finally {
			dispatch(authApi.util.resetApiState());
		}
	};

	return (
		<header className="w-full bg-background">
			<div className="mx-auto flex h-21 max-w-300 items-center justify-between gap-6 px-4 sm:px-10">
				<Logo />

				<nav aria-label="Main" className="hidden items-center gap-8.5 lg:flex">
					{links.map((link) => (
						<NavLink key={link.href} to={link.href} end={link.href === "/"} className={desktopLink}>
							{link.label}
						</NavLink>
					))}
				</nav>

				<div className="flex items-center gap-3.5">
					{isLoggedIn ? (
						<button type="button" onClick={handleLogout} className={cn(textLink, "hidden items-center gap-2 sm:inline-flex")}>
							<LogOut className="size-4" />
							Log out
						</button>
					) : (
						<>
							<Link to="/login" className={cn(textLink, "hidden sm:inline-block")}>
								Log in
							</Link>
							<Link to="/signup" className={cn(primaryBtn, "hidden sm:inline-flex")}>
								Sign up
							</Link>
						</>
					)}

					<ModeToggle className={circleBtn} />

					<Sheet>
						<SheetTrigger aria-label="Open menu" className={cn(circleBtn, "lg:hidden")}>
							<Menu className="size-5.5" />
						</SheetTrigger>
						<SheetContent side="right" className="w-75 bg-background">
							<SheetHeader>
								<SheetTitle className="text-left">
									<Logo />
								</SheetTitle>
							</SheetHeader>
							<nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
								{links.map((link) => (
									<NavLink key={link.href} to={link.href} end={link.href === "/"} className={mobileLink}>
										{link.label}
									</NavLink>
								))}
							</nav>
							<div className="mt-4 flex flex-col gap-3 px-4 sm:hidden">
								{isLoggedIn ? (
									<button type="button" onClick={handleLogout} className={outlineBtn}>
										<LogOut className="size-4" />
										Log out
									</button>
								) : (
									<>
										<Link to="/login" className={outlineBtn}>
											Log in
										</Link>
										<Link to="/signup" className={primaryBtn}>
											Sign up
										</Link>
									</>
								)}
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
