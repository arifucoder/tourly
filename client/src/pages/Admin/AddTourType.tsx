import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import PageHeader from "@/components/dashboard/PageHeader";
import { EmptyState, ErrorState } from "@/components/dashboard/States";
import { btnPrimary, dashCard, iconBtn, td, th } from "@/components/dashboard/styles";
import { PageNumbers, SearchField } from "@/components/dashboard/TableControls";
import TourTypeDialog from "@/components/modules/Admin/TourType/TourTypeDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatNumber, slugify } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetTourTypesQuery, useRemoveTourTypeMutation } from "@/redux/features/Tour/tour.api";
import type { ITourType, TApiError } from "@/types";
import { Pencil, Plus, SearchX, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LIMIT = 10;
const COLS = 6;

type TModal = { type: ITourType | null } | null;

export default function TourTypes() {
	const { data: types = [], isLoading, isError, refetch } = useGetTourTypesQuery();
	const [removeTourType] = useRemoveTourTypeMutation();
	const [modal, setModal] = useState<TModal>(null);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);

	const term = search.trim().toLowerCase();
	const filtered = term ? types.filter((type) => type.name.toLowerCase().includes(term)) : types;
	const totalPage = Math.max(1, Math.ceil(filtered.length / LIMIT));
	const current = Math.min(page, totalPage);
	const rows = filtered.slice((current - 1) * LIMIT, current * LIMIT);

	const remove = async (type: ITourType) => {
		const toastId = toast.loading("Deleting…");
		try {
			await removeTourType(type._id).unwrap();
			toast.success("Tour type deleted", { id: toastId, description: `“${type.name}” was removed.` });
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't delete", { id: toastId });
		}
	};

	const openNew = (
		<button type="button" className={btnPrimary} onClick={() => setModal({ type: null })}>
			<Plus strokeWidth={2.4} />
			New tour type
		</button>
	);

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title="Tour types"
				description={`${isLoading ? "Loading…" : `${formatNumber(types.length)} types`} · used to filter tours and shown as a badge on each card`}
				actions={openNew}
			/>

			<section className={cn(dashCard, "overflow-hidden")}>
				<div className="flex flex-wrap gap-3 border-b border-border p-4">
					<SearchField
						id="tt-q"
						label="Search tour types"
						placeholder="Search tour types"
						value={search}
						className="max-w-md"
						onChange={(event) => {
							setSearch(event.target.value);
							setPage(1);
						}}
					/>
				</div>

				<div className="relative overflow-x-auto">
					<table className="w-full min-w-160 border-collapse text-sm">
						<thead>
							<tr className="border-b border-border">
								<th scope="col" className={cn(th, "w-14")}>
									#
								</th>
								<th scope="col" className={th}>
									Name
								</th>
								<th scope="col" className={th}>
									Slug
								</th>
								<th scope="col" className={cn(th, "text-right")}>
									Tours
								</th>
								<th scope="col" className={th}>
									Created
								</th>
								<th scope="col" className={cn(th, "text-right")}>
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{isLoading &&
								Array.from({ length: 5 }).map((_, i) => (
									<tr key={i} className="border-b border-border" aria-hidden="true">
										{Array.from({ length: COLS }).map((__, col) => (
											<td key={col} className={td}>
												<Skeleton className={cn("h-3.5", col === 1 ? "w-36" : "w-14")} />
											</td>
										))}
									</tr>
								))}

							{isError && (
								<tr>
									<td colSpan={COLS}>
										<ErrorState title="Couldn't load tour types" onRetry={refetch} />
									</td>
								</tr>
							)}

							{!isLoading && !isError && rows.length === 0 && (
								<tr>
									<td colSpan={COLS}>
										<EmptyState
											icon={term ? SearchX : Tag}
											title={term ? "No tour types match" : "No tour types yet"}
											description={term ? "Try another name." : "Add one, e.g. Short tour or Long tour."}
											action={!term && openNew}
										/>
									</td>
								</tr>
							)}

							{rows.map((type, index) => {
								const count = type.tourCount ?? 0;
								return (
									<tr key={type._id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
										<td className={cn(td, "text-muted-foreground tabular-nums")}>
											{(current - 1) * LIMIT + index + 1}
										</td>
										<td className={cn(td, "font-semibold")}>{type.name}</td>
										<td className={cn(td, "text-muted-foreground")}>{slugify(type.name)}</td>
										<td className={cn(td, "text-right tabular-nums")}>{formatNumber(count)}</td>
										<td className={cn(td, "whitespace-nowrap text-muted-foreground")}>{formatDate(type.createdAt)}</td>
										<td className={td}>
											<div className="flex justify-end gap-1.5">
												<button
													type="button"
													className={iconBtn}
													aria-label={`Edit ${type.name}`}
													onClick={() => setModal({ type })}
												>
													<Pencil />
												</button>
												{count > 0 ? (
													<button
														type="button"
														className={iconBtn}
														disabled
														aria-label={`Delete ${type.name} — in use by ${count} tours`}
														title={`In use by ${count} tours — move them first`}
													>
														<Trash2 />
													</button>
												) : (
													<DeleteConfirmation itemName={type.name} confirmText="Delete type" onConfirm={() => remove(type)}>
														<button
															type="button"
															className={cn(iconBtn, "text-destructive")}
															aria-label={`Delete ${type.name}`}
														>
															<Trash2 />
														</button>
													</DeleteConfirmation>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{filtered.length > 0 && (
					<PageNumbers
						page={current}
						totalPage={totalPage}
						total={filtered.length}
						limit={LIMIT}
						noun="tour types"
						onChange={setPage}
					/>
				)}
			</section>

			<p className="text-[13.5px] text-muted-foreground">
				A type that's still used by tours can't be deleted. Reassign those tours first.
			</p>

			<TourTypeDialog open={Boolean(modal)} type={modal?.type ?? null} types={types} onClose={() => setModal(null)} />
		</div>
	);
}
