import { btnGhost, btnPrimary, dashInput, help, label } from "@/components/dashboard/styles";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { slugify } from "@/lib/format";
import { useAddTourTypeMutation, useUpdateTourTypeMutation } from "@/redux/features/Tour/tour.api";
import type { ITourType, TApiError } from "@/types";
import { AlertCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const validate = (name: string, types: ITourType[], exceptId?: string) => {
	const value = name.trim();
	if (value.length < 2) return "Name must be at least 2 characters.";
	if (value.length > 50) return "Name can't be longer than 50 characters.";
	const duplicate = types.find((type) => type._id !== exceptId && type.name.toLowerCase() === value.toLowerCase());
	return duplicate ? `“${duplicate.name}” already exists` : null;
};

function TourTypeForm({ type, types, onDone }: { type: ITourType | null; types: ITourType[]; onDone: () => void }) {
	const [name, setName] = useState(type?.name ?? "");
	const [error, setError] = useState<string | null>(null);
	const [addTourType, { isLoading: isAdding }] = useAddTourTypeMutation();
	const [updateTourType, { isLoading: isUpdating }] = useUpdateTourTypeMutation();
	const isSaving = isAdding || isUpdating;

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		const problem = validate(name, types, type?._id);
		if (problem) return setError(problem);
		if (type && name.trim() === type.name) return onDone();

		try {
			if (type) await updateTourType({ id: type._id, name: name.trim() }).unwrap();
			else await addTourType({ name: name.trim() }).unwrap();
			toast.success(type ? "Tour type renamed" : "Tour type added");
			onDone();
		} catch (err) {
			setError((err as TApiError).data?.message || "Couldn't save the tour type");
		}
	};

	return (
		<form onSubmit={submit} noValidate className="flex flex-col gap-5">
			<div>
				<label htmlFor="tt-name" className={label}>
					Name <span className="text-destructive">*</span>
				</label>
				<input
					id="tt-name"
					autoFocus
					autoComplete="off"
					className={dashInput}
					placeholder="e.g. Weekend getaway"
					value={name}
					aria-invalid={Boolean(error)}
					aria-describedby={error ? "tt-name-e" : "tt-name-h"}
					onChange={(event) => {
						setName(event.target.value);
						setError(null);
					}}
				/>
				{error ? (
					<p id="tt-name-e" className="mt-1.5 flex items-center gap-1.5 text-[13px] text-destructive">
						<AlertCircle className="size-3.75 shrink-0" />
						{error}
					</p>
				) : (
					<p id="tt-name-h" className={help}>
						Slug: {slugify(name) || "your-type"}
					</p>
				)}
			</div>
			<div className="flex justify-end gap-2.5">
				<button type="button" className={btnGhost} onClick={onDone} disabled={isSaving}>
					Cancel
				</button>
				<button type="submit" className={btnPrimary} disabled={isSaving}>
					{type ? "Save changes" : "Add tour type"}
				</button>
			</div>
		</form>
	);
}

export default function TourTypeDialog({
	open,
	type,
	types,
	onClose,
}: {
	open: boolean;
	type: ITourType | null;
	types: ITourType[];
	onClose: () => void;
}) {
	return (
		<Dialog open={open} onOpenChange={(value) => !value && onClose()}>
			<DialogContent className="gap-5 rounded-xl p-6 sm:max-w-110">
				<DialogHeader>
					<DialogTitle className="text-lg font-bold">{type ? "Edit tour type" : "New tour type"}</DialogTitle>
					<DialogDescription>Used to filter tours and shown as a badge on each card.</DialogDescription>
				</DialogHeader>
				{open && <TourTypeForm key={type?._id ?? "new"} type={type} types={types} onDone={onClose} />}
			</DialogContent>
		</Dialog>
	);
}
