import { ErrorState } from "@/components/dashboard/States";
import { btnGhost, btnPrimary, dashCard, dashInput, help, label } from "@/components/dashboard/styles";
import {
	FormSection,
	ImagesField,
	PlanList,
	SortableList,
	type TPlanDay,
} from "@/components/modules/Admin/Tour/TourFormFields";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetDivisionsQuery } from "@/redux/features/Division/division.api";
import {
	useAddTourMutation,
	useGetSingleTourQuery,
	useGetTourTypesQuery,
	useUpdateTourMutation,
} from "@/redux/features/Tour/tour.api";
import type { ITour, TApiError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import * as z from "zod";

const today = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const optionalNumber = (message: string, min: number) =>
	z.number({ error: message }).int({ error: "Use a whole number." }).min(min, { error: `Must be ${min} or more.` }).optional();

const buildSchema = (isEdit: boolean) =>
	z
		.object({
			title: z
				.string()
				.trim()
				.min(3, { error: "Title must be at least 3 characters long." })
				.max(120, { error: "Title cannot exceed 120 characters." }),
			description: z.string().trim().min(10, { error: "Add a short description (at least 10 characters)." }),
			division: z.string().min(1, { error: "Pick a division." }),
			tourType: z.string().min(1, { error: "Pick a tour type." }),
			location: z.string().trim(),
			departureLocation: z.string().trim(),
			arrivalLocation: z.string().trim(),
			startDate: z.string().min(1, { error: "Pick a start date." }),
			endDate: z.string().min(1, { error: "Pick an end date." }),
			costFrom: z.number({ error: "Enter the price per person." }).min(0, { error: "Price can't be negative." }),
			maxGuest: optionalNumber("Enter a valid number.", 1),
			minAge: optionalNumber("Enter a valid number.", 0),
			included: z.array(z.string()),
			excluded: z.array(z.string()),
			amenities: z.array(z.string()),
			tourPlan: z.array(z.object({ title: z.string(), text: z.string() })),
		})
		.refine((data) => isEdit || !data.startDate || data.startDate >= today(), {
			error: "Start date can't be in the past.",
			path: ["startDate"],
		})
		.refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
			error: "End date must be on or after the start date.",
			path: ["endDate"],
		});

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

const FIELD_LABELS: Partial<Record<keyof FormValues, string>> = {
	title: "Title",
	description: "Description",
	division: "Division",
	tourType: "Tour type",
	startDate: "Start date",
	endDate: "End date",
	costFrom: "Price per person",
	maxGuest: "Max guests",
	minAge: "Minimum age",
};

const makeSlug = (text: string) =>
	text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");

const splitPlan = (step: string): TPlanDay => {
	const [first, ...rest] = step.split("\n");
	const text = rest.join("\n").trim();
	return text ? { title: first.trim(), text } : { title: "", text: step.trim() };
};

const joinPlan = (day: TPlanDay) => [day.title.trim(), day.text.trim()].filter(Boolean).join("\n");

const toValues = (tour?: ITour): FormValues => ({
	title: tour?.title ?? "",
	description: tour?.description ?? "",
	division: tour?.division?._id ?? "",
	tourType: tour?.tourType?._id ?? "",
	location: tour?.location ?? "",
	departureLocation: tour?.departureLocation ?? "",
	arrivalLocation: tour?.arrivalLocation ?? "",
	startDate: tour?.startDate?.slice(0, 10) ?? "",
	endDate: tour?.endDate?.slice(0, 10) ?? "",
	costFrom: tour?.costFrom as number,
	maxGuest: tour?.maxGuest,
	minAge: tour?.minAge,
	included: tour?.included ?? [],
	excluded: tour?.excluded ?? [],
	amenities: tour?.amenities ?? [],
	tourPlan: (tour?.tourPlan ?? []).map(splitPlan),
});

