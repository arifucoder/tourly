import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { authInput } from "./authStyles";

export default function PasswordInput(props: ComponentProps<"input">) {
	const [visible, setVisible] = useState(false);

	return (
		<div className="relative">
			<input {...props} type={visible ? "text" : "password"} className={`${authInput} pr-13`} />
			<button
				type="button"
				onClick={() => setVisible((v) => !v)}
				aria-label={visible ? "Hide password" : "Show password"}
				className="absolute top-0.5 right-0.5 flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"
			>
				{visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
			</button>
		</div>
	);
}
