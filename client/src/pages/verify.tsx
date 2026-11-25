import AuthCardLayout from "@/components/layout/AuthCardLayout";
import { authLink, authPrimaryBtn, authTitle } from "@/components/modules/Authentication/authStyles";
import IconBubble from "@/components/modules/Authentication/IconBubble";
import OtpInput from "@/components/modules/Authentication/OtpInput";
import { useSendOtpMutation, useVerifyOtpMutation } from "@/redux/features/auth/auth.api";
import type { TApiError } from "@/types";
import { AlertCircle, AlertTriangle, Clock, Loader2, Mail } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

const CODE_LENGTH = 6;
const EXPIRES_IN = 120;
const RESEND_AFTER = 60;

const formatTime = (seconds: number) =>
	`${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

const getErrorMessage = (err: unknown, fallback: string) => {
	const error = err as TApiError;
	return error.data?.errorSources?.[0]?.message || error.data?.message || fallback;
};

export default function Verify() {
	const location = useLocation();
	const navigate = useNavigate();
	const email = location.state as string | undefined;

	const [sendOtp, { isLoading: isSending }] = useSendOtpMutation();
	const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();

	const [code, setCode] = useState("");
	const [wrongCode, setWrongCode] = useState(false);
	const [expiresLeft, setExpiresLeft] = useState(0);
	const [resendLeft, setResendLeft] = useState(0);
	const [sentOnce, setSentOnce] = useState(false);
	const hasSentRef = useRef(false);

	const expired = sentOnce && expiresLeft <= 0;

	const handleSend = async () => {
		if (!email) return;
		try {
			await sendOtp({ email }).unwrap();
			setCode("");
			setWrongCode(false);
			setExpiresLeft(EXPIRES_IN);
			setResendLeft(RESEND_AFTER);
			setSentOnce(true);
			toast.success("We sent a new code to your email");
		} catch (err) {
			toast.error(getErrorMessage(err, "Couldn't send the code. Please try again."));
		}
	};

	useEffect(() => {
		if (!email || hasSentRef.current) return;
		hasSentRef.current = true;
		handleSend();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [email]);

	useEffect(() => {
		if (expiresLeft <= 0 && resendLeft <= 0) return;
		const id = setTimeout(() => {
			setExpiresLeft((t) => Math.max(0, t - 1));
			setResendLeft((t) => Math.max(0, t - 1));
		}, 1000);
		return () => clearTimeout(id);
	}, [expiresLeft, resendLeft]);

	if (!email) return <Navigate to="/login" replace />;

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (code.length !== CODE_LENGTH) return;
		try {
			await verifyOtp({ email, otp: code }).unwrap();
			toast.success("Email verified! Please log in.");
			navigate("/login", { replace: true });
		} catch {
			setWrongCode(true);
		}
	};

	const handleCodeChange = (value: string) => {
		setCode(value);
		setWrongCode(false);
	};

	if (expired) {
		return (
			<AuthCardLayout>
				<IconBubble tone="warning">
					<Clock />
				</IconBubble>
				<div className="flex flex-col gap-1.5">
					<h1 className={authTitle}>This code has expired</h1>
					<p className="text-[15px] text-muted-foreground">
						Codes are valid for 2 minutes. Request a new one and we'll send it to{" "}
						<strong className="text-foreground">{email}</strong>.
					</p>
				</div>
				<fieldset disabled className="m-0 border-0 p-0">
					<legend className="mb-1.5 text-sm font-semibold text-muted-foreground">Verification code</legend>
					<OtpInput value="" onChange={() => undefined} disabled />
				</fieldset>
				<div className="flex items-start gap-2.5 rounded-xl bg-warning-soft px-3.5 py-3 text-sm text-warning">
					<AlertTriangle className="mt-px size-4.5 shrink-0" />
					Too many wrong attempts also expire a code.
				</div>
				<button type="button" onClick={handleSend} disabled={isSending} className={authPrimaryBtn}>
					{isSending && <Loader2 className="size-4.5 animate-spin" />}
					Send a new code
				</button>
				<Link to="/login" className={`${authLink} text-center text-[14.5px]`}>
					Back to log in
				</Link>
			</AuthCardLayout>
		);
	}

	return (
		<AuthCardLayout>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
				<IconBubble tone="primary">
					<Mail />
				</IconBubble>
				<div className="flex flex-col gap-1.5">
					<h1 className={authTitle}>Check your inbox</h1>
					<p className="text-[15px] text-muted-foreground">
						We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.{" "}
						<Link to="/signup" className={authLink}>
							Change
						</Link>
					</p>
				</div>

				<fieldset className="m-0 border-0 p-0">
					<legend className="mb-1.5 text-sm font-semibold">Verification code</legend>
					<OtpInput value={code} onChange={handleCodeChange} invalid={wrongCode} />
				</fieldset>

				{wrongCode && (
					<div role="alert" className="flex items-start gap-2.5 rounded-xl bg-destructive-soft px-3.5 py-3 text-sm text-destructive">
						<AlertCircle className="mt-px size-4.5 shrink-0" strokeWidth={2.2} />
						<div>
							<strong>That code isn't right.</strong>
							<br />
							Check the email and try again, or request a new code.
						</div>
					</div>
				)}

				{sentOnce && (
					<div className="flex items-center gap-2.5 rounded-xl bg-surface-2 px-3.5 py-3">
						<Clock className="size-4.5 text-primary" />
						<span className="text-sm">
							Code expires in <strong className="text-base">{formatTime(expiresLeft)}</strong>
						</span>
					</div>
				)}

				<button
					type="submit"
					disabled={code.length !== CODE_LENGTH || isVerifying}
					className={`${authPrimaryBtn} disabled:opacity-45`}
				>
					{isVerifying && <Loader2 className="size-4.5 animate-spin" />}
					{wrongCode ? "Try again" : "Verify email"}
				</button>

				<p className="text-center text-[14.5px] text-muted-foreground">
					Didn't get it?{" "}
					{resendLeft > 0 || isSending ? (
						<span className="font-semibold">
							{isSending ? "Sending…" : `Resend in ${Math.floor(resendLeft / 60)}:${String(resendLeft % 60).padStart(2, "0")}`}
						</span>
					) : (
						<button type="button" onClick={handleSend} className={authLink}>
							Resend code
						</button>
					)}
				</p>
			</form>
		</AuthCardLayout>
	);
}
