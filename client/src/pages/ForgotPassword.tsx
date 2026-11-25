import AuthCardLayout from "@/components/layout/AuthCardLayout";
import AuthFieldError from "@/components/modules/Authentication/AuthFieldError";
import {
	authGhostBtn,
	authInput,
	authLabel,
	authLink,
	authPrimaryBtn,
	authTitle,
} from "@/components/modules/Authentication/authStyles";
import IconBubble from "@/components/modules/Authentication/IconBubble";
import { useForgotPasswordMutation } from "@/redux/features/auth/auth.api";
import type { TApiError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import * as z from "zod";

const RESEND_AFTER = 45;

const formSchema = z.object({
	email: z.email({ error: "Enter a valid email address" }).trim(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPassword() {
	const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
	const [sentTo, setSentTo] = useState("");
	const [resendLeft, setResendLeft] = useState(0);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { email: "" } });

	useEffect(() => {
		if (resendLeft <= 0) return;
		const id = setTimeout(() => setResendLeft((t) => t - 1), 1000);
		return () => clearTimeout(id);
	}, [resendLeft]);

	const send = async (email: string) => {
		try {
			await forgotPassword({ email }).unwrap();
			setSentTo(email);
			setResendLeft(RESEND_AFTER);
		} catch (err) {
			const error = err as TApiError;
			toast.error(error.data?.errorSources?.[0]?.message || error.data?.message || "Couldn't send the link. Try again.");
		}
	};

	if (sentTo) {
		return (
			<AuthCardLayout centered>
				<IconBubble tone="success" size="lg">
					<Send />
				</IconBubble>
				<h1 className={authTitle}>Check your email</h1>
				<p className="text-[15px] text-muted-foreground">
					If an account exists for <strong className="text-foreground">{sentTo}</strong>, you'll get a link to reset
					your password. It's valid for 10 minutes.
				</p>
				<button
					type="button"
					onClick={() => send(sentTo)}
					disabled={resendLeft > 0 || isLoading}
					className={`${authGhostBtn} disabled:pointer-events-none disabled:opacity-45`}
				>
					{isLoading && <Loader2 className="size-4.5 animate-spin" />}
					{resendLeft > 0 ? `Resend link in 0:${String(resendLeft).padStart(2, "0")}` : "Resend link"}
				</button>
				<Link to="/login" className={`${authLink} text-[14.5px]`}>
					Back to log in
				</Link>
			</AuthCardLayout>
		);
	}

	return (
		<AuthCardLayout>
			<form onSubmit={handleSubmit(({ email }) => send(email))} noValidate className="flex flex-col gap-4.5">
				<Link to="/login" className={`${authLink} inline-flex items-center gap-1.5 self-start text-[14.5px]`}>
					<ArrowLeft className="size-4" strokeWidth={2.2} />
					Back to log in
				</Link>
				<IconBubble tone="primary">
					<KeyRound />
				</IconBubble>
				<div className="flex flex-col gap-1.5">
					<h1 className={authTitle}>Forgot your password?</h1>
					<p className="text-[15px] text-muted-foreground">
						Enter the email you signed up with and we'll send a reset link.
					</p>
				</div>
				<div>
					<label htmlFor="forgot-email" className={authLabel}>
						Email
					</label>
					<input
						{...register("email")}
						id="forgot-email"
						type="email"
						autoComplete="email"
						placeholder="you@example.com"
						aria-invalid={Boolean(errors.email)}
						aria-describedby="forgot-email-error"
						className={authInput}
					/>
					<AuthFieldError id="forgot-email-error" message={errors.email?.message} />
				</div>
				<button type="submit" disabled={isLoading} className={authPrimaryBtn}>
					{isLoading && <Loader2 className="size-4.5 animate-spin" />}
					Send reset link
				</button>
			</form>
		</AuthCardLayout>
	);
}
