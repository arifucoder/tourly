import { btnGhost, btnPrimary, dashInput, help, label } from "@/components/dashboard/styles";
import ImageUploader from "@/components/ui/image-uploader";
import { cn } from "@/lib/utils";
import { useAddDivisionMutation, useUpdateDivisionMutation } from "@/redux/features/Division/division.api";
import type { IDivision, TApiError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const MAX_SIZE = 1 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const formSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, { error: "Name must be at least 2 characters long." })
		.max(50, { error: "Name cannot exceed 50 characters." }),
	description: z.string().trim().max(300, { error: "Description cannot exceed 300 characters." }).optional(),
	thumbnail: z
		.instanceof(File)
		.refine((file) => IMAGE_TYPES.includes(file.type), { error: "Only PNG, JPG or WEBP allowed." })
		.refine((file) => file.size <= MAX_SIZE, { error: "Image must be 1 MB or smaller." })
		.optional(),
});

type FormValues = z.infer<typeof formSchema>;

const makeSlug = (text: string) =>
	text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");

function ErrorText({ id, message }: { id: string; message?: string }) {
	if (!message) return null;
	return (
		<p id={id} className="mt-1.5 flex items-center gap-1.5 text-[13px] text-destructive">
			<AlertCircle className="size-3.75 shrink-0" />
			{message}
		</p>
	);
}

export default function DivisionForm({ division, onDone }: { division: IDivision | null; onDone: () => void }) {
	const isEdit = Boolean(division);
	const [addDivision, { isLoading: isAdding }] = useAddDivisionMutation();
	const [updateDivision, { isLoading: isUpdating }] = useUpdateDivisionMutation();
	const isSaving = isAdding || isUpdating;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: division?.name ?? "", description: division?.description ?? "", thumbnail: undefined },
	});
	const { errors } = form.formState;
	const name = form.watch("name");

	const onSubmit = async (data: FormValues) => {
		const formData = new FormData();
		const payload = isEdit
			? { name: data.name, description: data.description }
			: { name: data.name, slug: makeSlug(data.name), description: data.description };
		formData.append("data", JSON.stringify(payload));
		if (data.thumbnail) formData.append("file", data.thumbnail);

		const toastId = toast.loading(isEdit ? "Saving division…" : "Creating division…");
		try {
			if (division) await updateDivision({ id: division._id, formData }).unwrap();
			else await addDivision(formData).unwrap();
			toast.success(isEdit ? "Division saved" : "Division created", { id: toastId });
			onDone();
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't save the division", { id: toastId });
		}
	};

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			noValidate
			className="flex flex-col gap-4"
		>
			<fieldset disabled={isSaving} className="flex flex-col gap-4 disabled:opacity-60">
				<div>
					<span className={label}>Thumbnail</span>
					<Controller
						name="thumbnail"
						control={form.control}
						render={({ field, fieldState }) => (
							<ImageUploader
								id="dv-thumb"
								value={field.value ?? division?.thumbnail ?? null}
								onChange={field.onChange}
								onBlur={field.onBlur}
								invalid={fieldState.invalid}
								removable={Boolean(field.value)}
								hint="PNG, JPG or WEBP · max 1 MB"
							/>
						)}
					/>
					<ErrorText id="dv-thumb-e" message={errors.thumbnail?.message} />
					<p className={help}>Shown on the home page and the division banner. 1600 × 900 px recommended.</p>
				</div>

				<div>
					<label className={label} htmlFor="dv-name">
						Name
					</label>
					<input
						id="dv-name"
						className={dashInput}
						aria-invalid={Boolean(errors.name)}
						aria-describedby={errors.name ? "dv-name-e" : undefined}
						{...form.register("name")}
					/>
					<ErrorText id="dv-name-e" message={errors.name?.message} />
				</div>

				<div>
					<label className={label} htmlFor="dv-slug">
						Slug
					</label>
					<input
						id="dv-slug"
						className={cn(dashInput, "bg-surface-2 text-muted-foreground")}
						value={division?.slug ?? makeSlug(name || "")}
						readOnly
					/>
					<p className={help}>{isEdit ? "Set when the division was created." : "Generated from the name."}</p>
				</div>

				<div>
					<label className={label} htmlFor="dv-desc">
						Description
					</label>
					<textarea
						id="dv-desc"
						rows={4}
						className={cn(dashInput, "h-auto py-2.5")}
						aria-invalid={Boolean(errors.description)}
						{...form.register("description")}
					/>
					<ErrorText id="dv-desc-e" message={errors.description?.message} />
				</div>
			</fieldset>

			<div className="flex justify-end gap-2.5">
				<button type="button" className={btnGhost} onClick={onDone} disabled={isSaving}>
					Cancel
				</button>
				<button type="submit" className={btnPrimary} disabled={isSaving}>
					{isEdit ? "Save division" : "Create division"}
				</button>
			</div>
		</form>
	);
}
