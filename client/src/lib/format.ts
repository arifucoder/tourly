const DATE_LOCALE = "en-GB";

export const formatTaka = (amount?: number | null) =>
	amount === undefined || amount === null ? "—" : `৳${Math.round(amount).toLocaleString("en-IN")}`;

export const formatTakaCompact = (amount: number) => {
	if (amount >= 100000) return `৳${(amount / 1000).toLocaleString("en-IN", { maximumFractionDigits: 0 })}k`;
	if (amount >= 1000) return `৳${(amount / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}k`;
	return `৳${amount}`;
};

export const formatNumber = (value?: number | null) => (value ?? 0).toLocaleString("en-IN");

export const formatDate = (date?: string | Date | null, options?: Intl.DateTimeFormatOptions) =>
	date
		? new Date(date).toLocaleDateString(DATE_LOCALE, options ?? { day: "numeric", month: "short", year: "numeric" })
		: "—";

export const formatDateTime = (date?: string | Date | null) =>
	date
		? new Date(date).toLocaleString(DATE_LOCALE, {
				day: "numeric",
				month: "short",
				year: "numeric",
				hour: "numeric",
				minute: "2-digit",
			})
		: "—";

export const formatDateRange = (start?: string | null, end?: string | null) => {
	if (!start && !end) return "—";
	const thisYear = new Date().getFullYear();
	const short = (date: Date) =>
		formatDate(date, { day: "numeric", month: "short", ...(date.getFullYear() !== thisYear && { year: "numeric" }) });

	if (!start || !end || start.slice(0, 10) === end.slice(0, 10)) return short(new Date((start ?? end) as string));

	const a = new Date(start);
	const b = new Date(end);
	if (a.getFullYear() !== b.getFullYear()) return `${formatDate(a)} – ${formatDate(b)}`;
	if (a.getMonth() !== b.getMonth()) return `${formatDate(a, { day: "numeric", month: "short" })} – ${short(b)}`;
	return `${a.getDate()}–${short(b)}`;
};

export const initials = (name?: string) =>
	(name ?? "?")
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");

export const toTitle = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");

export const slugify = (text: string) =>
	text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
