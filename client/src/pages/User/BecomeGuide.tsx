import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import FormField from "@/components/dashboard/FormField";
import PageHeader from "@/components/dashboard/PageHeader";
import { ApplicationStatusBadge } from "@/components/dashboard/StatusBadge";
import { btnDangerGhost, btnPrimary, btnSm, dashCard, dashInput } from "@/components/dashboard/styles";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { useGetDivisionsQuery } from "@/redux/features/Division/division.api";
import {
	useApplyAsGuideMutation,
	useGetMyGuideApplicationsQuery,
	useWithdrawGuideApplicationMutation,
} from "@/redux/features/GuideApplication/guideApplication.api";
import type { IGuideApplication, IMe, TApiError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Clock3, Phone, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
	division: z.string().min(1, { error: "Pick the division you know best." }),
	experienceYears: z
		.number({ error: "Enter your years of experience." })
		.int({ error: "Use whole years." })
		.min(0, { error: "Can't be negative." })
		.max(60, { error: "That seems too high." }),
	languages: z.array(z.string()).max(10, { error: "List at most 10 languages." }),
	message: z
		.string()
		.trim()
		.min(30, { error: "Please write at least 30 characters." })
		.max(1000, { error: "Keep it under 1000 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS = [
	{ title: "Apply", text: "Tell us the division you know and why you'd be a great guide." },
	{ title: "Admin review", text: "We check your details and email you the result." },
	{ title: "Lead trips", text: "Once approved, you're assigned to paid bookings in your division." },
];

function LanguagesInput({
	value,
	onChange,
	invalid,
}: {
	value: string[];
	onChange: (items: string[]) => void;
	invalid?: boolean;
}) {
	const [draft, setDraft] = useState("");

	const add = () => {
		const items = draft
			.split(",")
			.map((item) => item.trim())
			.filter((item) => item.length >= 2 && !value.some((v) => v.toLowerCase() === item.toLowerCase()));
		if (items.length) onChange([...value, ...items].slice(0, 10));
		setDraft("");
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" || event.key === ",") {
			event.preventDefault();
			add();
		} else if (event.key === "Backspace" && !draft && value.length) {
			onChange(value.slice(0, -1));
		}
	};

	return (
		<div
			className={cn(
				dashInput,
				"flex h-auto min-h-11 flex-wrap items-center gap-1.5 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40",
				invalid && "border-destructive",
			)}
		>
			{value.map((item) => (
				<span
					key={item}
					className="inline-flex items-center gap-1 rounded-full bg-accent py-0.5 pr-1 pl-2.5 text-[13px] font-semibold text-accent-foreground"
				>
					{item}
					<button
						type="button"
						aria-label={`Remove ${item}`}
						onClick={() => onChange(value.filter((v) => v !== item))}
						className="flex size-5 items-center justify-center rounded-full hover:bg-card"
					>
						<X className="size-3" />
					</button>
				</span>
			))}
			<input
				id="g-languages"
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				onKeyDown={onKeyDown}
				onBlur={add}
				placeholder={value.length ? "Add another" : "e.g. Bangla, English"}
				className="min-w-28 flex-1 bg-transparent py-1 outline-none placeholder:text-muted-foreground"
			/>
		</div>
	);
}

function ApplicationCard({ application }: { application: IGuideApplication }) {
	const [withdraw, { isLoading }] = useWithdrawGuideApplicationMutation();

	const onWithdraw = async () => {
		const toastId = toast.loading("Withdrawing…");
		try {
			await withdraw(application._id).unwrap();
			toast.success("Application withdrawn", { id: toastId });
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't withdraw", { id: toastId });
		}
	};

	return (
		<li className="flex flex-col gap-2 border-t border-border pt-3.5 first:border-0 first:pt-0">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<strong>{application.division.name}</strong>
				<ApplicationStatusBadge status={application.status} />
			</div>
			<p className="text-[13px] text-muted-foreground">
				Applied {formatDate(application.createdAt)}
				{application.reviewedAt && ` · reviewed ${formatDate(application.reviewedAt)}`}
			</p>
			{application.reviewNote && (
				<p className="rounded-[10px] bg-surface-2 px-3 py-2 text-[13.5px]">“{application.reviewNote}”</p>
			)}
			{application.status === "PENDING" && (
				<DeleteConfirmation
					title="Withdraw this application?"
					description="You can apply again later."
					confirmText="Withdraw"
					onConfirm={onWithdraw}
				>
					<button type="button" className={cn(btnDangerGhost, btnSm, "w-fit")} disabled={isLoading}>
						Withdraw
					</button>
				</DeleteConfirmation>
			)}
		</li>
	);
}

function ApplyForm({ me }: { me: IMe }) {
	const { data: divisions = [] } = useGetDivisionsQuery();
	const [apply] = useApplyAsGuideMutation();
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { division: "", experienceYears: undefined, languages: [], message: "" },
	});
	const { errors, isSubmitting } = form.formState;
	const message = form.watch("message") ?? "";
	const hasPhone = Boolean(me.phone);

	const onSubmit = async (data: FormValues) => {
		try {
			await apply(data).unwrap();
			toast.success("Application sent", { description: "We'll email you once an admin reviews it." });
			form.reset();
		} catch (err) {
			const error = err as TApiError;
			toast.error(error.data?.errorSources?.[0]?.message || error.data?.message || "Couldn't send your application");
		}
	};

	return (
		<form
			noValidate
			aria-label="Guide application"
			onSubmit={form.handleSubmit(onSubmit)}
			className={cn(dashCard, "flex min-w-0 flex-col gap-5 p-5.5")}
		>
			<div>
				<h2 className="text-lg font-bold">Apply to guide</h2>
				<p className="text-[14px] text-muted-foreground">Fields marked * are required.</p>
			</div>

			{!hasPhone && (
				<p className="flex items-start gap-2.5 rounded-[10px] bg-warning-soft px-3.5 py-3 text-[14px] text-warning">
					<Phone className="mt-0.5 size-4 shrink-0" />
					<span>
						Add a phone number to your profile first — admins and travellers use it to reach you.{" "}
						<Link to="/user/profile" className="font-semibold underline">
							Go to profile
						</Link>
					</span>
				</p>
			)}

			<div className="grid gap-4.5 sm:grid-cols-2">
				<FormField id="g-division" text="Division" required error={errors.division?.message}>
					<select
						id="g-division"
						className={cn(dashInput, "cursor-pointer")}
						aria-invalid={Boolean(errors.division)}
						{...form.register("division")}
					>
						<option value="">Select a division</option>
						{divisions.map((division) => (
							<option key={division._id} value={division._id}>
								{division.name}
							</option>
						))}
					</select>
				</FormField>
				<FormField id="g-exp" text="Years of experience" required error={errors.experienceYears?.message}>
					<input
						id="g-exp"
						type="number"
						min={0}
						max={60}
						inputMode="numeric"
						placeholder="e.g. 3"
						className={dashInput}
						aria-invalid={Boolean(errors.experienceYears)}
						{...form.register("experienceYears", {
							setValueAs: (value) => (value === "" || value === null ? undefined : Number(value)),
						})}
					/>
				</FormField>
			</div>

			<FormField
				id="g-languages"
				text="Languages you can guide in"
				error={errors.languages?.message}
				hint="Press Enter or comma after each language."
			>
				<Controller
					name="languages"
					control={form.control}
					render={({ field, fieldState }) => (
						<LanguagesInput value={field.value} onChange={field.onChange} invalid={fieldState.invalid} />
					)}
				/>
			</FormField>

			<FormField
				id="g-message"
				text="Why would you be a great guide?"
				required
				error={errors.message?.message}
				aside={<span className="text-[12.5px] text-muted-foreground tabular-nums">{message.trim().length}/1000</span>}
			>
				<textarea
					id="g-message"
					rows={6}
					maxLength={1000}
					placeholder="Places you know well, trips you've led, first aid, anything that helps travellers trust you."
					className={cn(dashInput, "h-auto resize-y py-2.5")}
					aria-invalid={Boolean(errors.message)}
					{...form.register("message")}
				/>
			</FormField>

			<div className="flex justify-end">
				<button type="submit" className={btnPrimary} disabled={isSubmitting || !hasPhone}>
					<BadgeCheck />
					Send application
				</button>
			</div>
		</form>
	);
}

