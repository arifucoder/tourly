import { passwordRules } from "@/constants/passwordRules";
import { cn } from "@/lib/utils";

const levels = [
	{ bar: "bg-border", text: "" },
	{ bar: "bg-destructive", text: "text-destructive" },
	{ bar: "bg-warning", text: "text-warning" },
	{ bar: "bg-pink", text: "text-pink" },
	{ bar: "bg-success", text: "text-success" },
];

export default function PasswordRules({ id, value }: { id: string; value: string }) {
	const results = passwordRules.map((rule) => rule.test(value));
	const met = results.filter(Boolean).length;
	const missing = passwordRules.find((_, i) => !results[i]);
	const label = !value
		? ""
		: met === 4
			? "Strong password"
			: met === 3
				? `Good — ${missing?.hint}`
				: met === 2
					? `Fair — ${missing?.hint}`
					: `Weak — ${missing?.hint}`;

	return (
		<>
			<div className="mt-2.5 flex gap-1" aria-hidden="true">
				{passwordRules.map((rule, i) => (
					<span
						key={rule.label}
						className={cn("h-1.5 flex-1 rounded transition-colors", i < met ? levels[met].bar : "bg-border")}
					/>
				))}
			</div>
			{label && (
				<p className={cn("mt-1.5 text-[13px] font-semibold", levels[met].text)} aria-live="polite">
					{label}
				</p>
			)}
			<ul id={id} className="mt-2.5 grid grid-cols-2 gap-x-2.5 gap-y-1.5">
				{passwordRules.map((rule, i) => (
					<li
						key={rule.label}
						className={cn("flex items-center gap-2 text-[13.5px]", results[i] ? "text-success" : "text-muted-foreground")}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={results[i] ? 2.8 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
							{results[i] ? <path d="m5 12 5 5 9-10" /> : <circle cx="12" cy="12" r="8" />}
						</svg>
						{rule.label}
						<span className="sr-only">{results[i] ? "(done)" : "(not yet)"}</span>
					</li>
				))}
			</ul>
		</>
	);
}
