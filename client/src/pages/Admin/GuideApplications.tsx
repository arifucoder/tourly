import PageHeader from "@/components/dashboard/PageHeader";
import { ApplicationStatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/dashboard/States";
import { btnDangerGhost, btnGhost, btnPrimary, btnSm, dashCard, dashInput, help, label, td, th } from "@/components/dashboard/styles";
import { Pagination, SearchField, SelectField } from "@/components/dashboard/TableControls";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate, formatNumber, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetDivisionsQuery } from "@/redux/features/Division/division.api";
import {
	useGetGuideApplicationsQuery,
	useGetGuideApplicationSummaryQuery,
	useReviewGuideApplicationMutation,
} from "@/redux/features/GuideApplication/guideApplication.api";
import type { IGuideApplication, TApiError, TApplicationStatus } from "@/types";
import { BadgeCheck, ClipboardList, SearchX, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

const LIMIT = 10;
const COLS = 7;
const cell = "px-3.5";

const TABS: { key: TApplicationStatus | "ALL"; label: string }[] = [
	{ key: "PENDING", label: "Pending" },
	{ key: "APPROVED", label: "Approved" },
	{ key: "REJECTED", label: "Rejected" },
	{ key: "ALL", label: "All" },
];

const isTab = (value: string | null): value is TApplicationStatus | "ALL" =>
	value === "PENDING" || value === "APPROVED" || value === "REJECTED" || value === "ALL";

function Applicant({ user, size = "sm" }: { user: IGuideApplication["user"]; size?: "sm" | "lg" }) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-info-soft font-semibold text-info",
				size === "lg" ? "size-13 text-[17px]" : "size-9 text-[13px]",
			)}
		>
			{user.picture ? <img src={user.picture} alt="" className="size-full object-cover" /> : initials(user.name)}
		</span>
	);
}

function ReviewPanel({ application, onClose }: { application: IGuideApplication; onClose: () => void }) {
	const [note, setNote] = useState("");
	const [review, { isLoading }] = useReviewGuideApplicationMutation();

	const submit = async (status: "APPROVED" | "REJECTED") => {
		const toastId = toast.loading(status === "APPROVED" ? "Approving…" : "Rejecting…");
		try {
			await review({ id: application._id, status, ...(note.trim() && { reviewNote: note.trim() }) }).unwrap();
			toast.success(
				status === "APPROVED"
					? `${application.user.name} is now a guide for ${application.division.name}`
					: "Application rejected",
				{ id: toastId, description: "The applicant gets an email with the result." },
			);
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't review this application", { id: toastId });
		}
	};

	const rows: [string, React.ReactNode][] = [
		["Status", <ApplicationStatusBadge key="s" status={application.status} />],
		["Division", application.division.name],
		["Experience", `${application.experienceYears} year${application.experienceYears === 1 ? "" : "s"}`],
		["Languages", application.languages.length ? application.languages.join(", ") : "—"],
		["Phone", application.user.phone || "—"],
		["Applied", formatDate(application.createdAt)],
	];

	return (
		<>
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<Applicant user={application.user} size="lg" />
					<div className="min-w-0">
						<h2 className="truncate text-lg font-bold">{application.user.name}</h2>
						<p className="truncate text-[13.5px] text-muted-foreground">{application.user.email}</p>
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

			<div>
				<span className={label}>Why they want to guide</span>
				<p className="rounded-[10px] bg-surface-2 px-3.5 py-3 text-[14px] leading-relaxed whitespace-pre-line">
					{application.message}
				</p>
			</div>

			{application.status === "PENDING" ? (
				<>
					<div>
						<label className={label} htmlFor="ga-note">
							Note to applicant <span className="font-normal text-muted-foreground">(optional)</span>
						</label>
						<textarea
							id="ga-note"
							rows={3}
							maxLength={500}
							value={note}
							onChange={(event) => setNote(event.target.value)}
							className={cn(dashInput, "h-auto py-2.5")}
							placeholder="Included in the result email"
						/>
						<p className={help}>Approving changes their role to Guide.</p>
					</div>
					<div className="flex gap-2.5">
						<button
							type="button"
							className={cn(btnDangerGhost, "flex-1")}
							disabled={isLoading}
							onClick={() => submit("REJECTED")}
						>
							Reject
						</button>
						<button
							type="button"
							className={cn(btnPrimary, "flex-1")}
							disabled={isLoading}
							onClick={() => submit("APPROVED")}
						>
							<BadgeCheck />
							Approve
						</button>
					</div>
				</>
			) : (
				<p className="rounded-[10px] bg-surface-2 px-3.5 py-3 text-[13.5px] text-muted-foreground">
					{application.status === "APPROVED" ? "Approved" : "Rejected"}
					{application.reviewedAt && ` on ${formatDate(application.reviewedAt)}`}
					{application.reviewedBy?.name && ` by ${application.reviewedBy.name}`}.
					{application.reviewNote && (
						<span className="mt-1.5 block text-foreground">“{application.reviewNote}”</span>
					)}
				</p>
			)}
		</>
	);
}

