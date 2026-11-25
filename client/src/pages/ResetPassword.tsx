import AuthCardLayout from "@/components/layout/AuthCardLayout";
import AuthFieldError from "@/components/modules/Authentication/AuthFieldError";
import { authLabel, authLink, authPrimaryBtn, authTitle } from "@/components/modules/Authentication/authStyles";
import IconBubble from "@/components/modules/Authentication/IconBubble";
import PasswordInput from "@/components/modules/Authentication/PasswordInput";
import PasswordRules from "@/components/modules/Authentication/PasswordRules";
import { useResetPasswordMutation } from "@/redux/features/auth/auth.api";
import type { TApiError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2Off, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z
	.object({
		newPassword: z
			.string()
			.min(8, { error: "Password must be at least 8 characters long." })
			.regex(/[A-Z]/, { error: "Password must contain at least 1 uppercase letter." })
			.regex(/\d/, { error: "Password must contain at least 1 number." })
			.regex(/[!@#$%^&*]/, { error: "Password must contain at least 1 special character." }),
		confirmPassword: z.string().min(1, { error: "Please confirm your new password." }),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		error: "Passwords don't match",
		path: ["confirmPassword"],
	});

type FormValues = z.infer<typeof formSchema>;

const isTokenExpired = (token: string) => {
	try {
		const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
		return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
	} catch {
		return true;
	}
};

export default function ResetPassword() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const id = searchParams.get("id") ?? "";
	const token = searchParams.get("token") ?? "";

	const [resetPassword, { isLoading }] = useResetPasswordMutation();
	const [linkInvalid, setLinkInvalid] = useState(() => !id || !token || isTokenExpired(token));

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { newPassword: "", confirmPassword: "" },
	});
	const newPassword = useWatch({ control, name: "newPassword" }) ?? "";

	const onSubmit = async ({ newPassword }: FormValues) => {
		try {
			await resetPassword({ id, token, newPassword }).unwrap();
			toast.success("Password updated. Log in with your new password.");
			navigate("/login", { replace: true });
		} catch (err) {
			const error = err as TApiError;
			if (error.status === 401) {
				setLinkInvalid(true);
				return;
			}
			toast.error(error.data?.errorSources?.[0]?.message || error.data?.message || "Couldn't reset password.");
		}
	};

	if (linkInvalid) {
		return (
			<AuthCardLayout centered>
				<IconBubble tone="danger" size="lg">
					<Link2Off />
				</IconBubble>
				<h1 className={authTitle}>This link has expired</h1>
				<p className="text-[15px] text-muted-foreground">
					Reset links work once and only for 10 minutes. Request a fresh one to continue.
				</p>
				<Link to="/forgot-password" className={authPrimaryBtn}>
					Request a new link
				</Link>
				<Link to="/login" className={`${authLink} text-[14.5px]`}>
					Back to log in
				</Link>
			</AuthCardLayout>
		);
	}

	return (
		<AuthCardLayout>
			<form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
				<div className="flex flex-col gap-1.5">
					<h1 className={authTitle}>Set a new password</h1>
					<p className="text-[15px] text-muted-foreground">Choose a strong password you haven't used here before.</p>
				</div>
				<div>
					<label htmlFor="reset-pw" className={authLabel}>
						New password
					</label>
					<PasswordInput
						{...register("newPassword")}
						id="reset-pw"
						autoComplete="new-password"
						aria-describedby="reset-rules"
						aria-invalid={Boolean(errors.newPassword)}
					/>
					<AuthFieldError message={errors.newPassword?.message} />
					<PasswordRules id="reset-rules" value={newPassword} />
				</div>
				<div>
					<label htmlFor="reset-pw2" className={authLabel}>
						Confirm new password
					</label>
					<PasswordInput
						{...register("confirmPassword")}
						id="reset-pw2"
						autoComplete="new-password"
						aria-invalid={Boolean(errors.confirmPassword)}
					/>
					<AuthFieldError message={errors.confirmPassword?.message} />
				</div>
				<button type="submit" disabled={isLoading} className={authPrimaryBtn}>
					{isLoading && <Loader2 className="size-4.5 animate-spin" />}
					Reset password
				</button>
			</form>
		</AuthCardLayout>
	);
}
