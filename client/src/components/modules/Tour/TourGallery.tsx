import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { squareBtn } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useState } from "react";

const tileCls = "overflow-hidden rounded-2xl bg-placeholder text-placeholder-foreground";

function Placeholder() {
	return (
		<span className="flex size-full flex-col items-center justify-center gap-1.5 p-2.5 text-center text-xs font-medium">
			<ImageIcon className="size-8.5" strokeWidth={1.5} />
			No photo yet
		</span>
	);
}

export default function TourGallery({ images, title }: { images: string[]; title: string }) {
	const [open, setOpen] = useState(false);
	const [index, setIndex] = useState(0);

	const tiles = images.slice(0, 5);
	const side = tiles.slice(1);

	const openAt = (i: number) => {
		setIndex(i);
		setOpen(true);
	};
	const step = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

	return (
		<>
			<div
				className={cn(
					"relative grid grid-cols-1 grid-rows-[260px] gap-3.5",
					side.length > 0 && "sm:grid-cols-[2fr_1fr_1fr] sm:grid-rows-[220px_220px]",
					side.length === 0 && "sm:grid-rows-[454px]",
				)}
			>
				<div className={cn(tileCls, side.length > 0 && "sm:row-span-2")}>
					{tiles[0] ? (
						<button type="button" onClick={() => openAt(0)} className="size-full cursor-zoom-in">
							<img src={tiles[0]} alt={`${title} photo 1`} className="size-full object-cover" />
						</button>
					) : (
						<Placeholder />
					)}
				</div>
				{side.map((src, i) => (
					<button
						key={src}
						type="button"
						onClick={() => openAt(i + 1)}
						className={cn(
							tileCls,
							"hidden cursor-zoom-in sm:block",
							side.length === 1 && "sm:col-span-2 sm:row-span-2",
							side.length === 2 && "sm:col-span-2",
							side.length === 3 && i === 2 && "sm:col-span-2",
						)}
					>
						<img src={src} alt={`${title} photo ${i + 2}`} loading="lazy" className="size-full object-cover" />
					</button>
				))}

				{images.length > 1 && (
					<button
						type="button"
						onClick={() => openAt(0)}
						className="absolute right-3.5 bottom-3.5 inline-flex min-h-11 items-center rounded-[10px] bg-card px-5.5 text-[14.5px] font-medium text-foreground shadow-soft transition-colors hover:bg-muted"
					>
						View all {images.length} photos
					</button>
				)}
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-[min(960px,calc(100%-2rem))] gap-4 p-4 sm:max-w-[min(960px,calc(100%-2rem))]">
					<DialogTitle className="pr-8 text-base">{title}</DialogTitle>
					<DialogDescription className="sr-only">Photo gallery</DialogDescription>
					<div className="flex aspect-[3/2] items-center justify-center overflow-hidden rounded-xl bg-placeholder">
						{images[index] && (
							<img src={images[index]} alt={`${title} photo ${index + 1}`} className="size-full object-contain" />
						)}
					</div>
					{images.length > 1 && (
						<div className="flex items-center justify-between">
							<button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={squareBtn}>
								<ChevronLeft className="size-4.5" />
							</button>
							<span className="text-sm text-muted-foreground" aria-live="polite">
								{index + 1} / {images.length}
							</span>
							<button type="button" onClick={() => step(1)} aria-label="Next photo" className={squareBtn}>
								<ChevronRight className="size-4.5" />
							</button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
