import { cn } from "@/lib/utils";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

type OtpInputProps = {
	value: string;
	onChange: (value: string) => void;
	length?: number;
	invalid?: boolean;
	disabled?: boolean;
};

export default function OtpInput({ value, onChange, length = 6, invalid, disabled }: OtpInputProps) {
	const refs = useRef<(HTMLInputElement | null)[]>([]);
	const [focused, setFocused] = useState<number | null>(null);
	const digits = Array.from({ length }, (_, i) => value[i] ?? "");

	const focusAt = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

	const setDigit = (i: number, digit: string) => {
		const next = digits.slice();
		next[i] = digit;
		onChange(next.join("").slice(0, length));
	};

	const handleInput = (i: number, raw: string) => {
		const clean = raw.replace(/\D/g, "");
		if (!clean) return;
		if (clean.length > 1) {
			onChange((value.slice(0, i) + clean).slice(0, length));
			focusAt(i + clean.length);
			return;
		}
		setDigit(i, clean);
		focusAt(i + 1);
	};

	const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Backspace") {
			e.preventDefault();
			if (digits[i]) {
				onChange(value.slice(0, i) + value.slice(i + 1));
			} else if (i > 0) {
				onChange(value.slice(0, i - 1) + value.slice(i));
				focusAt(i - 1);
			}
		} else if (e.key === "ArrowLeft") {
			focusAt(i - 1);
		} else if (e.key === "ArrowRight") {
			focusAt(i + 1);
		}
	};

	const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
		if (!pasted) return;
		onChange(pasted);
		focusAt(pasted.length);
	};

	return (
		<div className="flex justify-between gap-2">
			{digits.map((digit, i) => (
				<input
					key={i}
					ref={(el) => {
						refs.current[i] = el;
					}}
					value={digit}
					onChange={(e) => handleInput(i, e.target.value)}
					onKeyDown={(e) => handleKeyDown(i, e)}
					onPaste={handlePaste}
					onFocus={(e) => {
						setFocused(i);
						e.target.select();
					}}
					onBlur={() => setFocused(null)}
					disabled={disabled}
					inputMode="numeric"
					autoComplete={i === 0 ? "one-time-code" : "off"}
					maxLength={length}
					aria-label={`Digit ${i + 1}`}
					aria-invalid={invalid}
					className={cn(
						"h-14.5 w-full max-w-11.5 rounded-xl border-[1.5px] border-border bg-card text-center text-2xl font-bold text-foreground outline-none transition-colors",
						digit && "border-primary bg-accent",
						focused === i && "border-primary ring-3 ring-accent",
						invalid && "border-destructive bg-destructive-soft text-destructive ring-destructive-soft",
						disabled && "bg-surface-2 text-muted-foreground",
					)}
				/>
			))}
		</div>
	);
}
