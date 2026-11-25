import PageHeader from "@/components/dashboard/PageHeader";
import { ApplicationStatusBadge, Badge } from "@/components/dashboard/StatusBadge";
import { ErrorState } from "@/components/dashboard/States";
import { btnText, dashCard } from "@/components/dashboard/styles";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetMyGuideApplicationsQuery } from "@/redux/features/GuideApplication/guideApplication.api";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

function Fact({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between gap-4 border-b border-border py-2.5 text-[14.5px] last:border-0">
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="min-w-0 text-right font-semibold break-words">{value}</dd>
		</div>
	);
}

export default function GuideProfile() {
	const { data: applications = [], isLoading, isError, refetch } = useGetMyGuideApplicationsQuery();

	const approved = applications.filter((application) => application.status === "APPROVED");
	const latest = approved[0];
	const first = approved[approved.length - 1];
	const languages = [...new Set(approved.flatMap((application) => application.languages))];

	return (
		<div className="flex flex-col gap-5">
			<PageHeader title="Guide profile" description="Where you can guide, and how you became a Tourly guide." />

			{isLoading && (
				<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]" aria-busy="true">
					<Skeleton className="h-72 rounded-xl" />
					<Skeleton className="h-72 rounded-xl" />
				</div>
			)}

			{isError && (
				<div className={dashCard}>
					<ErrorState title="Couldn't load your guide profile" onRetry={refetch} />
				</div>
			)}

			{!isLoading && !isError && (
				<div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
					<section className={cn(dashCard, "flex flex-col gap-4 p-5.5")}>
						<div className="flex items-center gap-3">
							<span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info">
								{latest ? <BadgeCheck className="size-5" /> : <ShieldCheck className="size-5" />}
							</span>
							<div>
								<h2 className="text-lg font-bold">{latest ? "Approved guide" : "Guide (set by an admin)"}</h2>
								<p className="text-[14px] text-muted-foreground">
									{latest
										? "Admins assign you to paid bookings in these divisions first."
										: "An admin gave you the guide role directly, so you can be assigned to trips in any division."}
								</p>
							</div>
						</div>

						{approved.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{[...new Set(approved.map((application) => application.division.name))].map((name) => (
									<Badge key={name} tone="accent">
										{name}
									</Badge>
								))}
							</div>
						)}

						<dl>
							<Fact label="Guide since" value={first ? formatDate(first.reviewedAt ?? first.createdAt) : "—"} />
							<Fact
								label="Experience"
								value={
									latest ? `${latest.experienceYears} year${latest.experienceYears === 1 ? "" : "s"}` : "—"
								}
							/>
							<Fact label="Languages" value={languages.length ? languages.join(", ") : "—"} />
						</dl>

						<p className="rounded-[10px] bg-surface-2 px-3.5 py-3 text-[13.5px] text-muted-foreground">
							Want to guide in another division or update these details? Contact a Tourly admin — guide accounts
							can't send new applications.
						</p>

						<Link to="/guide" className={cn(btnText, "w-fit")}>
							See your assigned trips
						</Link>
					</section>

					<section className={cn(dashCard, "flex flex-col gap-3.5 p-5.5")}>
						<h2 className="text-base font-semibold">Application history</h2>
						{applications.length === 0 ? (
							<p className="text-[14px] text-muted-foreground">You don't have any guide applications.</p>
						) : (
							<ul className="flex flex-col gap-3.5">
								{applications.map((application) => (
									<li
										key={application._id}
										className="flex flex-col gap-1.5 border-t border-border pt-3.5 first:border-0 first:pt-0"
									>
										<div className="flex flex-wrap items-center justify-between gap-2">
											<strong>{application.division.name}</strong>
											<ApplicationStatusBadge status={application.status} />
										</div>
										<p className="text-[13px] text-muted-foreground">
											Applied {formatDate(application.createdAt)}
											{application.reviewedAt && ` · reviewed ${formatDate(application.reviewedAt)}`}
										</p>
										{application.reviewNote && (
											<p className="rounded-[10px] bg-surface-2 px-3 py-2 text-[13.5px]">“{application.reviewNote}”</p>
										)}
									</li>
								))}
							</ul>
						)}
					</section>
				</div>
			)}
		</div>
	);
}
