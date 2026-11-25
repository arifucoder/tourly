import { useRegisterMutation } from "@/redux/features/auth/auth.api";
import type { TApiError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import * as z from "zod";
import AuthFieldError from "./AuthFieldError";
import AuthFormShell from "./AuthFormShell";
import { authInput, authLabel, authLink, authPrimaryBtn } from "./authStyles";
import GoogleButton from "./GoogleButton";
import OrDivider from "./OrDivider";
import PasswordInput from "./PasswordInput";
import PasswordRules from "./PasswordRules";

const formSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(2, { error: "Name must be at least 2 characters long." })
			.max(50, { error: "Name cannot exceed 50 characters." }),
		email: z.email({ error: "Enter a valid email address." }).max(100, { error: "Email cannot exceed 100 characters." }),
		password: z
			.string()
			.min(8, { error: "Password must be at least 8 characters long." })
			.regex(/[A-Z]/, { error: "Password must contain at least 1 uppercase letter." })
			.regex(/\d/, { error: "Password must contain at least 1 number." })
			.regex(/[!@#$%^&*]/, { error: "Password must contain at least 1 special character." }),
		confirmPassword: z.string().min(1, { error: "Please confirm your password." }),
		terms: z.boolean().refine(Boolean, { error: "Please accept the Terms and Privacy policy." }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		error: "Passwords don't match",
		path: ["confirmPassword"],
	});

type FormValues = z.infer<typeof formSchema>;

export default function RegistrationForm() {
	const [registerUser] = useRegisterMutation();
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: "", email: "", password: "", confirmPassword: "", terms: false },
	});

	const password = useWatch({ control, name: "password" }) ?? "";

	const onSubmit = async ({ name, email, password }: FormValues) => {
		try {
			await registerUser({ name, email, password }).unwrap();
			toast.success("Account created. Check your email for the code.");
			navigate("/verify", { state: email });
		} catch (err) {
			const error = err as TApiError;
			toast.error(
				error.data?.errorSources?.[0]?.message || error.data?.message || "Registration failed. Please try again.",
			);
		}
	};

	return (
		<AuthFormShell>
			<form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full max-w-105 flex-col gap-4.5">
				<div className="flex flex-col gap-1.5">
					<h1 className="text-[34px] font-bold tracking-[-0.02em]">Create your account</h1>
					<p className="text-muted-foreground">It takes a minute. We'll verify your email with a 6-digit code.</p>
				</div>

				<GoogleButton label="Sign up with Google" />
				<OrDivider label="or sign up with email" />

				<div>
					<label htmlFor="rg-name" className={authLabel}>
						Full name
					</label>
					<input
						{...register("name")}
						id="rg-name"
						autoComplete="name"
						placeholder="As on your NID or passport"
						aria-invalid={Boolean(errors.name)}
						className={authInput}
					/>
					<AuthFieldError message={errors.name?.message} />
				</div>

				<div>
					<label htmlFor="rg-email" className={authLabel}>
						Email
					</label>
					<input
						{...register("email")}
						id="rg-email"
						type="email"
						autoComplete="email"
						placeholder="you@example.com"
						aria-invalid={Boolean(errors.email)}
						className={authInput}
					/>
					<AuthFieldError message={errors.email?.message} />
				</div>

				<div>
					<label htmlFor="rg-pw" className={authLabel}>
						Password
					</label>
					<PasswordInput
						{...register("password")}
						id="rg-pw"
						autoComplete="new-password"
						aria-describedby="rg-rules"
						aria-invalid={Boolean(errors.password)}
					/>
					<AuthFieldError message={errors.password?.message} />
					<PasswordRules id="rg-rules" value={password} />
				</div>

				<div>
					<label htmlFor="rg-pw2" className={authLabel}>
						Confirm password
					</label>
					<PasswordInput
						{...register("confirmPassword")}
						id="rg-pw2"
						autoComplete="new-password"
						aria-invalid={Boolean(errors.confirmPassword)}
					/>
					<AuthFieldError message={errors.confirmPassword?.message} />
				</div>

				<div>
					<label className="flex cursor-pointer items-start gap-2.5 text-[14.5px]">
						<input
							{...register("terms")}
							type="checkbox"
							aria-invalid={Boolean(errors.terms)}
							className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-primary"
						/>
						<span>
							I agree to the{" "}
							<Link to="/terms" className={authLink}>
								Terms
							</Link>{" "}
							and{" "}
							<Link to="/privacy" className={authLink}>
								Privacy policy
							</Link>
						</span>
					</label>
					<AuthFieldError message={errors.terms?.message} />
				</div>

				<button type="submit" disabled={isSubmitting} className={authPrimaryBtn}>
					{isSubmitting && <Loader2 className="size-4.5 animate-spin" />}
					Create account
				</button>

				<p className="text-center text-[15px] text-muted-foreground">
					Already have an account?{" "}
					<Link to="/login" className={authLink}>
						Log in
					</Link>
				</p>
			</form>
		</AuthFormShell>
	);
}
