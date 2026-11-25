import PageHeader from "@/components/dashboard/PageHeader";
import { AccountStatusBadge, RoleBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/dashboard/States";
import { roleLabel } from "@/components/dashboard/status";
import {
	btnDangerGhost,
	btnGhost,
	btnPrimary,
	btnSm,
	dashCard,
	dashInput,
	help,
	label,
	td,
	th,
} from "@/components/dashboard/styles";
import { Pagination, SearchField, SelectField } from "@/components/dashboard/TableControls";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { role } from "@/constants/role";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate, formatNumber, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { useGetUsersQuery, useUpdateUserMutation } from "@/redux/features/User/user.api";
import type { IUser, TApiError, TRole, TUserStatus } from "@/types";
import { BadgeCheck, Ban, Lock, ShieldCheck, UserRoundSearch, Users as UsersIcon, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LIMIT = 10;
const COLS = 6;
const cell = "px-3.5";

const ROLE_FILTERS = [
	{ value: "", label: "All roles" },
	{ value: role.user, label: "User" },
	{ value: role.guide, label: "Guide" },
	{ value: role.admin, label: "Admin" },
	{ value: role.superAdmin, label: "Super Admin" },
];

const STATUS_FILTERS = [
	{ value: "", label: "All statuses" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "BLOCKED", label: "Blocked" },
	{ value: "UNVERIFIED", label: "Unverified" },
];

const statusParams = (status: string): { isActive?: TUserStatus; isVerified?: boolean } => {
	if (status === "UNVERIFIED") return { isVerified: false };
	if (status === "ACTIVE" || status === "BLOCKED") return { isActive: status };
	return {};
};

const signInLabel = (methods?: string[]) => {
	if (!methods?.length) return "—";
	return methods.map((method) => (method === "google" ? "Google" : "Email & password")).join(", ");
};

function UserAvatar({ user, size = "sm" }: { user: Pick<IUser, "name" | "picture">; size?: "sm" | "lg" }) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-semibold text-accent-foreground",
				size === "lg" ? "size-13 text-[17px]" : "size-9 text-[13px]",
			)}
		>
			{user.picture ? <img src={user.picture} alt="" className="size-full object-cover" /> : initials(user.name)}
		</span>
	);
}

function UserPanel({
	user,
	viewer,
	onClose,
	onBlockToggle,
}: {
	user: IUser;
	viewer: { _id?: string; role?: TRole };
	onClose: () => void;
	onBlockToggle: (user: IUser) => void;
}) {
	const [nextRole, setNextRole] = useState<TRole>(user.role);
	const [updateUser, { isLoading }] = useUpdateUserMutation();

	const isSelf = viewer._id === user._id;
	const isSuperViewer = viewer.role === role.superAdmin;
	const locked = isSelf || (user.role === role.superAdmin && !isSuperViewer);
	const isBlocked = user.isActive === "BLOCKED";

	const roleOptions: TRole[] = isSuperViewer
		? [role.user, role.guide, role.admin, role.superAdmin]
		: [role.user, role.guide, role.admin];

	const saveRole = async () => {
		const toastId = toast.loading("Saving role…");
		try {
			await updateUser({ id: user._id, role: nextRole }).unwrap();
			toast.success(`${user.name} is now ${roleLabel[nextRole]}`, { id: toastId });
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't change role", { id: toastId });
		}
	};

	const rows: [string, React.ReactNode][] = [
		["Status", <AccountStatusBadge key="s" user={user} />],
		["Phone", user.phone || "—"],
		["Address", user.address || "—"],
		["Sign-in", signInLabel(user.signInMethods)],
		["Joined", formatDate(user.createdAt)],
		["Bookings", formatNumber(user.bookingsCount)],
	];

	return (
		<>
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<UserAvatar user={user} size="lg" />
					<div className="min-w-0">
						<h2 className="truncate text-lg font-bold">{user.name}</h2>
						<p className="truncate text-[13.5px] text-muted-foreground">{user.email}</p>
					</div>
				</div>
				<button
					type="button"
					aria-label="Close details"
					onClick={onClose}
					className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-surface-2"
				>
					<X className="size-4.5" />
				</button>
			</div>

			<dl>
				{rows.map(([key, value], i) => (
					<div
						key={key}
						className={cn(
							"flex justify-between gap-3 border-b border-border py-2.5 text-[14.5px]",
							i === rows.length - 1 && "border-0",
						)}
					>
						<dt className="text-muted-foreground">{key}</dt>
						<dd className="min-w-0 text-right font-semibold break-words">{value}</dd>
					</div>
				))}
			</dl>

			{user.role === role.guide && user.guideInfo && (
				<div className="flex items-start gap-3 rounded-[10px] border border-border bg-surface-2 px-3.5 py-3">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
						{user.guideInfo.via === "GUIDE_APPLICATION" ? <BadgeCheck className="size-4" /> : <ShieldCheck className="size-4" />}
					</span>
					<div className="min-w-0 text-[13.5px] leading-snug">
						<strong className="block text-[14px]">
							{user.guideInfo.via === "GUIDE_APPLICATION" ? "Guide application approved" : "Made a guide by an admin"}
						</strong>
						{(user.guideInfo.by || user.guideInfo.at) && (
							<span className="text-muted-foreground">
								{[
									user.guideInfo.by && `by ${user.guideInfo.by}`,
									user.guideInfo.at && `on ${formatDate(user.guideInfo.at)}`,
								]
									.filter(Boolean)
									.join(" ")}
							</span>
						)}
						<span className="mt-0.5 block text-muted-foreground">
							{user.guideInfo.divisions.length
								? `Approved for ${user.guideInfo.divisions.join(", ")}`
								: "No approved guide application"}
						</span>
					</div>
				</div>
			)}

			{locked ? (
				<p className="flex items-start gap-2 rounded-[10px] bg-surface-2 px-3.5 py-3 text-[13.5px] text-muted-foreground">
					<Lock className="mt-0.5 size-4 shrink-0" />
					{isSelf ? "You can't change your own role or status." : "Only a Super Admin can edit a Super Admin."}
				</p>
			) : (
				<>
					<div>
						<label className={label} htmlFor="u-role">
							Role
						</label>
						<select
							id="u-role"
							className={cn(dashInput, "cursor-pointer")}
							value={nextRole}
							onChange={(event) => setNextRole(event.target.value as TRole)}
						>
							{roleOptions.map((option) => (
								<option key={option} value={option}>
									{roleLabel[option]}
								</option>
							))}
						</select>
						{!isSuperViewer && <p className={help}>Only a Super Admin can grant Super Admin.</p>}
					</div>
					<div className="flex gap-2.5">
						<button
							type="button"
							className={cn(isBlocked ? btnGhost : btnDangerGhost, "flex-1")}
							onClick={() => onBlockToggle(user)}
						>
							{isBlocked ? "Unblock user" : "Block user"}
						</button>
						<button
							type="button"
							className={cn(btnPrimary, "flex-1")}
							disabled={isLoading || nextRole === user.role}
							onClick={saveRole}
						>
							Save role
						</button>
					</div>
				</>
			)}
		</>
	);
}