export default function BecomeGuide() {
	const { data: meData, isLoading: meLoading } = useUserInfoQuery(undefined);
	const { data: applications = [], isLoading } = useGetMyGuideApplicationsQuery();
	const me = meData?.data as IMe | undefined;
	const pending = applications.find((application) => application.status === "PENDING");

	return (
		<div className="flex flex-col gap-5">
			<PageHeader title="Become a guide" description="Lead trips in the division you know best." />

			<div className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
				<div className="flex flex-col gap-5">
					<section className={cn(dashCard, "flex flex-col gap-4 p-5.5")}>
						<h2 className="text-base font-semibold">How it works</h2>
						<ol className="flex flex-col gap-3.5">
							{STEPS.map((step, i) => (
								<li key={step.title} className="flex gap-3">
									<span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground">
										{i + 1}
									</span>
									<div>
										<strong className="block text-[14.5px]">{step.title}</strong>
										<span className="text-[13.5px] text-muted-foreground">{step.text}</span>
									</div>
								</li>
							))}
						</ol>
					</section>

					{applications.length > 0 && (
						<section className={cn(dashCard, "flex flex-col gap-3.5 p-5.5")}>
							<h2 className="text-base font-semibold">Your applications</h2>
							<ul className="flex flex-col gap-3.5">
								{applications.map((application) => (
									<ApplicationCard key={application._id} application={application} />
								))}
							</ul>
						</section>
					)}
				</div>

				{isLoading || meLoading || !me ? (
					<Skeleton className="h-120 rounded-xl" aria-busy="true" />
				) : pending ? (
					<section className={cn(dashCard, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
						<span className="flex size-16 items-center justify-center rounded-2xl bg-warning-soft text-warning">
							<Clock3 className="size-7" />
						</span>
						<h2 className="text-lg font-bold">Your application is under review</h2>
						<p className="max-w-sm text-[14.5px] text-muted-foreground">
							You applied for {pending.division.name} on {formatDate(pending.createdAt)}. We'll email {me.email} with the
							result.
						</p>
					</section>
				) : (
					<ApplyForm me={me} />
				)}
			</div>
		</div>
	);
}
