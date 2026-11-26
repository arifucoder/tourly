import { BookingStatusBadge, PaymentStatusBadge } from "@/components/dashboard/StatusBadge";
import { ErrorState } from "@/components/dashboard/States";
import { btnDangerGhost, btnGhost, btnPrimary, dashCard } from "@/components/dashboard/styles";
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
import { Skeleton } from "@/components/ui/skeleton";
import { canPay, usePayBooking } from "@/hooks/usePayBooking";
import { bookingRef, formatDate, formatDateTime, formatTaka, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCancelMyBookingMutation, useGetBookingQuery } from "@/redux/features/Booking/booking.api";
import type { IBookingDetail, TApiError } from "@/types";
import { ArrowLeft, CircleX, Download, ImageIcon, Mail, Phone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { useOpenInvoice } from "@/hooks/useOpenInvoice";

const longDate = (date?: string) => formatDate(date, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
	return (
		<section className={cn(dashCard, "flex flex-col gap-4 p-5", className)}>
			{title && <h2 className="text-base font-semibold">{title}</h2>}
			{children}
		</section>
	);
}

function KV({ rows }: { rows: [string, ReactNode][] }) {
	return (
		<dl className="flex flex-col">
			{rows.map(([k, v], i) => (
				<div
					key={k}
					className={cn("flex justify-between gap-4 py-2.5 text-[14.5px]", i < rows.length - 1 && "border-b border-border")}
				>
					<dt className="text-muted-foreground">{k}</dt>
					<dd className="min-w-0 text-right font-semibold break-words">{v}</dd>
				</div>
			))}
		</dl>
	);
}

function Timeline({ booking }: { booking: IBookingDetail }) {
	const [now] = useState(() => Date.now());
	const paid = booking.payment?.status === "PAID";
	const start = booking.tour.startDate;
	const end = booking.tour.endDate ?? start;
	const cancelled = booking.status === "CANCEL" || booking.status === "FAILED";

	const steps: { title: string; meta: string; done: boolean }[] = [
		{ title: "Booking created", meta: formatDateTime(booking.createdAt), done: true },
		cancelled
			? {
					title: booking.status === "FAILED" ? "Payment failed" : booking.expiredAt ? "Expired — not paid in time" : "Cancelled",
					meta: formatDateTime(booking.expiredAt ?? booking.payment?.updatedAt),
					done: true,
				}
			: {
					title: paid ? "Payment completed" : "Waiting for payment",
					meta: paid ? formatDateTime(booking.payment?.updatedAt) : "Pay within 30 minutes to keep your seats",
					done: paid,
				},
		{
			title: "Trip starts",
			meta: [longDate(start), booking.tour.departureLocation].filter((v) => v && v !== "—").join(" · ") || "—",
			done: Boolean(start) && new Date(start as string).getTime() <= now && paid,
		},
		{ title: "Trip ends", meta: longDate(end), done: Boolean(end) && new Date(end as string).getTime() < now && paid },
	];

	return (
		<ol className="flex flex-col">
			{steps.map((step, i) => (
				<li key={step.title} className="flex gap-3">
					<div className="flex flex-col items-center">
						<span
							className={cn(
								"mt-1 size-3 shrink-0 rounded-full border-2",
								step.done ? "border-primary bg-primary" : "border-border bg-card",
							)}
						/>
						{i < steps.length - 1 && <span className="my-1 w-0.5 flex-1 bg-border" />}
					</div>
					<div className="pb-4">
						<strong className="block text-[14.5px]">{step.title}</strong>
						<span className="text-[13px] text-muted-foreground">{step.meta}</span>
					</div>
				</li>
			))}
		</ol>
	);
}

function GuideCard({ booking }: { booking: IBookingDetail }) {
	const guide = booking.guide;

	if (!guide) {
		return (
			<p className="text-[14px] text-muted-foreground">
				{booking.status === "COMPLETE"
					? "We'll assign a local guide before your trip. You'll see their name here."
					: "A guide is assigned once your booking is paid."}
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-3">
				<span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-info-soft font-semibold text-info">
					{guide.picture ? <img src={guide.picture} alt="" className="size-full object-cover" /> : initials(guide.name)}
				</span>
				<div className="min-w-0">
					<strong className="block truncate">{guide.name}</strong>
					<span className="text-[13px] text-muted-foreground">
						{guide.contactShared === false ? "Contact shared 48 h before departure" : "Your local guide"}
					</span>
				</div>
			</div>
			{guide.contactShared !== false && (guide.phone || guide.email) && (
				<div className="flex gap-2">
					{guide.phone && (
						<a href={`tel:${guide.phone}`} className={cn(btnGhost, "h-10 flex-1")}>
							<Phone />
							Call
						</a>
					)}
					{guide.email && (
						<a href={`mailto:${guide.email}`} className={cn(btnGhost, "h-10 flex-1")}>
							<Mail />
							Email
						</a>
					)}
				</div>
			)}
		</div>
	);
}

function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading booking">
			<Skeleton className="h-4 w-28" />
			<Skeleton className="h-9 w-96 max-w-full" />
			<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
				<Skeleton className="h-96 rounded-xl" />
				<Skeleton className="h-72 rounded-xl" />
			</div>
		</div>
	);
}