export default function Users() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [blockTarget, setBlockTarget] = useState<IUser | null>(null);

	const searchTerm = useDebouncedValue(search.trim());

	const { data: me } = useUserInfoQuery(undefined);
	const viewer = (me?.data ?? {}) as { _id?: string; role?: TRole };

	const { data, isLoading, isError, isFetching, refetch } = useGetUsersQuery({
		page,
		limit: LIMIT,
		sort: "-createdAt",
		...(searchTerm && { searchTerm }),
		...(roleFilter && { role: roleFilter as TRole }),
		...statusParams(statusFilter),
	});
	const [updateUser] = useUpdateUserMutation();

	const users = data?.data ?? [];
	const meta = data?.meta;
	const selected = users.find((user) => user._id === selectedId) ?? null;

	const selectUser = (id: string) => setSelectedId(id);

	const setStatus = async (user: IUser, isActive: TUserStatus) => {
		const toastId = toast.loading(isActive === "BLOCKED" ? "Blocking…" : "Unblocking…");
		try {
			await updateUser({ id: user._id, isActive }).unwrap();
			toast.success(isActive === "BLOCKED" ? `${user.name} is blocked` : `${user.name} is unblocked`, { id: toastId });
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't update status", { id: toastId });
		}
	};

	const onBlockToggle = (user: IUser) => {
		if (user.isActive === "BLOCKED") setStatus(user, "ACTIVE");
		else setBlockTarget(user);
	};

	const hasFilters = Boolean(searchTerm || roleFilter || statusFilter);
	const viewerRole = viewer.role ? roleLabel[viewer.role] : "";

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title="Users"
				description={`${meta ? `${formatNumber(meta.total)} accounts` : "Loading…"}${viewerRole ? ` · you're signed in as ${viewerRole === "Admin" ? "an" : "a"} ${viewerRole}` : ""}`}
			/>

			<section className={cn(dashCard, "overflow-hidden")}>
					<div className="flex flex-wrap gap-3 border-b border-border p-4">
						<SearchField
							id="u-q"
							label="Search users"
							placeholder="Search name, email or phone"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
						<SelectField
							label="Role"
							options={ROLE_FILTERS}
							value={roleFilter}
							onChange={(event) => {
								setRoleFilter(event.target.value);
								setPage(1);
							}}
						/>
						<SelectField
							label="Status"
							options={STATUS_FILTERS}
							value={statusFilter}
							onChange={(event) => {
								setStatusFilter(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="relative overflow-x-auto">
						<table className="w-full min-w-170 border-collapse text-sm">
							<thead>
								<tr className="border-b border-border">
									<th scope="col" className={cn(th, cell)}>
										User
									</th>
									<th scope="col" className={cn(th, cell)}>
										Role
									</th>
									<th scope="col" className={cn(th, cell)}>
										Status
									</th>
									<th scope="col" className={cn(th, cell)}>
										Joined
									</th>
									<th scope="col" className={cn(th, cell, "text-right")}>
										Bookings
									</th>
									<th scope="col" className={cn(th, cell, "text-right")}>
										Actions
									</th>
								</tr>
							</thead>
							<tbody className={cn(isFetching && !isLoading && "opacity-60 transition-opacity")}>
								{isLoading && <TableSkeleton cols={COLS} rows={7} />}

								{isError && (
									<tr>
										<td colSpan={COLS}>
											<ErrorState title="Couldn't load users" onRetry={refetch} />
										</td>
									</tr>
								)}

								{!isLoading && !isError && users.length === 0 && (
									<tr>
										<td colSpan={COLS}>
											<EmptyState
												icon={hasFilters ? UserRoundSearch : UsersIcon}
												title={hasFilters ? "No users match these filters" : "No users yet"}
												description={
													hasFilters ? "Try another name, role or status." : "People who sign up will appear here."
												}
											/>
										</td>
									</tr>
								)}

								{users.map((user) => {
									const isSelf = viewer._id === user._id;
									const locked = isSelf || (user.role === role.superAdmin && viewer.role !== role.superAdmin);
									const blocked = user.isActive === "BLOCKED";
									return (
										<tr
											key={user._id}
											className={cn("border-b border-border last:border-0", selectedId === user._id && "bg-accent")}
										>
											<td className={cn(td, cell)}>
												<div className="flex items-center gap-3">
													<UserAvatar user={user} />
													<div className="min-w-0">
														<div className="max-w-48 truncate font-semibold">
															{user.name}
															{isSelf && <span className="ml-1 font-normal text-muted-foreground">(you)</span>}
														</div>
														<div className="max-w-48 truncate text-[13px] text-muted-foreground">{user.email}</div>
													</div>
												</div>
											</td>
											<td className={cn(td, cell)}>
												<RoleBadge role={user.role} />
											</td>
											<td className={cn(td, cell)}>
												<AccountStatusBadge user={user} />
											</td>
											<td className={cn(td, cell, "whitespace-nowrap tabular-nums")}>
												{formatDate(user.createdAt, { month: "short", year: "numeric" })}
											</td>
											<td className={cn(td, cell, "text-right tabular-nums")}>{formatNumber(user.bookingsCount)}</td>
											<td className={cn(td, cell)}>
												<div className="flex items-center justify-end gap-1.5">
													<button type="button" className={cn(btnGhost, btnSm)} onClick={() => selectUser(user._id)}>
														View
													</button>
													{locked ? (
														<span
															className="inline-flex size-9 items-center justify-center text-muted-foreground"
															title={isSelf ? "You can't change your own account" : "Admins can't edit a Super Admin"}
														>
															<Lock className="size-4" />
															<span className="sr-only">Protected</span>
														</span>
													) : (
														<button
															type="button"
															className={cn(blocked ? btnPrimary : btnDangerGhost, btnSm)}
															onClick={() => onBlockToggle(user)}
														>
															{blocked ? "Unblock" : "Block"}
														</button>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{meta && meta.total > 0 && (
						<Pagination
							page={page}
							totalPage={meta.totalPage}
							total={meta.total}
							limit={LIMIT}
							noun="users"
							disabled={isFetching}
							onChange={setPage}
						/>
					)}
				</section>

			<Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
				<SheetContent showCloseButton={false} className="w-full gap-4 overflow-y-auto bg-card p-5.5 sm:max-w-md">
					<SheetTitle className="sr-only">User details</SheetTitle>
					<SheetDescription className="sr-only">User details and actions</SheetDescription>
					{selected && (
						<UserPanel
							key={`${selected._id}-${selected.role}`}
							user={selected}
							viewer={viewer}
							onClose={() => setSelectedId(null)}
							onBlockToggle={onBlockToggle}
						/>
					)}
				</SheetContent>
			</Sheet>

			<AlertDialog open={Boolean(blockTarget)} onOpenChange={(open) => !open && setBlockTarget(null)}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogMedia className="bg-destructive/10 text-destructive">
							<Ban />
						</AlertDialogMedia>
						<AlertDialogTitle>Block {blockTarget?.name}?</AlertDialogTitle>
						<AlertDialogDescription>
							They'll be logged out and can't log in or book. Their existing bookings stay as they are. You can unblock
							them any time.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => blockTarget && setStatus(blockTarget, "BLOCKED")}
						>
							Block user
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
