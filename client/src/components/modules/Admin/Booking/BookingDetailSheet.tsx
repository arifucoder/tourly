import { BookingStatusBadge, PaymentStatusBadge } from "@/components/dashboard/StatusBadge";
import { ErrorState } from "@/components/dashboard/States";
import { btnDangerGhost, btnGhost, btnPrimary, btnSm } from "@/components/dashboard/styles";
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
import SearchableSelect from "@/components/ui/searchable-select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { bookingRef, formatDate, formatDateRange, formatDateTime, formatNumber, formatTaka, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
	useAssignGuideMutation,
	useGetAvailableGuidesQuery,
	useGetBookingQuery,
	useUpdateBookingStatusMutation,
} from "@/redux/features/Booking/booking.api";
import type { IAvailableGuide, IBookingDetail, TApiError } from "@/types";
import { CircleX, ExternalLink, FileText, UserRoundCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
	return (
		<section className="flex flex-col gap-2.5 border-t border-border pt-4">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-[13px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>
				{aside}
			</div>
			{children}
		</section>
	);
}

function Row({ k, v }: { k: string; v: ReactNode }) {
	return (
		<div className="flex justify-between gap-4 text-[14.5px]">
			<dt className="text-muted-foreground">{k}</dt>
			<dd className="min-w-0 text-right font-semibold break-words">{v}</dd>
		</div>
	);
}

const guideSummary = (guide: IAvailableGuide) => {
	if (!guide.isAvailable) return `Busy: ${guide.conflictWith}`;
	const approved = guide.approvedDivisions.length ? `Approved for ${guide.approvedDivisions.join(", ")}` : "";
	const years = guide.experienceYears ? `${guide.experienceYears} yr${guide.experienceYears === 1 ? "" : "s"}` : "";
	return [approved, years, guide.languages.join(", ")].filter(Boolean).join(" · ");
};

function GuidePicker({ booking }: { booking: IBookingDetail }) {
	const { data, isLoading, isError, refetch } = useGetAvailableGuidesQuery(booking._id);
	const [assignGuide, { isLoading: isSaving }] = useAssignGuideMutation();
	const [picked, setPicked] = useState("");

	const current = booking.guide ?? null;

	const save = async (guide: string | null) => {
		const toastId = toast.loading(guide ? "Assigning guide…" : "Removing guide…");
		try {
			await assignGuide({ id: booking._id, guide }).unwrap();
			toast.success(guide ? "Guide assigned" : "Guide removed", { id: toastId });
			setPicked("");
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't update the guide", { id: toastId });
		}
	};

	if (isLoading) return <Skeleton className="h-24 rounded-[10px]" />;
	if (isError || !data) return <ErrorState title="Couldn't load guides" onRetry={refetch} className="py-4" />;

	const options = data.guides
		.filter((guide) => guide._id !== current?._id)
		.map((guide) => ({
			value: guide._id,
			label: guide.name,
			description: guide.email,
			hint: [guide.phone, guideSummary(guide)].filter(Boolean).join(" · "),
			keywords: [guide.email, guide.phone ?? ""],
			disabled: !guide.isAvailable,
		}));

	return (
		<div className="flex flex-col gap-3">
			{current && (
				<div className="flex items-center gap-3 rounded-[10px] border border-primary bg-accent px-3 py-2.5">
					<span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-info-soft text-[13px] font-semibold text-info">
						{current.picture ? <img src={current.picture} alt="" className="size-full object-cover" /> : initials(current.name)}
					</span>
					<span className="min-w-0 flex-1 leading-snug">
						<span className="block truncate font-semibold">{current.name}</span>
						<span className="block truncate text-[12.5px] text-muted-foreground">
							{current.phone || current.email || "Assigned guide"}
						</span>
					</span>
					<button
						type="button"
						className={cn(btnGhost, btnSm)}
						disabled={isSaving}
						onClick={() => save(null)}
					>
						Remove
					</button>
				</div>
			)}

			{options.length === 0 ? (
				<p className="rounded-[10px] bg-surface-2 px-3.5 py-3 text-[13.5px] text-muted-foreground">
					{current ? "No other active guides to switch to." : "No active guides yet."} Make someone a Guide from{" "}
					<Link to="/admin/users" className="font-semibold text-primary-text hover:underline">
						Users
					</Link>{" "}
					or approve a{" "}
					<Link to="/admin/guide-applications" className="font-semibold text-primary-text hover:underline">
						guide application
					</Link>
					.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					<label htmlFor="assign-guide" className="text-sm font-semibold">
						{current ? "Change guide" : "Assign a guide"}
					</label>
					<SearchableSelect
						id="assign-guide"
						options={options}
						value={picked}
						onChange={setPicked}
						allowDeselect={false}
						placeholder="Search guides…"
						searchPlaceholder="Name, email or phone"
						emptyText="No guide found."
						disabled={isSaving}
						contentClassName="w-(--radix-popover-trigger-width) min-w-80"
					/>
					<button
						type="button"
						className={cn(btnPrimary, "w-full")}
						disabled={isSaving || !picked}
						onClick={() => save(picked)}
					>
						<UserRoundCheck />
						{current ? "Change guide" : "Assign guide"}
					</button>
					<p className="text-[12.5px] text-muted-foreground">
						Guides approved for {booking.tour.division?.name ?? "this division"} are listed first. Busy guides can't be
						picked.
					</p>
				</div>
			)}
		</div>
	);
}

function BookingBody({ booking }: { booking: IBookingDetail }) {
	const [confirmCancel, setConfirmCancel] = useState(false);
	const [updateStatus, { isLoading }] = useUpdateBookingStatusMutation();

	const cancel = async () => {
		const toastId = toast.loading("Cancelling booking…");
		try {
			await updateStatus({ id: booking._id, status: "CANCEL" }).unwrap();
			toast.success("Booking cancelled", { id: toastId });
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't cancel the booking", { id: toastId });
		}
	};

	const payment = booking.payment;

	return (
		<div className="flex flex-col gap-4 px-5 pb-6">
			<div className="flex items-center gap-3">
				<div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-placeholder">
					{booking.tour.images?.[0] && <img src={booking.tour.images[0]} alt="" className="size-full object-cover" />}
				</div>
				<div className="min-w-0">
					<Link
						to={`/tours/${booking.tour.slug}`}
						className="line-clamp-2 font-semibold hover:text-primary-text"
						target="_blank"
					>
						{booking.tour.title}
					</Link>
					<p className="text-[13px] text-muted-foreground">
						{[booking.tour.division?.name, booking.tour.location].filter(Boolean).join(" · ")}
					</p>
				</div>
			</div>

			<dl className="flex flex-col gap-2">
				<Row k="Status" v={<BookingStatusBadge status={booking.status} />} />
				<Row k="Trip dates" v={formatDateRange(booking.tour.startDate, booking.tour.endDate)} />
				<Row k="Guests" v={formatNumber(booking.guestCount)} />
				<Row k="Booked on" v={formatDateTime(booking.createdAt)} />
				{booking.expiredAt && <Row k="Expired" v={formatDateTime(booking.expiredAt)} />}
			</dl>

			<Section title="Payment">
				{payment ? (
					<dl className="flex flex-col gap-2">
						<Row k="Amount" v={formatTaka(payment.amount)} />
						<Row k="Payment" v={<PaymentStatusBadge status={payment.status} />} />
						<Row k="Transaction" v={<span className="text-[13px]">{payment.transactionId}</span>} />
						{payment.invoiceUrl && (
							<Row
								k="Invoice"
								v={
									<a
										href={payment.invoiceUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1.5 text-primary-text hover:underline"
									>
										<FileText className="size-4" />
										Open PDF
									</a>
								}
							/>
						)}
					</dl>
				) : (
					<p className="text-sm text-muted-foreground">No payment record.</p>
				)}
			</Section>

			<Section title="Traveller">
				<dl className="flex flex-col gap-2">
					<Row k="Name" v={booking.user.name} />
					<Row
						k="Email"
						v={
							<a href={`mailto:${booking.user.email}`} className="hover:text-primary-text">
								{booking.user.email}
							</a>
						}
					/>
					<Row k="Phone" v={booking.user.phone || "—"} />
					<Row k="Address" v={booking.user.address || "—"} />
				</dl>
			</Section>

			<Section
				title="Guide"
				aside={
					booking.guideAssignedAt ? (
						<span className="text-[12.5px] text-muted-foreground">since {formatDate(booking.guideAssignedAt)}</span>
					) : undefined
				}
			>
				{booking.status === "COMPLETE" ? (
					<GuidePicker key={booking.guide?._id ?? "none"} booking={booking} />
				) : (
					<p className="rounded-[10px] bg-surface-2 px-3.5 py-3 text-[13.5px] text-muted-foreground">
						A guide can be assigned once the booking is paid.
					</p>
				)}
			</Section>

			{booking.status !== "CANCEL" && (
				<Section title="Actions">
					<button
						type="button"
						className={cn(btnDangerGhost, "w-full")}
						disabled={isLoading}
						onClick={() => setConfirmCancel(true)}
					>
						<CircleX />
						Cancel booking
					</button>
				</Section>
			)}

			<AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogMedia className="bg-destructive/10 text-destructive">
							<CircleX />
						</AlertDialogMedia>
						<AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
						<AlertDialogDescription>
							{booking.tour.title} · {formatDateRange(booking.tour.startDate, booking.tour.endDate)}. The seats are released
							and {booking.status === "COMPLETE" ? "the payment is marked for refund" : "the unpaid payment is closed"}. This
							can't be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel variant="outline">Keep booking</AlertDialogCancel>
						<AlertDialogAction variant="destructive" onClick={cancel}>
							Cancel booking
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default function BookingDetailSheet({ bookingId, onClose }: { bookingId: string | null; onClose: () => void }) {
	const { data, isLoading, isError, refetch } = useGetBookingQuery(bookingId ?? "", { skip: !bookingId });

	return (
		<Sheet open={Boolean(bookingId)} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full gap-0 overflow-y-auto bg-card sm:max-w-lg">
				<SheetHeader className="px-5 pt-5 pb-4">
					<SheetTitle className="text-lg font-bold">{data ? bookingRef(data) : "Booking"}</SheetTitle>
					<SheetDescription>
						{data ? `Booked by ${data.user.name}` : "Loading booking details…"}
					</SheetDescription>
				</SheetHeader>

				{isLoading && (
					<div className="flex flex-col gap-3 px-5" aria-busy="true">
						<Skeleton className="h-14 rounded-lg" />
						<Skeleton className="h-32 rounded-lg" />
						<Skeleton className="h-32 rounded-lg" />
					</div>
				)}
				{isError && <ErrorState title="Couldn't load this booking" onRetry={refetch} />}
				{data && !isLoading && <BookingBody booking={data} />}

				{data && (
					<div className="mt-auto border-t border-border px-5 py-3">
						<Link
							to={`/tours/${data.tour.slug}`}
							target="_blank"
							className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-text hover:underline"
						>
							<ExternalLink className="size-4" />
							Open tour page
						</Link>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