export default function BookingDetail() {
	const { openInvoice, openingId } = useOpenInvoice();
	const { bookingId = "" } = useParams();
	const { data: booking, isLoading, isError, refetch } = useGetBookingQuery(bookingId, { skip: !bookingId });
	const [cancelBooking, { isLoading: isCancelling }] = useCancelMyBookingMutation();
	const { pay, payingId } = usePayBooking();
	const [confirmCancel, setConfirmCancel] = useState(false);

	const back = (
		<Link
			to="/user/bookings"
			className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft className="size-4" />
			All bookings
		</Link>
	);

	if (isLoading) return <DetailSkeleton />;
	if (isError || !booking) {
		return (
			<div className="flex flex-col gap-4">
				{back}
				<div className={dashCard}>
					<ErrorState title="Couldn't load this booking" onRetry={refetch} />
				</div>
			</div>
		);
	}

	const { tour, payment } = booking;
	const paid = payment?.status === "PAID";
	const unitPrice = payment ? payment.amount / Math.max(booking.guestCount, 1) : tour.costFrom;
	const route = [tour.departureLocation, tour.arrivalLocation].filter(Boolean).join(" → ");

	const cancel = async () => {
		const toastId = toast.loading("Cancelling…");
		try {
			await cancelBooking(booking._id).unwrap();
			toast.success("Booking cancelled", { id: toastId, description: "Your seats were released." });
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't cancel the booking", { id: toastId });
		}
	};

	return (
		<div className="flex flex-col gap-5">
			{back}

			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex min-w-0 flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2.5">
						<BookingStatusBadge status={booking.status} />
						<span className="text-[13px] text-muted-foreground">{bookingRef(booking)}</span>
					</div>
					<h1 className="text-[26px] leading-tight font-bold tracking-[-0.01em] sm:text-[28px]">{tour.title}</h1>
				</div>
				<div className="flex flex-wrap gap-2.5">
					<Link to={`/tours/${tour.slug}`} className={btnGhost}>
						View tour page
					</Link>
					{paid && payment?.invoiceUrl && (
						<button
							type="button"
							onClick={() => openInvoice(payment._id)}
							disabled={openingId === payment._id}
							className={btnPrimary}
						>
							<Download />
							Download invoice
						</button>
					)}
					{canPay(booking) && (
						<button type="button" className={btnPrimary} disabled={Boolean(payingId)} onClick={() => pay(booking._id)}>
							{booking.status === "PENDING" ? "Pay now" : "Try payment again"}
						</button>
					)}
				</div>
			</div>

			<div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div className="flex min-w-0 flex-col gap-5">
					<Card className="gap-0 overflow-hidden p-0">
						<div className="flex aspect-[16/7] items-center justify-center bg-placeholder text-placeholder-foreground">
							{tour.images?.[0] ? (
								<img src={tour.images[0]} alt={tour.title} className="size-full object-cover" />
							) : (
								<ImageIcon className="size-7" />
							)}
						</div>
						<div className="px-5 py-2">
							<KV
								rows={[
									...(route ? [["Departure → Arrival", route] as [string, ReactNode]] : []),
									["Dates", `${longDate(tour.startDate)}${tour.endDate && tour.endDate !== tour.startDate ? ` → ${longDate(tour.endDate)}` : ""}`],
									["Location", [tour.location, tour.division?.name].filter(Boolean).join(", ") || "—"],
									["Tour type", tour.tourType?.name ?? "—"],
								]}
							/>
						</div>
					</Card>

					<Card title="Travellers">
						<KV
							rows={[
								["Guests", booking.guestCount],
								["Lead traveller", booking.user.name],
								["Phone", booking.user.phone || "—"],
								["Email", booking.user.email],
							]}
						/>
					</Card>

					<Card title="Payment">
						{payment ? (
							<>
								<KV
									rows={[
										["Transaction ID", <span key="t" className="text-[13px]">{payment.transactionId}</span>],
										...(paid ? [["Paid on", formatDateTime(payment.updatedAt)] as [string, ReactNode]] : []),
										["Payment status", <PaymentStatusBadge key="p" status={payment.status} />],
									]}
								/>
								<div className="flex flex-col gap-2 rounded-[10px] bg-surface-2 px-4 py-3.5 text-[14.5px]">
									<div className="flex justify-between gap-3">
										<span className="text-muted-foreground">
											{formatTaka(unitPrice)} × {booking.guestCount} guest{booking.guestCount === 1 ? "" : "s"}
										</span>
										<span>{formatTaka(payment.amount)}</span>
									</div>
									<div className="flex justify-between gap-3">
										<span className="text-muted-foreground">Service fee</span>
										<span>{formatTaka(0)}</span>
									</div>
									<div className="flex justify-between gap-3 border-t border-border pt-2">
										<strong>{paid ? "Total paid" : "Total due"}</strong>
										<strong className="text-lg">{formatTaka(payment.amount)}</strong>
									</div>
								</div>
							</>
						) : (
							<p className="text-sm text-muted-foreground">No payment record.</p>
						)}
					</Card>
				</div>

				<div className="flex flex-col gap-5">
					<Card title="Timeline">
						<Timeline booking={booking} />
					</Card>
					<Card title="Your guide">
						<GuideCard booking={booking} />
					</Card>
					{booking.status === "PENDING" && (
						<Card title="Need to cancel?">
							<p className="text-[14px] text-muted-foreground">
								You haven't paid yet, so you can cancel for free. Your seats go back to other travellers.
							</p>
							<button
								type="button"
								className={btnDangerGhost}
								disabled={isCancelling}
								onClick={() => setConfirmCancel(true)}
							>
								Cancel booking
							</button>
						</Card>
					)}
				</div>
			</div>

			<AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogMedia className="bg-destructive/10 text-destructive">
							<CircleX />
						</AlertDialogMedia>
						<AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
						<AlertDialogDescription>
							{tour.title} · {longDate(tour.startDate)}. Nothing has been charged, and your seats will be released.
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
