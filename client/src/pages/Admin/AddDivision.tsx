import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import PageHeader from "@/components/dashboard/PageHeader";
import { EmptyState, ErrorState } from "@/components/dashboard/States";
import { btnPrimary, dashCard, iconBtn } from "@/components/dashboard/styles";
import DivisionForm from "@/components/modules/Admin/Division/DivisionForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetDivisionsQuery, useRemoveDivisionMutation } from "@/redux/features/Division/division.api";
import type { TApiError } from "@/types";
import { ImageIcon, MapPinned, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TPanel = { mode: "new" } | { mode: "edit"; id: string } | null;

export default function Divisions() {
	const { data: divisions = [], isLoading, isError, refetch } = useGetDivisionsQuery();
	const [removeDivision] = useRemoveDivisionMutation();
	const [panel, setPanel] = useState<TPanel>(null);

	const editing = panel?.mode === "edit" ? (divisions.find((item) => item._id === panel.id) ?? null) : null;

	const openPanel = (next: TPanel) => setPanel(next);

	const handleRemove = async (id: string) => {
		const toastId = toast.loading("Deleting division…");
		try {
			await removeDivision(id).unwrap();
			toast.success("Division deleted", { id: toastId });
			if (panel?.mode === "edit" && panel.id === id) setPanel(null);
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't delete division", { id: toastId });
		}
	};

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title="Divisions"
				description={`${isLoading ? "Loading…" : `${divisions.length} divisions`} · each has a public page at /divisions/slug`}
				actions={
					<button type="button" className={btnPrimary} onClick={() => openPanel({ mode: "new" })}>
						<Plus strokeWidth={2.4} />
						New division
					</button>
				}
			/>

			<section
					aria-label="All divisions"
					className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-3.5"
				>
					{isLoading &&
						Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className={cn(dashCard, "overflow-hidden")} aria-hidden="true">
								<Skeleton className="h-27.5 rounded-none" />
								<div className="flex flex-col gap-1.5 p-3.5">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-3 w-32" />
								</div>
							</div>
						))}

					{isError && (
						<div className={cn(dashCard, "col-span-full")}>
							<ErrorState title="Couldn't load divisions" onRetry={refetch} />
						</div>
					)}

					{!isLoading && !isError && divisions.length === 0 && (
						<div className={cn(dashCard, "col-span-full")}>
							<EmptyState
								icon={MapPinned}
								title="No divisions yet"
								description="Add your first division to start grouping tours."
								action={
									<button type="button" className={btnPrimary} onClick={() => openPanel({ mode: "new" })}>
										<Plus strokeWidth={2.4} />
										New division
									</button>
								}
							/>
						</div>
					)}

					{divisions.map((division) => {
						const count = division.tourCount ?? 0;
						const selected = panel?.mode === "edit" && panel.id === division._id;
						return (
							<article
								key={division._id}
								className={cn(dashCard, "flex flex-col overflow-hidden", selected && "outline-2 outline-primary")}
							>
								<div className="flex h-27.5 items-center justify-center bg-placeholder text-placeholder-foreground">
									{division.thumbnail ? (
										<img src={division.thumbnail} alt="" loading="lazy" className="size-full object-cover" />
									) : (
										<ImageIcon className="size-6" />
									)}
								</div>
								<div className="flex items-center gap-2 px-3.5 py-3">
									<div className="min-w-0 flex-1">
										<strong className="block truncate">{division.name}</strong>
										<div className="truncate text-[13px] text-muted-foreground">
											{count} tour{count === 1 ? "" : "s"} · /{division.slug}
										</div>
									</div>
									<button
										type="button"
										className={iconBtn}
										aria-label={`Edit ${division.name}`}
										onClick={() => openPanel({ mode: "edit", id: division._id })}
									>
										<Pencil />
									</button>
									{count > 0 ? (
										<button
											type="button"
											className={iconBtn}
											disabled
											aria-label={`Delete ${division.name} — in use by ${count} tours`}
											title={`In use by ${count} tours — move them first`}
										>
											<Trash2 />
										</button>
									) : (
										<DeleteConfirmation
											itemName={division.name}
											description="This removes the division and its public page. This can't be undone."
											confirmText="Delete division"
											onConfirm={() => handleRemove(division._id)}
										>
											<button
												type="button"
												className={cn(iconBtn, "text-destructive")}
												aria-label={`Delete ${division.name}`}
											>
												<Trash2 />
											</button>
										</DeleteConfirmation>
									)}
								</div>
							</article>
						);
					})}
			</section>

			<Dialog open={Boolean(panel)} onOpenChange={(open) => !open && setPanel(null)}>
				<DialogContent className="max-h-[92vh] gap-5 overflow-y-auto rounded-xl p-6 sm:max-w-120">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold">{editing ? "Edit division" : "New division"}</DialogTitle>
						<DialogDescription>Each division has its own public page at /divisions/slug.</DialogDescription>
					</DialogHeader>
					{panel && (
						<DivisionForm
							key={panel.mode === "edit" ? panel.id : "new"}
							division={editing}
							onDone={() => setPanel(null)}
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
