import { cn } from "@/lib/utils";
import type { TApplicationStatus, TBookingStatus, TPaymentStatus, TRole, TUserStatus } from "@/types";
import { accountStatus, roleLabel, type TAccountStatus } from "./status";

type TTone = "success" | "warning" | "danger" | "neutral" | "info" | "accent" | "pink";

const toneClass: Record<TTone, string> = {
	success: "bg-success-soft text-success",
	warning: "bg-warning-soft text-warning",
	danger: "bg-destructive-soft text-destructive",
	neutral: "bg-surface-2 text-muted-foreground",
	info: "bg-info-soft text-info",
	accent: "bg-accent text-accent-foreground",
	pink: "bg-pink-soft text-pink",
};

export function Badge({
	tone,
	dot = false,
	className,
	children,
}: {
	tone: TTone;
	dot?: boolean;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] leading-tight font-semibold whitespace-nowrap",
				toneClass[tone],
				className,
			)}
		>
			{dot && <i aria-hidden="true" className="inline-block size-1.5 rounded-full bg-current" />}
			{children}
		</span>
	);
}

const bookingTone: Record<TBookingStatus, [TTone, string]> = {
	PENDING: ["warning", "Pending"],
	COMPLETE: ["success", "Complete"],
	CANCEL: ["neutral", "Cancelled"],
	FAILED: ["danger", "Failed"],
};

export function BookingStatusBadge({ status }: { status: TBookingStatus }) {
	const [tone, text] = bookingTone[status] ?? ["neutral", status];
	return (
		<Badge tone={tone} dot>
			{text}
		</Badge>
	);
}

const paymentTone: Record<TPaymentStatus, [TTone, string]> = {
	PAID: ["success", "Paid"],
	UNPAID: ["warning", "Unpaid"],
	CANCELLED: ["neutral", "Cancelled"],
	FAILED: ["danger", "Failed"],
	REFUNDED: ["info", "Refunded"],
};

export function PaymentStatusBadge({ status }: { status: TPaymentStatus }) {
	const [tone, text] = paymentTone[status] ?? ["neutral", status];
	return <Badge tone={tone}>{text}</Badge>;
}

const roleTone: Record<TRole, TTone> = {
	SUPER_ADMIN: "pink",
	ADMIN: "accent",
	GUIDE: "info",
	USER: "neutral",
};

export function RoleBadge({ role }: { role: TRole }) {
	return <Badge tone={roleTone[role] ?? "neutral"}>{roleLabel[role] ?? role}</Badge>;
}

const accountTone: Record<TAccountStatus, TTone> = {
	Active: "success",
	Blocked: "danger",
	Inactive: "neutral",
	Unverified: "warning",
};

export function AccountStatusBadge({ user }: { user: { isActive?: TUserStatus; isVerified?: boolean } }) {
	const status = accountStatus(user);
	return (
		<Badge tone={accountTone[status]} dot>
			{status}
		</Badge>
	);
}

const applicationTone: Record<TApplicationStatus, [TTone, string]> = {
	PENDING: ["warning", "Pending"],
	APPROVED: ["success", "Approved"],
	REJECTED: ["danger", "Rejected"],
};

export function ApplicationStatusBadge({ status }: { status: TApplicationStatus }) {
	const [tone, text] = applicationTone[status] ?? ["neutral", status];
	return (
		<Badge tone={tone} dot>
			{text}
		</Badge>
	);
}