function Field({
	id,
	text,
	required,
	error,
	hint,
	children,
	className,
}: {
	id: string;
	text: string;
	required?: boolean;
	error?: string;
	hint?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={className}>
			<label className={label} htmlFor={id}>
				{text} {required && <span className="text-destructive">*</span>}
			</label>
			{children}
			{error ? (
				<p id={`${id}-e`} className="mt-1.5 flex items-center gap-1.5 text-[13px] text-destructive">
					<AlertCircle className="size-3.75 shrink-0" />
					{error}
				</p>
			) : (
				hint && <p className={help}>{hint}</p>
			)}
		</div>
	);
}

function TourEditor({ tour }: { tour?: ITour }) {
	const isEdit = Boolean(tour);
	const navigate = useNavigate();
	const { data: divisions = [] } = useGetDivisionsQuery();
	const { data: tourTypes = [] } = useGetTourTypesQuery();
	const [addTour, { isLoading: isAdding }] = useAddTourMutation();
	const [updateTour, { isLoading: isUpdating }] = useUpdateTourMutation();
	const isSaving = isAdding || isUpdating;

	const [files, setFiles] = useState<File[]>([]);
	const [removed, setRemoved] = useState<string[]>([]);

	const form = useForm<FormValues>({
		resolver: zodResolver(buildSchema(isEdit)),
		defaultValues: toValues(tour),
	});
	const { errors, submitCount } = form.formState;
	const title = useWatch({ control: form.control, name: "title" });
	const startDate = useWatch({ control: form.control, name: "startDate" });

	const fieldProps = (name: keyof FormValues) => ({
		id: `tf-${name}`,
		"aria-invalid": Boolean(errors[name]),
		"aria-describedby": errors[name] ? `tf-${name}-e` : undefined,
	});

	const numberField = (name: "costFrom" | "maxGuest" | "minAge") =>
		form.register(name, { setValueAs: (value) => (value === "" || value === null ? undefined : Number(value)) });

	const onSubmit = async (data: FormValues) => {
		const clean = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
		const payload = {
			...data,
			included: clean(data.included),
			excluded: clean(data.excluded),
			amenities: clean(data.amenities),
			tourPlan: data.tourPlan.map(joinPlan).filter(Boolean),
			...(isEdit && removed.length > 0 && { deleteImages: removed }),
		};
		const body = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

		const formData = new FormData();
		formData.append("data", JSON.stringify(body));
		files.forEach((file) => formData.append("files", file));

		const toastId = toast.loading(isEdit ? "Saving changes…" : "Creating tour…");
		try {
			if (tour) await updateTour({ id: tour._id, formData }).unwrap();
			else await addTour(formData).unwrap();
			toast.success(isEdit ? "Tour saved" : "Tour created", { id: toastId });
			navigate("/admin/tours");
		} catch (err) {
			const error = err as TApiError;
			toast.error("Couldn't save tour", {
				id: toastId,
				description: error.data?.errorSources?.[0]?.message || error.data?.message || "Your changes are kept — try again.",
			});
		}
	};

	const onInvalid = (invalid: FieldErrors<FormValues>) => {
		const first = Object.keys(invalid)[0];
		if (first) document.getElementById(`tf-${first}`)?.focus();
	};

	const errorKeys = Object.keys(errors) as (keyof FormValues)[];

	return (
		<form
			id="tour-form"
			noValidate
			onSubmit={form.handleSubmit(onSubmit, onInvalid)}
			className="flex w-full max-w-250 flex-col gap-5"
		>
			<div className="flex flex-col gap-1">
				<h1 className="text-[26px] leading-tight font-bold tracking-[-0.01em] sm:text-[30px]">
					{isEdit ? tour?.title : "New tour"}
				</h1>
				<p className="text-[14.5px] text-muted-foreground">
					Fields marked <span className="text-destructive">*</span> are required.
					{isEdit && " Changes go live on the public page as soon as you save."}
				</p>
			</div>

			<fieldset disabled={isSaving} className="flex flex-col gap-5 disabled:opacity-70">
				<FormSection
					id="s-img"
					title="Images"
					description="The first image is the cover. Up to 10 images · JPG, PNG or WebP · 2 MB each."
				>
					<ImagesField
						existing={tour?.images ?? []}
						removed={removed}
						files={files}
						onFilesChange={setFiles}
						onToggleRemove={(url) =>
							setRemoved((prev) => (prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]))
						}
					/>
				</FormSection>

				<FormSection id="s-basic" title="Basic information">
					<Field id="tf-title" text="Title" required error={errors.title?.message}>
						<input className={dashInput} placeholder="e.g. Sajek Valley Cloud Escape" {...form.register("title")} {...fieldProps("title")} />
					</Field>
					<Field
						id="tf-slug"
						text="Slug"
						hint={`${isEdit ? "Updated from the title when you save" : "Generated from the title"} · /tours/${makeSlug(title) || "your-tour-title"}`}
					>
						<input
							id="tf-slug"
							readOnly
							className={cn(dashInput, "bg-surface-2 text-muted-foreground")}
							value={makeSlug(title) || ""}
						/>
					</Field>
					<Field id="tf-description" text="Description" required error={errors.description?.message}>
						<textarea
							rows={5}
							className={cn(dashInput, "h-auto resize-y py-2.5")}
							placeholder="What makes this tour special…"
							{...form.register("description")}
							{...fieldProps("description")}
						/>
					</Field>
					<div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4.5">
						<Field id="tf-division" text="Division" required error={errors.division?.message}>
							<Controller
								name="division"
								control={form.control}
								render={({ field }) => (
									<select
										className={cn(dashInput, "cursor-pointer")}
										{...fieldProps("division")}
										name={field.name}
										ref={field.ref}
										value={field.value}
										onBlur={field.onBlur}
										onChange={(event) => field.onChange(event.target.value)}
									>
										<option value="">Select a division</option>
										{divisions.map((item) => (
											<option key={item._id} value={item._id}>
												{item.name}
											</option>
										))}
									</select>
								)}
							/>
						</Field>
						<Field id="tf-tourType" text="Tour type" required error={errors.tourType?.message}>
							<Controller
								name="tourType"
								control={form.control}
								render={({ field }) => (
									<select
										className={cn(dashInput, "cursor-pointer")}
										{...fieldProps("tourType")}
										name={field.name}
										ref={field.ref}
										value={field.value}
										onBlur={field.onBlur}
										onChange={(event) => field.onChange(event.target.value)}
									>
										<option value="">Select a tour type</option>
										{tourTypes.map((item) => (
											<option key={item._id} value={item._id}>
												{item.name}
											</option>
										))}
									</select>
								)}
							/>
						</Field>
						<Field id="tf-location" text="Location">
							<input className={dashInput} placeholder="e.g. Sajek Valley, Rangamati" {...form.register("location")} {...fieldProps("location")} />
						</Field>
					</div>
				</FormSection>

				<FormSection id="s-route" title="Route, dates & capacity">
					<div className="grid gap-4.5 sm:grid-cols-2">
						<Field id="tf-departureLocation" text="Departure location">
							<input className={dashInput} placeholder="e.g. Dhaka (Sayedabad)" {...form.register("departureLocation")} {...fieldProps("departureLocation")} />
						</Field>
						<Field id="tf-arrivalLocation" text="Arrival location">
							<input className={dashInput} placeholder="e.g. Sajek Valley" {...form.register("arrivalLocation")} {...fieldProps("arrivalLocation")} />
						</Field>
						<Field id="tf-startDate" text="Start date" required error={errors.startDate?.message}>
							<input
								type="date"
								min={isEdit ? undefined : today()}
								className={dashInput}
								{...form.register("startDate")}
								{...fieldProps("startDate")}
							/>
						</Field>
						<Field id="tf-endDate" text="End date" required error={errors.endDate?.message}>
							<input
								type="date"
								min={startDate || (isEdit ? undefined : today())}
								className={dashInput}
								{...form.register("endDate")}
								{...fieldProps("endDate")}
							/>
						</Field>
					</div>
					<div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4.5">
						<Field id="tf-costFrom" text="Price per person" required error={errors.costFrom?.message}>
							<div className="relative">
								<span
									aria-hidden="true"
									className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-semibold text-muted-foreground"
								>
									৳
								</span>
								<input
									type="number"
									inputMode="numeric"
									min={0}
									placeholder="7500"
									className={cn(dashInput, "pl-8")}
									{...numberField("costFrom")}
									{...fieldProps("costFrom")}
								/>
							</div>
						</Field>
						<Field id="tf-maxGuest" text="Max guests" error={errors.maxGuest?.message} hint="Seats for the whole departure.">
							<input type="number" min={1} placeholder="20" className={dashInput} {...numberField("maxGuest")} {...fieldProps("maxGuest")} />
						</Field>
						<Field id="tf-minAge" text="Minimum age" error={errors.minAge?.message}>
							<input type="number" min={0} placeholder="8" className={dashInput} {...numberField("minAge")} {...fieldProps("minAge")} />
						</Field>
					</div>
				</FormSection>

				<FormSection
					id="s-lists"
					title="Included, excluded & amenities"
					description="One item per line. Drag the handle to reorder."
				>
					<div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-5">
						<Controller
							name="included"
							control={form.control}
							render={({ field }) => (
								<SortableList legend="Included" placeholder="e.g. AC bus ticket" value={field.value} onChange={field.onChange} />
							)}
						/>
						<Controller
							name="excluded"
							control={form.control}
							render={({ field }) => (
								<SortableList legend="Excluded" placeholder="e.g. Personal expenses" value={field.value} onChange={field.onChange} />
							)}
						/>
						<Controller
							name="amenities"
							control={form.control}
							render={({ field }) => (
								<SortableList legend="Amenities" placeholder="e.g. Wi-Fi" value={field.value} onChange={field.onChange} />
							)}
						/>
					</div>
				</FormSection>

				<FormSection id="s-plan" title="Tour plan" description="One entry per day, shown as a timeline on the tour page.">
					<Controller
						name="tourPlan"
						control={form.control}
						render={({ field }) => <PlanList value={field.value} onChange={field.onChange} />}
					/>
				</FormSection>
			</fieldset>

			<div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-page/95 px-4 py-3.5 backdrop-blur sm:-mx-8 sm:px-8">
				{submitCount > 0 && errorKeys.length > 0 ? (
					<p role="alert" className="flex items-center gap-2 text-sm font-semibold text-destructive">
						<AlertCircle className="size-4.5 shrink-0" />
						Fix {errorKeys.length} error{errorKeys.length === 1 ? "" : "s"} before saving
						<span className="hidden font-normal text-muted-foreground md:inline">
							· {errorKeys.map((key) => FIELD_LABELS[key] ?? key).join(", ")}
						</span>
					</p>
				) : (
					<span />
				)}
				<div className="flex gap-2.5">
					<Link to="/admin/tours" className={cn(btnGhost, isSaving && "pointer-events-none opacity-50")}>
						Cancel
					</Link>
					<button type="submit" className={cn(btnPrimary, "min-w-36")} disabled={isSaving}>
						{isSaving ? (
							<>
								<Loader2 className="animate-spin" />
								Saving…
							</>
						) : isEdit ? (
							"Save changes"
						) : (
							"Create tour"
						)}
					</button>
				</div>
			</div>
		</form>
	);
}

export default function TourFormPage() {
	const { slug } = useParams();
	const { data: tour, isLoading, isError, refetch } = useGetSingleTourQuery(slug ?? "", { skip: !slug });

	if (!slug) return <TourEditor />;

	if (isLoading) {
		return (
			<div className="flex w-full max-w-250 flex-col gap-5" aria-busy="true" aria-label="Loading tour">
				<Skeleton className="h-9 w-80" />
				<Skeleton className="h-56 rounded-xl" />
				<Skeleton className="h-96 rounded-xl" />
			</div>
		);
	}

	if (isError || !tour) {
		return (
			<div className={cn(dashCard, "max-w-250")}>
				<ErrorState title="Couldn't load this tour" onRetry={refetch} />
			</div>
		);
	}

	return <TourEditor key={tour._id} tour={tour} />;
}
