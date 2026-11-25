import TourGallery from "@/components/modules/Tour/TourGallery";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/hooks/useWishlist";
import { outlineBtn, primaryBtn, squareBtn } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { useCreateBookingMutation } from "@/redux/features/Booking/booking.api";
import { useGetSingleTourQuery } from "@/redux/features/Tour/tour.api";
import type { TApiError } from "@/types";
import {
	CalendarDays,
	Clock,
	Loader2,
	MapPinOff,
	Minus,
	Plus,
	RefreshCw,
	Tag,
	UserRound,
	Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

const FEW_SEATS = 5;
const DEFAULT_MAX_GUESTS = 10;

const formatDate = (date: string) =>
	new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const shortDate = (date: string) => new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const formatPrice = (amount: number) => `৳${amount.toLocaleString("en-IN")}`;

const getDays = (start: string, end: string) =>
	Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;

const splitPlan = (step: string) => {
	const [first, ...rest] = step.split("\n");
	const text = rest.join("\n").trim();
	return text ? { title: first.trim(), text } : { title: "", text: step.trim() };
};

const sectionTitle = "text-[22px] font-bold sm:text-[26px]";

const pinPath =
	"M12 2C8 2 5 5 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z";

function RouteIcon() {
	return (
		<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<circle cx="6" cy="18" r="2.5" />
			<circle cx="18" cy="6" r="2.5" />
			<path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
		</svg>
	);
}

type TFact = { icon: ReactNode; iconCls: string; label: string; value: string };

function Fact({ icon, iconCls, label, value }: TFact) {
	return (
		<div className="flex items-center gap-3.5">
			<span className={cn("flex size-12 shrink-0 items-center justify-center rounded-[14px]", iconCls)}>{icon}</span>
			<div>
				<dt className="text-[12.5px] text-muted-foreground">{label}</dt>
				<dd className="text-[14.5px] font-semibold text-foreground">{value}</dd>
			</div>
		</div>
	);
}

function ListCard({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) {
	return (
		<div className="flex flex-col gap-3.5 rounded-[14px] bg-card p-5.5 shadow-soft">
			<h3 className="text-[17px] font-semibold">{title}</h3>
			<ul className="flex flex-col gap-2.5">
				{items.map((item) => (
					<li key={item} className="flex items-start gap-2.5 text-[14.5px]">
						<span className="mt-0.75 shrink-0">{icon}</span>
						{item}
					</li>
				))}
			</ul>
		</div>
	);
}

function TourDetailsSkeleton() {
	return (
		<div className="mx-auto flex max-w-300 flex-col gap-5.5 px-4 pt-4 pb-24 sm:px-10">
			<Skeleton className="h-4 w-64" />
			<div className="flex flex-col gap-3">
				<Skeleton className="h-6 w-40 rounded-full" />
				<Skeleton className="h-10 w-full max-w-xl" />
				<Skeleton className="h-4 w-72" />
			</div>
			<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[2fr_1fr_1fr] sm:grid-rows-[220px_220px]">
				<Skeleton className="h-65 rounded-2xl sm:row-span-2 sm:h-auto" />
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="hidden rounded-2xl sm:block" />
				))}
			</div>
			<div className="flex flex-col gap-12 pt-6 min-[981px]:flex-row">
				<div className="flex flex-1 flex-col gap-6">
					<Skeleton className="h-44 rounded-[14px]" />
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-24 rounded-[14px]" />
				</div>
				<Skeleton className="h-96 rounded-[14px] min-[981px]:w-92.5" />
			</div>
		</div>
	);
}

