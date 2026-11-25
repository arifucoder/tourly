import FormField from "@/components/dashboard/FormField";
import PageHeader from "@/components/dashboard/PageHeader";
import { btnPrimary, dashCard } from "@/components/dashboard/styles";
import PasswordInput from "@/components/modules/Authentication/PasswordInput";
import PasswordRules, { passwordRules } from "@/components/modules/Authentication/PasswordRules";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useChangePasswordMutation, useSetPasswordMutation, useUserInfoQuery } from "@/redux/features/auth/auth.api";
import type { IMe, TApiError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import * as z from "zod";

const strongPassword = z
	.string()
	.max(128, { error: "Password cannot exceed 128 characters." })
	.refine((value) => passwordRules.every((rule) => rule.test(value)), {
		error: "Use 8+ characters with an uppercase letter, a number and a special character.",
	});

const changeSchema = z
	.object({
		oldPassword: z.string().min(1, { error: "Enter your current password." }),
		newPassword: strongPassword,
		confirm: z.string(),
	})
	.refine((data) => data.newPassword === data.confirm, { error: "Passwords don't match.", path: ["confirm"] })
	.refine((data) => data.oldPassword !== data.newPassword, {
		error: "New password must be different from the current one.",
		path: ["newPassword"],
	});

const setSchema = z
	.object({ password: strongPassword, confirm: z.string() })
	.refine((data) => data.password === data.confirm, { error: "Passwords don't match.", path: ["confirm"] });

type TChange = z.infer<typeof changeSchema>;
type TSet = z.infer<typeof setSchema>;

const errorMessage = (err: unknown, fallback: string) => {
	const error = err as TApiError;
	return error.data?.errorSources?.[0]?.message || error.data?.message || fallback;
};

function ChangePasswordForm() {
	const [changePassword] = useChangePasswordMutation();
	const form = useForm<TChange>({
		resolver: zodResolver(changeSchema),
		defaultValues: { oldPassword: "", newPassword: "", confirm: "" },
	});
	const { errors, isSubmitting } = form.formState;
	const newPassword = form.watch("newPassword");

	const onSubmit = async ({ oldPassword, newPassword }: TChange) => {
		try {
			await changePassword({ oldPassword, newPassword }).unwrap();
			toast.success("Password updated");
			form.reset();
		} catch (err) {
			const message = errorMessage(err, "Couldn't update your password");
			if (/old password|current password|does not match/i.test(message)) {
				form.setError("oldPassword", { message: "Current password is incorrect." });
			} else toast.error(message);
		}
	};

	return (
		<form noValidate onSubmit={form.handleSubmit(onSubmit)} className={cn(dashCard, "flex flex-col gap-4.5 p-5.5")}>
			<div>
				<h2 className="text-lg font-bold">Change password</h2>
				<p className="text-[14px] text-muted-foreground">You'll stay logged in on this device.</p>
			</div>
			<FormField id="s-old" text="Current password" error={errors.oldPassword?.message}>
				<PasswordInput
					id="s-old"
					autoComplete="current-password"
					aria-invalid={Boolean(errors.oldPassword)}
					{...form.register("oldPassword")}
				/>
			</FormField>
			<FormField id="s-new" text="New password" error={errors.newPassword?.message}>
				<PasswordInput
					id="s-new"
					autoComplete="new-password"
					aria-invalid={Boolean(errors.newPassword)}
					aria-describedby="s-rules"
					{...form.register("newPassword")}
				/>
				<PasswordRules id="s-rules" value={newPassword} />
			</FormField>
			<FormField id="s-new2" text="Confirm new password" error={errors.confirm?.message}>
				<PasswordInput
					id="s-new2"
					autoComplete="new-password"
					aria-invalid={Boolean(errors.confirm)}
					{...form.register("confirm")}
				/>
			</FormField>
			<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
				<Link to="/forgot-password" className="text-sm font-semibold text-primary-text hover:underline">
					Forgot current password?
				</Link>
				<button type="submit" className={btnPrimary} disabled={isSubmitting}>
					Update password
				</button>
			</div>
		</form>
	);
}

function SetPasswordForm({ email }: { email: string }) {
	const [setPassword] = useSetPasswordMutation();
	const form = useForm<TSet>({ resolver: zodResolver(setSchema), defaultValues: { password: "", confirm: "" } });
	const { errors, isSubmitting } = form.formState;
	const password = form.watch("password");

	const onSubmit = async ({ password }: TSet) => {
		try {
			await setPassword({ password }).unwrap();
			toast.success("Password set", { description: "You can now log in with your email too." });
		} catch (err) {
			toast.error(errorMessage(err, "Couldn't set your password"));
		}
	};

	return (
		<form noValidate onSubmit={form.handleSubmit(onSubmit)} className={cn(dashCard, "flex flex-col gap-4.5 p-5.5")}>
			<div>
				<h2 className="text-lg font-bold">Set a password</h2>
				<p className="text-[14px] text-muted-foreground">Optional — lets you log in with email too.</p>
			</div>
			<div className="flex items-start gap-3 rounded-[10px] bg-surface-2 px-3.5 py-3 text-[14px]">
				<span
					aria-hidden="true"
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card font-bold text-info"
				>
					G
				</span>
				<span>
					You signed up with Google as <strong>{email}</strong>. You can keep using Google — a password is just a
					backup.
				</span>
			</div>
			<FormField id="g-new" text="New password" error={errors.password?.message}>
				<PasswordInput
					id="g-new"
					autoComplete="new-password"
					placeholder="At least 8 characters"
					aria-invalid={Boolean(errors.password)}
					aria-describedby="g-rules"
					{...form.register("password")}
				/>
				<PasswordRules id="g-rules" value={password} />
			</FormField>
			<FormField id="g-new2" text="Confirm password" error={errors.confirm?.message}>
				<PasswordInput
					id="g-new2"
					autoComplete="new-password"
					aria-invalid={Boolean(errors.confirm)}
					{...form.register("confirm")}
				/>
			</FormField>
			<div className="flex justify-end pt-1">
				<button type="submit" className={btnPrimary} disabled={isSubmitting}>
					Set password
				</button>
			</div>
		</form>
	);
}

export default function Security() {
	const { data, isLoading } = useUserInfoQuery(undefined);
	const me = data?.data as IMe | undefined;
	const usesGoogle = me?.signInMethods?.includes("google");

	return (
		<div className="flex w-full max-w-170 flex-col gap-5">
			<PageHeader title="Security" description="Manage how you sign in to Tourly." />

			{isLoading || !me ? (
				<Skeleton className="h-110 rounded-xl" aria-busy="true" />
			) : me.hasPassword ? (
				<ChangePasswordForm />
			) : (
				<SetPasswordForm email={me.email} />
			)}

			{me && (
				<section className={cn(dashCard, "flex flex-col gap-2 p-5.5")}>
					<h2 className="text-base font-semibold">Sign-in methods</h2>
					<ul className="flex flex-col gap-1.5 text-[14.5px]">
						<li className="flex justify-between gap-3">
							<span>Email &amp; password</span>
							<span className={me.hasPassword ? "font-semibold text-success" : "text-muted-foreground"}>
								{me.hasPassword ? "On" : "Not set"}
							</span>
						</li>
						<li className="flex justify-between gap-3">
							<span>Google</span>
							<span className={usesGoogle ? "font-semibold text-success" : "text-muted-foreground"}>
								{usesGoogle ? "Connected" : "Not connected"}
							</span>
						</li>
					</ul>
				</section>
			)}
		</div>
	);
}