export default function GuideApplications() {
	const [searchParams, setSearchParams] = useSearchParams();
	const tabParam = searchParams.get("status");
	const tab = isTab(tabParam) ? tabParam : "PENDING";

	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [division, setDivision] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const searchTerm = useDebouncedValue(search.trim());

	const { data, isLoading, isError, isFetching, refetch } = useGetGuideApplicationsQuery({
		page,
		limit: LIMIT,
		...(tab !== "ALL" && { status: tab }),
		...(searchTerm && { searchTerm }),
		...(division && { division }),
	});
	const { data: counts } = useGetGuideApplicationSummaryQuery();
	const { data: divisions = [] } = useGetDivisionsQuery();

	const applications = data?.data ?? [];
	const meta = data?.meta;
	const selected = applications.find((application) => application._id === selectedId) ?? null;
	const hasFilters = Boolean(searchTerm || division);

	const pickTab = (key: TApplicationStatus | "ALL") => {
		setPage(1);
		setSearchParams(key === "PENDING" ? {} : { status: key }, { replace: true });
	};

	const select = (id: string) => setSelectedId(id);

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title="Guide applications"
				description="People who want to lead tours. Approving one makes them a Guide for that division."
			/>

			<div role="tablist" aria-label="Filter by status" className="-mb-0.5 flex gap-2 overflow-x-auto pb-0.5">
				{TABS.map((item) => {
					const on = item.key === tab;
					return (
						<button
							key={item.key}
							type="button"
							role="tab"
							aria-selected={on}
							onClick={() => pickTab(item.key)}
							className={cn(
								"inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
								on && "border-foreground bg-foreground text-background hover:text-background",
							)}
						>
							{item.label}
							{counts && <span className="font-medium opacity-80">{formatNumber(counts[item.key])}</span>}
						</button>
					);
				})}
			</div>

			<section className={cn(dashCard, "overflow-hidden")}>
					<div className="flex flex-wrap gap-3 border-b border-border p-4">
						<SearchField
							id="ga-q"
							label="Search applicants"
							placeholder="Search name, email or phone"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
						<SelectField
							label="Division"
							options={[
								{ value: "", label: "All divisions" },
								...divisions.map((item) => ({ value: item._id, label: item.name })),
							]}
							value={division}
							className="flex-[0_1_190px]"
							onChange={(event) => {
								setDivision(event.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="relative overflow-x-auto">
						<table className="w-full min-w-160 border-collapse text-sm">
							<thead>
								<tr className="border-b border-border">
									<th scope="col" className={cn(th, cell)}>
										Applicant
									</th>
									<th scope="col" className={cn(th, cell)}>
										Division
									</th>
									<th scope="col" className={cn(th, cell, "text-right")}>
										Experience
									</th>
									<th scope="col" className={cn(th, cell)}>
										Languages
									</th>
									<th scope="col" className={cn(th, cell)}>
										Applied
									</th>
									<th scope="col" className={cn(th, cell)}>
										Status
									</th>
									<th scope="col" className={cn(th, cell)}>
										<span className="sr-only">Actions</span>
									</th>
								</tr>
							</thead>
							<tbody className={cn(isFetching && !isLoading && "opacity-60 transition-opacity")}>
								{isLoading && <TableSkeleton cols={COLS} rows={6} />}

								{isError && (
									<tr>
										<td colSpan={COLS}>
											<ErrorState title="Couldn't load applications" onRetry={refetch} />
										</td>
									</tr>
								)}

								{!isLoading && !isError && applications.length === 0 && (
									<tr>
										<td colSpan={COLS}>
											<EmptyState
												icon={hasFilters ? SearchX : ClipboardList}
												title={
													hasFilters
														? "No applications match these filters"
														: tab === "PENDING"
															? "No applications waiting"
															: "No applications here"
												}
												description={
													hasFilters
														? "Try another name or division."
														: "When a traveller applies to become a guide it shows up here for review."
												}
											/>
										</td>
									</tr>
								)}

								{applications.map((application) => (
									<tr
										key={application._id}
										className={cn("border-b border-border last:border-0", selectedId === application._id && "bg-accent")}
									>
										<td className={cn(td, cell)}>
											<div className="flex items-center gap-3">
												<Applicant user={application.user} />
												<div className="min-w-0">
													<div className="max-w-44 truncate font-semibold">{application.user.name}</div>
													<div className="max-w-44 truncate text-[13px] text-muted-foreground">
														{application.user.email}
													</div>
												</div>
											</div>
										</td>
										<td className={cn(td, cell)}>{application.division.name}</td>
										<td className={cn(td, cell, "text-right tabular-nums")}>{application.experienceYears} yr{application.experienceYears === 1 ? "" : "s"}</td>
										<td className={cn(td, cell, "max-w-44 truncate text-muted-foreground")}>
											{application.languages.join(", ") || "—"}
										</td>
										<td className={cn(td, cell, "whitespace-nowrap tabular-nums")}>{formatDate(application.createdAt)}</td>
										<td className={cn(td, cell)}>
											<ApplicationStatusBadge status={application.status} />
										</td>
										<td className={cn(td, cell, "text-right")}>
											<button type="button" className={cn(btnGhost, btnSm)} onClick={() => select(application._id)}>
												{application.status === "PENDING" ? "Review" : "View"}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{meta && meta.total > 0 && (
						<Pagination
							page={page}
							totalPage={meta.totalPage}
							total={meta.total}
							limit={LIMIT}
							noun="applications"
							disabled={isFetching}
							onChange={setPage}
						/>
					)}
				</section>

			<Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
				<SheetContent showCloseButton={false} className="w-full gap-4 overflow-y-auto bg-card p-5.5 sm:max-w-md">
					<SheetTitle className="sr-only">Application details</SheetTitle>
					<SheetDescription className="sr-only">Application details and actions</SheetDescription>
					{selected && (
						<ReviewPanel key={`${selected._id}-${selected.status}`} application={selected} onClose={() => setSelectedId(null)} />
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