export default function TourDetails() {
	const { slug } = useParams();
	const { data: tour, isLoading, isError, error, refetch } = useGetSingleTourQuery(slug as string, { skip: !slug });

	const navigate = useNavigate();
	const location = useLocation();
	const { data: userData } = useUserInfoQuery(undefined);
	const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
	const { saved, toggle: toggleSaved } = useWishlist(tour?._id);
	const [guests, setGuests] = useState(1);

	const isLoggedIn = Boolean(userData?.data?.email);

	if (isLoading) return <TourDetailsSkeleton />;

	if (isError || !tour) {
		const notFound = (error as TApiError | undefined)?.status === 404 || (!isError && !tour);
		return (
			<div className="mx-auto flex max-w-300 flex-col items-center gap-4 px-4 py-24 text-center sm:px-10">
				<span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
					<MapPinOff className="size-6" />
				</span>
				<div>
					<h1 className="text-2xl font-bold">{notFound ? "Tour not found" : "Couldn't load this tour"}</h1>
					<p className="text-muted-foreground">
						{notFound ? "This tour may have been removed or the link is wrong." : "Check your connection and try again."}
					</p>
				</div>
				<div className="flex gap-2.5">
					{!notFound && (
						<button type="button" onClick={() => refetch()} className={outlineBtn}>
							<RefreshCw className="size-4" />
							Try again
						</button>
					)}
					<Link to="/tours" className={primaryBtn}>
						Browse all tours
					</Link>
				</div>
			</div>
		);
	}

	const images = tour.images ?? [];
	const hasDates = Boolean(tour.startDate && tour.endDate);
	const days = hasDates ? getDays(tour.startDate!, tour.endDate!) : 0;
	const seatsLeft = tour.seatsLeft ?? null;
	const soldOut = seatsLeft === 0;
	const expired = Boolean(tour.isExpired);
	const maxGuests = Math.max(1, Math.min(tour.maxGuest ?? DEFAULT_MAX_GUESTS, seatsLeft ?? Infinity));
	const hasPrice = tour.costFrom !== undefined;
	const price = tour.costFrom ?? 0;
	const total = price * guests;
	const guestWord = guests === 1 ? "guest" : "guests";
	const canBook = hasPrice && !soldOut && !expired && !isBooking;

	const facts: TFact[] = [];
	if (tour.departureLocation || tour.arrivalLocation)
		facts.push({
			icon: <RouteIcon />,
			iconCls: "bg-accent text-primary-text",
			label: "Departure → Arrival",
			value: `${tour.departureLocation ?? "—"} → ${tour.arrivalLocation ?? "—"}`,
		});
	if (hasDates)
		facts.push(
			{
				icon: <CalendarDays className="size-5.5" />,
				iconCls: "bg-pink-soft text-pink",
				label: "Start → End date",
				value: `${shortDate(tour.startDate!)} → ${formatDate(tour.endDate!)}`,
			},
			{
				icon: <Clock className="size-5.5" />,
				iconCls: "bg-yellow-soft text-warning",
				label: "Duration",
				value: days === 1 ? "1 day" : `${days} days · ${days - 1} ${days - 1 === 1 ? "night" : "nights"}`,
			},
		);
	if (tour.maxGuest)
		facts.push({
			icon: <Users className="size-5.5" />,
			iconCls: "bg-mint-soft text-success",
			label: "Max guests",
			value: `${tour.maxGuest} per departure`,
		});
	if (tour.minAge !== undefined)
		facts.push({
			icon: <UserRound className="size-5.5" />,
			iconCls: "bg-accent text-primary-text",
			label: "Minimum age",
			value: `${tour.minAge} years`,
		});
	if (hasPrice)
		facts.push({
			icon: <Tag className="size-5.5" />,
			iconCls: "bg-pink-soft text-pink",
			label: "Price",
			value: `${formatPrice(price)} per person`,
		});

	const handleShare = async () => {
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({ title: tour.title, url });
			} else {
				await navigator.clipboard.writeText(url);
				toast.success("Link copied to clipboard");
			}
		} catch {
			return;
		}
	};

	const handleBook = async () => {
		if (!isLoggedIn) {
			toast.info("Please log in to book this tour");
			navigate("/login", { state: { from: location.pathname } });
			return;
		}

		const toastId = toast.loading("Creating your booking…");
		try {
			const res = await createBooking({ tour: tour._id, guestCount: guests }).unwrap();
			const paymentUrl =
				typeof res.paymentUrl === "string"
					? res.paymentUrl
					: (res.paymentUrl as { GatewayPageURL?: string } | undefined)?.GatewayPageURL;

			if (paymentUrl) {
				toast.success("Redirecting to payment…", { id: toastId });
				window.location.href = paymentUrl;
			} else {
				toast.error("Payment link not received. Please try again.", { id: toastId });
			}
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Booking failed. Please try again.", { id: toastId });
		}
	};

	const bookLabel = isBooking ? (
		<>
			<Loader2 className="size-4.5 animate-spin" />
			Processing…
		</>
	) : expired ? (
		"Booking closed"
	) : soldOut ? (
		"Fully booked"
	) : (
		"Book now"
	);

	return (
		<div className="bg-background">
			<div className="mx-auto flex max-w-300 flex-col gap-5.5 px-4 pt-4 sm:px-10">
				<nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-[13.5px] text-muted-foreground">
					<Link to="/" className="hover:text-foreground">
						Home
					</Link>
					<span aria-hidden="true">/</span>
					<Link to="/tours" className="hover:text-foreground">
						Tours
					</Link>
					{tour.division && (
						<>
							<span aria-hidden="true">/</span>
							<Link to={`/tours?division=${tour.division._id}`} className="hover:text-foreground">
								{tour.division.name}
							</Link>
						</>
					)}
					<span aria-hidden="true">/</span>
					<span className="font-medium text-primary-text">{tour.title}</span>
				</nav>

				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div className="flex flex-col gap-2.5">
						<div className="flex flex-wrap gap-2 empty:hidden">
							{tour.tourType && (
								<span className="rounded-full bg-accent px-3 py-1.25 text-[12.5px] font-semibold text-primary-text">
									{tour.tourType.name}
								</span>
							)}
							{tour.division && (
								<span className="rounded-full bg-pink-soft px-3 py-1.25 text-[12.5px] font-semibold text-pink">
									{tour.division.name}
								</span>
							)}
							{seatsLeft !== null && seatsLeft > 0 && seatsLeft <= FEW_SEATS && (
								<span className="rounded-full bg-warning-soft px-3 py-1.25 text-[12.5px] font-semibold text-warning">
									{seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left
								</span>
							)}
							{expired && (
								<span className="rounded-full bg-muted px-3 py-1.25 text-[12.5px] font-semibold text-muted-foreground">
									Departed
								</span>
							)}
							{soldOut && !expired && (
								<span className="rounded-full bg-destructive-soft px-3 py-1.25 text-[12.5px] font-semibold text-destructive">
									Fully booked
								</span>
							)}
						</div>
						<h1 className="text-[30px] leading-[1.15] font-bold sm:text-[42px]">{tour.title}</h1>
						{tour.location && (
							<p className="flex items-center gap-1.5 text-muted-foreground">
								<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 fill-primary">
									<path d={pinPath} />
								</svg>
								{tour.location}
							</p>
						)}
					</div>
					<div className="flex gap-2.5">
						<button type="button" onClick={handleShare} className={outlineBtn}>
							Share
						</button>
						<button
							type="button"
							onClick={toggleSaved}
							aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
							aria-pressed={saved}
							className={cn(squareBtn, "w-11 px-0", saved ? "text-destructive" : "text-foreground")}
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z" />
							</svg>
						</button>
					</div>
				</div>

				<TourGallery images={images} title={tour.title} />
			</div>

			<div className="mx-auto flex max-w-300 flex-col items-stretch gap-12 px-4 pt-11 pb-24 sm:px-10 min-[981px]:flex-row min-[981px]:items-start">
				<main className="flex min-w-0 flex-[999_1_560px] flex-col gap-11">
					{facts.length > 0 && (
						<dl className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-7 gap-y-6 rounded-[14px] bg-card p-6.5 shadow-soft">
							{facts.map((fact) => (
								<Fact key={fact.label} {...fact} />
							))}
						</dl>
					)}

					{tour.description && (
						<section className="flex flex-col gap-3.5">
							<h2 className={sectionTitle}>About this tour</h2>
							<p className="max-w-[70ch] text-[15.5px] leading-[1.8] whitespace-pre-line text-muted-foreground">
								{tour.description}
							</p>
						</section>
					)}

					{tour.tourPlan && tour.tourPlan.length > 0 && (
						<section className="flex flex-col gap-5.5">
							<h2 className={sectionTitle}>Tour plan</h2>
							<ol className="flex flex-col">
								{tour.tourPlan.map((step, i) => {
									const { title, text } = splitPlan(step);
									return (
										<li key={`${i}-${step}`} className="flex gap-4.5">
											<div className="flex flex-col items-center">
												<span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-[0_8px_18px_rgb(255_123_41/0.25)]">
													{i + 1}
												</span>
												<span className="my-1.5 min-h-6 w-0.5 flex-1 bg-border" />
											</div>
											<div className="mb-4.5 flex flex-1 flex-col gap-1.5 rounded-[14px] bg-card px-5 py-4.5 shadow-soft">
												<span className="text-[12.5px] font-semibold text-primary-text">Day {i + 1}</span>
												{title && <h3 className="text-[17px] font-semibold">{title}</h3>}
												<p className="text-sm leading-[1.7] whitespace-pre-line text-muted-foreground">{text}</p>
											</div>
										</li>
									);
								})}
							</ol>
						</section>
					)}

					{Boolean(tour.included?.length || tour.excluded?.length || tour.amenities?.length) && (
						<section className="grid grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-4.5">
							{tour.included && tour.included.length > 0 && (
								<ListCard
									title="Included"
									items={tour.included}
									icon={
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-success">
											<path d="m5 12 5 5 9-10" />
										</svg>
									}
								/>
							)}
							{tour.excluded && tour.excluded.length > 0 && (
								<ListCard
									title="Not included"
									items={tour.excluded}
									icon={
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true" className="text-destructive">
											<path d="M6 6l12 12M18 6 6 18" />
										</svg>
									}
								/>
							)}
							{tour.amenities && tour.amenities.length > 0 && (
								<ListCard
									title="Amenities"
									items={tour.amenities}
									icon={
										<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="fill-primary">
											<path d="M12 3l2.6 5.6L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.4-.7z" />
										</svg>
									}
								/>
							)}
						</section>
					)}
				</main>

				<aside
					aria-label="Book this tour"
					className="flex flex-col gap-4.5 rounded-[14px] bg-card p-6.5 shadow-soft min-[981px]:sticky min-[981px]:top-6 min-[981px]:w-92.5 min-[981px]:shrink-0"
				>
					<div>
						<span className="text-[13px] text-muted-foreground">from</span>
						<div className="flex items-baseline gap-1.5">
							<strong className="text-[32px] font-bold text-primary-text">
								{hasPrice ? formatPrice(price) : "Price on request"}
							</strong>
							{hasPrice && <span className="text-sm text-muted-foreground">/ person</span>}
						</div>
					</div>

					{hasDates && (
						<div className="grid grid-cols-2 gap-2.5">
							<div className="rounded-[10px] bg-surface-2 px-3.5 py-3">
								<span className="text-xs text-muted-foreground">Start</span>
								<div className="text-sm font-semibold">{formatDate(tour.startDate!)}</div>
							</div>
							<div className="rounded-[10px] bg-surface-2 px-3.5 py-3">
								<span className="text-xs text-muted-foreground">End</span>
								<div className="text-sm font-semibold">{formatDate(tour.endDate!)}</div>
							</div>
						</div>
					)}

					<div className="flex items-center justify-between gap-3">
						<div>
							<div id="guests-label" className="font-semibold">
								Guests
							</div>
							<div className="text-[12.5px] text-muted-foreground">
								Max {maxGuests}
								{tour.minAge !== undefined && ` · age ${tour.minAge}+`}
							</div>
						</div>
						<div role="group" aria-labelledby="guests-label" className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={() => setGuests((g) => Math.max(1, g - 1))}
								disabled={guests <= 1 || soldOut || expired}
								aria-label="Remove a guest"
								className={cn(squareBtn, "w-11 px-0")}
							>
								<Minus className="size-4.5" strokeWidth={2.4} />
							</button>
							<output aria-live="polite" className="min-w-8.5 text-center text-lg font-bold">
								{guests}
							</output>
							<button
								type="button"
								onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
								disabled={guests >= maxGuests || soldOut || expired}
								aria-label="Add a guest"
								className={cn(squareBtn, "w-11 border-primary px-0 text-primary-text hover:border-primary")}
							>
								<Plus className="size-4.5" strokeWidth={2.4} />
							</button>
						</div>
					</div>

					{hasPrice && (
						<div className="flex flex-col gap-2 border-t border-dashed border-border pt-4">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									{formatPrice(price)} × {guests} {guestWord}
								</span>
								<span>{formatPrice(total)}</span>
							</div>
							<div className="flex items-baseline justify-between pt-1">
								<strong>Total</strong>
								<strong className="text-2xl font-bold">{formatPrice(total)}</strong>
							</div>
						</div>
					)}

					<button
						type="button"
						onClick={handleBook}
						disabled={!canBook}
						className={cn(primaryBtn, "min-h-13 text-[15.5px]")}
					>
						{bookLabel}
					</button>
					<p className="text-center text-[12.5px] text-muted-foreground">
						{expired
							? "This departure has already left. Browse other tours for upcoming dates."
							: "You review everything before paying · secure checkout in taka"}
					</p>
				</aside>
			</div>

			{hasPrice && (
				<div className="sticky bottom-0 z-5 flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-[0_-8px_24px_rgb(45_49_52/0.08)] sm:hidden">
					<div>
						<div className="text-xs text-muted-foreground">
							{guests} {guestWord} · total
						</div>
						<strong className="text-xl text-primary-text">{formatPrice(total)}</strong>
					</div>
					<button type="button" onClick={handleBook} disabled={!canBook} className={cn(primaryBtn, "min-h-12")}>
						{bookLabel}
					</button>
				</div>
			)}
		</div>
	);
}
