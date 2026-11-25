import FormField from "@/components/dashboard/FormField";
import PageHeader from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/dashboard/StatusBadge";
import { roleLabel } from "@/components/dashboard/status";
import { btnGhost, btnPrimary, dashCard, dashInput } from "@/components/dashboard/styles";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, initials } from "@/lib/format";
import { isValidPhone, normalizePhone, PHONE_ERROR } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { useUserInfoQuery } from "@/redux/features/auth/auth.api";
import { useUpdateMeMutation } from "@/redux/features/User/user.api";
import type { IMe, TApiError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const MAX_SIZE = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg"];

const formSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, { error: "Name must be at least 2 characters long." })
		.max(50, { error: "Name cannot exceed 50 characters." }),
	phone: z
		.string()
		.trim()
		.refine((value) => !value || isValidPhone(value), { error: PHONE_ERROR }),
	address: z.string().trim().max(200, { error: "Address cannot exceed 200 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

const signIn = (methods: IMe["signInMethods"] = []) =>
	methods.length
		? methods.map((method) => (method === "google" ? "Google" : "Email & password")).join(" · ")
		: "—";

function Avatar({ name, src, size }: { name: string; src?: string | null; size: "md" | "lg" }) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-semibold text-accent-foreground",
				size === "lg" ? "size-18 text-xl" : "size-14 text-base",
			)}
		>
			{src ? <img src={src} alt="" className="size-full object-cover" /> : initials(name)}
		</span>
	);
}

function ProfileForm({ me }: { me: IMe }) {
	const [updateMe, { isLoading }] = useUpdateMeMutation();
	const [picture, setPicture] = useState<File | null>(null);
	const [pictureError, setPictureError] = useState<string | null>(null);
	const [inputKey, setInputKey] = useState(0);

	const preview = useMemo(() => (picture ? URL.createObjectURL(picture) : null), [picture]);
	useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

	const defaults = { name: me.name ?? "", phone: me.phone ?? "", address: me.address ?? "" };
	const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: defaults });
	const { errors, isDirty } = form.formState;

	const pickPicture = (file?: File) => {
		if (!file) return;
		if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_SIZE) {
			setPictureError("Use a JPG or PNG up to 2 MB.");
			return;
		}
		setPictureError(null);
		setPicture(file);
	};

	const clearPicture = () => {
		setPicture(null);
		setInputKey((key) => key + 1);
	};

	const onSubmit = async (data: FormValues) => {
		const formData = new FormData();
		formData.append("name", data.name);
		if (data.phone) formData.append("phone", normalizePhone(data.phone));
		formData.append("address", data.address);
		if (picture) formData.append("picture", picture);

		const toastId = toast.loading("Saving…");
		try {
			await updateMe(formData).unwrap();
			toast.success("Profile updated", { id: toastId });
			clearPicture();
			form.reset({ ...data, phone: data.phone ? normalizePhone(data.phone) : "" });
		} catch (err) {
			const error = err as TApiError;
			toast.error(error.data?.errorSources?.[0]?.message || error.data?.message || "Couldn't save your profile", {
				id: toastId,
			});
		}
	};

	const fieldProps = (name: keyof FormValues) => ({
		id: `p-${name}`,
		"aria-invalid": Boolean(errors[name]),
		"aria-describedby": errors[name] ? `p-${name}-e` : undefined,
	});

	return (
		<form
			aria-label="Edit profile"
			noValidate
			onSubmit={form.handleSubmit(onSubmit)}
			className={cn(dashCard, "flex min-w-0 flex-col gap-5 p-5.5")}
		>
			<h2 className="text-lg font-bold">Edit details</h2>

			<div>
				<span className="mb-1.5 block text-sm font-semibold">Profile picture</span>
				<div className="flex flex-wrap items-center gap-4">
					<div className="relative">
						<Avatar name={me.name} src={preview ?? me.picture} size="md" />
						{picture && (
							<button
								type="button"
								onClick={clearPicture}
								aria-label="Remove new picture"
								className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-foreground text-background"
							>
								<X className="size-3.5" />
							</button>
						)}
					</div>
					<label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-[10px] border-[1.5px] border-dashed border-border px-4 py-3 transition-colors hover:border-primary hover:bg-accent">
						<ImagePlus aria-hidden="true" className="size-5 shrink-0 text-primary-text" />
						<span className="flex min-w-0 flex-col">
							<strong className="text-sm">Upload a new photo</strong>
							<span className="truncate text-[12.5px] text-muted-foreground">
								JPG or PNG, up to 2 MB{picture && ` · ${picture.name} selected`}
							</span>
						</span>
						<input
							key={inputKey}
							type="file"
							accept="image/png,image/jpeg"
							className="sr-only"
							onChange={(event) => pickPicture(event.target.files?.[0])}
						/>
					</label>
				</div>
				{pictureError && <p className="mt-1.5 text-[13px] text-destructive">{pictureError}</p>}
			</div>

			<div className="grid gap-4.5 sm:grid-cols-2">
				<FormField id="p-name" text="Full name" required error={errors.name?.message} className="sm:col-span-2">
					<input className={dashInput} autoComplete="name" {...form.register("name")} {...fieldProps("name")} />
				</FormField>
				<FormField id="p-email" text="Email" hint="Email can't be changed.">
					<input id="p-email" className={cn(dashInput, "bg-surface-2 text-muted-foreground")} value={me.email} readOnly />
				</FormField>
				<FormField
					id="p-phone"
					text="Phone"
					error={errors.phone?.message}
					hint={
						me.role === "GUIDE"
							? "Travellers on your trips can call you on this number."
							: "Needed to book a tour. Your guide uses it to reach you."
					}
				>
					<input
						className={dashInput}
						inputMode="tel"
						autoComplete="tel"
						placeholder="01712345678 or +8801712345678"
						{...form.register("phone")}
						{...fieldProps("phone")}
					/>
				</FormField>
			</div>

			<FormField id="p-address" text="Address" error={errors.address?.message}>
				<textarea
					rows={3}
					className={cn(dashInput, "h-auto resize-y py-2.5")}
					placeholder="House, road, area, city"
					autoComplete="street-address"
					{...form.register("address")}
					{...fieldProps("address")}
				/>
			</FormField>

			<div className="flex justify-end gap-2.5">
				<button
					type="button"
					className={btnGhost}
					disabled={isLoading || (!isDirty && !picture)}
					onClick={() => {
						form.reset(defaults);
						clearPicture();
					}}
				>
					Cancel
				</button>
				<button type="submit" className={btnPrimary} disabled={isLoading || (!isDirty && !picture)}>
					Save changes
				</button>
			</div>
		</form>
	);
}

