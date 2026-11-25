import { dashInput, iconBtn } from "@/components/dashboard/styles";
import { cn } from "@/lib/utils";
import { GripVertical, ImagePlus, Plus, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export function FormSection({
	id,
	title,
	description,
	children,
}: {
	id: string;
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section aria-labelledby={id} className="flex flex-col gap-4.5 rounded-xl border border-border bg-card p-5 sm:p-6">
			<div className="flex flex-col gap-0.5">
				<h2 id={id} className="text-lg font-bold">
					{title}
				</h2>
				{description && <p className="text-[14px] text-muted-foreground">{description}</p>}
			</div>
			{children}
		</section>
	);
}

const addBtn =
	"inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-border bg-transparent text-[14.5px] font-semibold text-primary-text transition-colors hover:border-primary hover:bg-accent [&_svg]:size-4";

const reorder = <T,>(items: T[], from: number, to: number) => {
	const next = [...items];
	const [moved] = next.splice(from, 1);
	next.splice(to, 0, moved);
	return next;
};

function useDragReorder<T>(items: T[], onChange: (items: T[]) => void) {
	const [dragIndex, setDragIndex] = useState<number | null>(null);

	return (index: number) => ({
		draggable: true,
		onDragStart: () => setDragIndex(index),
		onDragOver: (event: React.DragEvent) => event.preventDefault(),
		onDrop: () => {
			if (dragIndex !== null && dragIndex !== index) onChange(reorder(items, dragIndex, index));
			setDragIndex(null);
		},
		onDragEnd: () => setDragIndex(null),
		"data-dragging": dragIndex === index || undefined,
	});
}

export function SortableList({
	legend,
	placeholder,
	value,
	onChange,
}: {
	legend: string;
	placeholder: string;
	value: string[];
	onChange: (items: string[]) => void;
}) {
	const dragProps = useDragReorder(value, onChange);

	return (
		<fieldset className="flex min-w-0 flex-col gap-2">
			<legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
			{value.map((item, i) => (
				<div key={i} className="flex items-center gap-2 data-dragging:opacity-50" {...dragProps(i)}>
					<GripVertical aria-hidden="true" className="size-4.5 shrink-0 cursor-grab text-muted-foreground" />
					<input
						className={dashInput}
						value={item}
						placeholder={placeholder}
						aria-label={`${legend} item ${i + 1}`}
						onChange={(event) => onChange(value.map((v, j) => (j === i ? event.target.value : v)))}
					/>
					<button
						type="button"
						className={iconBtn}
						aria-label={`Remove ${legend.toLowerCase()} item ${i + 1}`}
						onClick={() => onChange(value.filter((_, j) => j !== i))}
					>
						<X />
					</button>
				</div>
			))}
			<button type="button" className={addBtn} onClick={() => onChange([...value, ""])}>
				<Plus />
				Add item
			</button>
		</fieldset>
	);
}

export type TPlanDay = { title: string; text: string };

export function PlanList({ value, onChange }: { value: TPlanDay[]; onChange: (days: TPlanDay[]) => void }) {
	const dragProps = useDragReorder(value, onChange);
	const update = (index: number, patch: Partial<TPlanDay>) =>
		onChange(value.map((day, i) => (i === index ? { ...day, ...patch } : day)));

	return (
		<>
			{value.length > 0 && (
				<ol className="flex flex-col gap-3">
					{value.map((day, i) => (
						<li key={i} className="flex items-start gap-3 data-dragging:opacity-50" {...dragProps(i)}>
							<span className="mt-1 flex size-9 shrink-0 cursor-grab items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground">
								{i + 1}
							</span>
							<div className="flex min-w-0 flex-1 flex-col gap-2">
								<input
									className={dashInput}
									value={day.title}
									placeholder="e.g. Dhaka → Khagrachari → Sajek"
									aria-label={`Day ${i + 1} title`}
									onChange={(event) => update(i, { title: event.target.value })}
								/>
								<textarea
									rows={2}
									className={cn(dashInput, "h-auto resize-y py-2.5")}
									value={day.text}
									placeholder="What happens on this day"
									aria-label={`Day ${i + 1} details`}
									onChange={(event) => update(i, { text: event.target.value })}
								/>
							</div>
							<button
								type="button"
								className={cn(iconBtn, "mt-1")}
								aria-label={`Remove day ${i + 1}`}
								onClick={() => onChange(value.filter((_, j) => j !== i))}
							>
								<X />
							</button>
						</li>
					))}
				</ol>
			)}
			<button type="button" className={addBtn} onClick={() => onChange([...value, { title: "", text: "" }])}>
				<Plus />
				Add day
			</button>
		</>
	);
}

const MAX_IMAGES = 10;
const MAX_SIZE = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function ImagesField({
	existing,
	removed,
	files,
	onToggleRemove,
	onFilesChange,
}: {
	existing: string[];
	removed: string[];
	files: File[];
	onToggleRemove: (url: string) => void;
	onFilesChange: (files: File[]) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [dragging, setDragging] = useState(false);

	const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
	useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

	const kept = existing.filter((url) => !removed.includes(url));
	const slotsLeft = MAX_IMAGES - kept.length - files.length;
	const coverUrl = kept[0] ?? null;

	const addFiles = (list?: FileList | null) => {
		if (!list?.length) return;
		const incoming = Array.from(list);
		const bad = incoming.find((file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_SIZE);
		const valid = incoming.filter((file) => IMAGE_TYPES.includes(file.type) && file.size <= MAX_SIZE);
		const accepted = valid.slice(0, Math.max(slotsLeft, 0));

		if (bad) setError(`“${bad.name}” was skipped — use JPG, PNG or WebP up to 2 MB.`);
		else if (accepted.length < valid.length) setError(`Only ${MAX_IMAGES} images are allowed per tour.`);
		else setError(null);

		if (accepted.length) onFilesChange([...files, ...accepted]);
		if (inputRef.current) inputRef.current.value = "";
	};

	const tag = "absolute top-2 left-2 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] uppercase";
	const removeBtn =
		"absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/85";

	return (
		<div className="flex flex-col gap-3">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				{existing.map((url, i) => {
					const isRemoved = removed.includes(url);
					return (
						<div key={url} className="relative aspect-4/3 overflow-hidden rounded-xl bg-placeholder">
							<img src={url} alt={`Tour image ${i + 1}`} className="size-full object-cover" />
							{isRemoved ? (
								<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 text-white">
									<span className="text-[13px] font-semibold">Will be removed</span>
									<button
										type="button"
										onClick={() => onToggleRemove(url)}
										className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold text-black"
									>
										<Undo2 className="size-3.5" />
										Undo
									</button>
								</div>
							) : (
								<>
									{url === coverUrl && <span className={cn(tag, "bg-primary text-primary-foreground")}>Cover</span>}
									<button
										type="button"
										className={removeBtn}
										aria-label={`Remove image ${i + 1}`}
										onClick={() => onToggleRemove(url)}
									>
										<X className="size-4" />
									</button>
								</>
							)}
						</div>
					);
				})}

				{files.map((file, i) => (
					<div key={`${file.name}-${file.lastModified}-${i}`} className="relative aspect-4/3 overflow-hidden rounded-xl bg-placeholder">
						<img src={previews[i]} alt={file.name} className="size-full object-cover" />
						<span className={cn(tag, !coverUrl && i === 0 ? "bg-primary text-primary-foreground" : "bg-card text-foreground")}>
							{!coverUrl && i === 0 ? "Cover" : "New"}
						</span>
						<button
							type="button"
							className={removeBtn}
							aria-label={`Remove new image ${file.name}`}
							onClick={() => onFilesChange(files.filter((_, j) => j !== i))}
						>
							<X className="size-4" />
						</button>
					</div>
				))}

				{slotsLeft > 0 && (
					<label
						onDragOver={(event) => {
							event.preventDefault();
							setDragging(true);
						}}
						onDragLeave={() => setDragging(false)}
						onDrop={(event) => {
							event.preventDefault();
							setDragging(false);
							addFiles(event.dataTransfer.files);
						}}
						className={cn(
							"flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-border text-center transition-colors hover:border-primary hover:bg-accent",
							dragging && "border-primary bg-accent",
						)}
					>
						<ImagePlus aria-hidden="true" className="size-6 text-primary-text" />
						<span className="text-sm font-semibold">Add images</span>
						<span className="text-[12.5px] text-muted-foreground">or drag &amp; drop</span>
						<input
							ref={inputRef}
							type="file"
							multiple
							accept={IMAGE_TYPES.join(",")}
							className="sr-only"
							onChange={(event) => addFiles(event.target.files)}
						/>
					</label>
				)}
			</div>
			{error && <p className="text-[13px] text-destructive">{error}</p>}
			<p className="text-[13.5px] text-muted-foreground">
				{[
					existing.length > 0 && `${existing.length} existing`,
					removed.length > 0 && `${removed.length} marked for removal`,
					files.length > 0 && `${files.length} new`,
				]
					.filter(Boolean)
					.join(" · ") || "No images yet"}
			</p>
		</div>
	);
}
