import { AlertCircle } from "lucide-react";

export default function AuthFieldError({ id, message }: { id?: string; message?: string }) {
	if (!message) return null;
	return (
		<p id={id} className="mt-1.5 flex items-center gap-1.5 text-[13px] text-destructive">
			<AlertCircle className="size-3.75 shrink-0" strokeWidth={2.2} />
			{message}
		</p>
	);
}
