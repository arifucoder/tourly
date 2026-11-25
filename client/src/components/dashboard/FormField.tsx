import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { help, label } from "./styles";

export default function FormField({
	id,
	text,
	required,
	error,
	hint,
	aside,
	children,
	className,
}: {
	id: string;
	text: ReactNode;
	required?: boolean;
	error?: string;
	hint?: ReactNode;
	aside?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={className}>
			<div className="flex items-baseline justify-between gap-3">
				<label className={label} htmlFor={id}>
					{text} {required && <span className="text-destructive">*</span>}
				</label>
				{aside}
			</div>
			{children}
			{error ? (
				<p id={`${id}-e`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[13px] text-destructive">
					<AlertCircle className="size-3.75 shrink-0" />
					{error}
				</p>
			) : (
				hint && <p className={help}>{hint}</p>
			)}
		</div>
	);
}