export default function Profile() {
	const { data, isLoading } = useUserInfoQuery(undefined);
	const me = data?.data as IMe | undefined;

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title="Profile"
				description={
					me?.role === "GUIDE"
						? "Admins and your travellers use these details to reach you."
						: "Your guide uses these details to reach you before a trip."
				}
			/>

			{isLoading || !me ? (
				<div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]" aria-busy="true">
					<Skeleton className="h-80 rounded-xl" />
					<Skeleton className="h-120 rounded-xl" />
				</div>
			) : (
				<div className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
					<section aria-label="Profile summary" className={cn(dashCard, "flex flex-col gap-4 p-5.5")}>
						<div className="flex flex-col items-start gap-3">
							<Avatar name={me.name} src={me.picture} size="lg" />
							<div className="min-w-0">
								<h2 className="truncate text-lg font-bold">{me.name}</h2>
								<p className="truncate text-[14px] text-muted-foreground">{me.email}</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Badge tone="neutral">{roleLabel[me.role]}</Badge>
								{me.isVerified && (
									<Badge tone="success" dot>
										Email verified
									</Badge>
								)}
							</div>
						</div>
						<dl className="flex flex-col">
							{(
								[
									["Phone", me.phone || "Not added yet"],
									["Address", me.address || "Not added yet"],
									["Member since", formatDate(me.createdAt, { month: "long", year: "numeric" })],
									["Sign-in method", signIn(me.signInMethods)],
								] as const
							).map(([k, v], i) => (
								<div
									key={k}
									className={cn("flex justify-between gap-4 py-2.5 text-[14.5px]", i < 3 && "border-b border-border")}
								>
									<dt className="shrink-0 text-muted-foreground">{k}</dt>
									<dd
										className={cn(
											"min-w-0 text-right font-semibold break-words",
											v === "Not added yet" && "font-normal text-muted-foreground",
										)}
									>
										{v}
									</dd>
								</div>
							))}
						</dl>
					</section>

					<ProfileForm key={`${me._id}-${me.name}-${me.phone}-${me.address}`} me={me} />
				</div>
			)}
		</div>
	);
}
