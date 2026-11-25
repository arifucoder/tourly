import { useLoginMutation } from "@/redux/features/auth/auth.api";
import type { TApiError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import * as z from "zod";
import AuthFieldError from "./AuthFieldError";
import AuthFormShell from "./AuthFormShell";
import { authInput, authLabel, authLink, authPrimaryBtn } from "./authStyles";
import GoogleButton from "./GoogleButton";
import OrDivider from "./OrDivider";
import PasswordInput from "./PasswordInput";

const formSchema = z.object({
	email: z.email({ error: "Enter a valid email address." }).max(100, { error: "Email cannot exceed 100 characters." }),
	password: z.string().min(1, { error: "Password is required." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginForm() {
	const [login] = useLoginMutation();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const from = (location.state as { from?: string } | null)?.from ?? "/";
	const oauthError = searchParams.get("error");

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = async (data: FormValues) => {
		try {
			await login(data).unwrap();
			toast.success("Logged in successfully");
			navigate(from, { replace: true });
		} catch (err) {
			const error = err as TApiError;

			if (error.status === 401 && error.data?.message?.toLowerCase().includes("verif")) {
				toast.error("Your account is not verified");
				navigate("/verify", { state: data.email });
				return;
			}

			toast.error(error.data?.errorSources?.[0]?.message || error.data?.message || "Login failed. Please try again.");
		}
	};

	return (
		<AuthFormShell>
			<form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full max-w-105 flex-col gap-5">
				<div className="flex flex-col gap-1.5">
					<h1 className="text-[34px] font-bold tracking-[-0.02em]">Welcome back</h1>
					<p className="text-muted-foreground">Log in to manage your bookings.</p>
				</div>

				{oauthError && (
					<p role="alert" className="flex items-start gap-2 rounded-[10px] bg-destructive-soft px-3.5 py-3 text-sm text-destructive">
						<AlertCircle className="mt-0.5 size-4 shrink-0" />
						{oauthError}
					</p>
				)}

				<GoogleButton label="Continue with Google" redirect={from} />
				<OrDivider label="or log in with email" />

				<div>
					<label htmlFor="login-email" className={authLabel}>
						Email
					</label>
					<input
						{...register("email")}
						id="login-email"
						type="email"
						autoComplete="email"
						placeholder="you@example.com"
						aria-invalid={Boolean(errors.email)}
						className={authInput}
					/>
					<AuthFieldError message={errors.email?.message} />
				</div>

				<div>
					<div className="flex items-baseline justify-between">
						<label htmlFor="login-password" className={authLabel}>
							Password
						</label>
						<Link to="/forgot-password" className={`${authLink} text-sm`}>
							Forgot password?
						</Link>
					</div>
					<PasswordInput
						{...register("password")}
						id="login-password"
						autoComplete="current-password"
						aria-invalid={Boolean(errors.password)}
					/>
					<AuthFieldError message={errors.password?.message} />
				</div>

				<button type="submit" disabled={isSubmitting} className={authPrimaryBtn}>
					{isSubmitting && <Loader2 className="size-4.5 animate-spin" />}
					Log in
				</button>

				<p className="text-center text-[15px] text-muted-foreground">
					New to Tourly?{" "}
					<Link to="/signup" state={location.state} className={authLink}>
						Create an account
					</Link>
				</p>
			</form>
		</AuthFormShell>
	);
}
