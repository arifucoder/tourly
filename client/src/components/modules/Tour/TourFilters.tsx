import { cn } from "@/lib/utils";
import type { ITourFilterOptions } from "@/types";

export type TTourFilters = {
	divisions: string[];
	tourType: string;
	location: string;
	minPrice?: number;
	maxPrice?: number;
};

export const emptyTourFilters: TTourFilters = { divisions: [], tourType: "", location: "" };

export const countActiveFilters = (f: TTourFilters) =>
	f.divisions.length + Number(Boolean(f.tourType)) + Number(Boolean(f.location)) +
	Number(f.minPrice !== undefined || f.maxPrice !== undefined);

export const tourInputCls =
	"block min-h-11.5 w-full rounded-[10px] border-[1.5px] border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const tourPrimaryBtn =
	"inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-primary bg-primary px-5.5 text-[14.5px] font-medium whitespace-nowrap text-primary-foreground shadow-[0_10px_22px_rgb(255_123_41/0.25)] transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50";

const thumb =
	"[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-card [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-card";

const toNumber = (text: string) => Number(text.replace(/\D/g, "") || 0);

type PriceRangeProps = {
	bounds: { min: number; max: number };
	min: number;
	max: number;
	onChange: (min: number, max: number) => void;
	idPrefix: string;
};

function PriceRange({ bounds, min, max, onChange, idPrefix }: PriceRangeProps) {
	const span = bounds.max - bounds.min || 1;
	const step = span > 5000 ? 500 : 100;
	const left = ((min - bounds.min) / span) * 100;
	const right = 100 - ((max - bounds.min) / span) * 100;
	const clamp = (value: number) => Math.min(Math.max(value, bounds.min), bounds.max);

	return (
		<fieldset className="flex flex-col gap-3">
			<legend className="mb-2.5 text-sm font-semibold">Price range (৳)</legend>
			<div className="relative h-5.5">
				<div className="absolute inset-x-0 top-2.25 h-1 rounded bg-border" />
				<div className="absolute top-2.25 h-1 rounded bg-primary" style={{ left: `${left}%`, right: `${right}%` }} />
				<input
					type="range"
					aria-label="Minimum price"
					min={bounds.min}
					max={bounds.max}
					step={step}
					value={min}
					onChange={(e) => onChange(Math.min(Number(e.target.value), max), max)}
					className={cn("pointer-events-none absolute inset-0 h-5.5 w-full appearance-none bg-transparent", thumb)}
				/>
				<input
					type="range"
					aria-label="Maximum price"
					min={bounds.min}
					max={bounds.max}
					step={step}
					value={max}
					onChange={(e) => onChange(min, Math.max(Number(e.target.value), min))}
					className={cn("pointer-events-none absolute inset-0 h-5.5 w-full appearance-none bg-transparent", thumb)}
				/>
			</div>
			<div className="flex gap-2.5">
				<input
					id={`${idPrefix}-min-price`}
					aria-label="Minimum price"
					inputMode="numeric"
					value={min.toLocaleString("en-IN")}
					onChange={(e) => onChange(toNumber(e.target.value), max)}
					onBlur={() => onChange(Math.min(clamp(min), max), max)}
					className={tourInputCls}
				/>
				<input
					id={`${idPrefix}-max-price`}
					aria-label="Maximum price"
					inputMode="numeric"
					value={max.toLocaleString("en-IN")}
					onChange={(e) => onChange(min, toNumber(e.target.value))}
					onBlur={() => onChange(min, Math.max(clamp(max), min))}
					className={tourInputCls}
				/>
			</div>
		</fieldset>
	);
}

type TourFiltersProps = {
	options?: ITourFilterOptions;
	value: TTourFilters;
	onChange: (value: TTourFilters) => void;
	onApply: () => void;
	onReset: () => void;
	idPrefix: string;
};

export default function TourFilters({ options, value, onChange, onApply, onReset, idPrefix }: TourFiltersProps) {
	const divisions = options?.divisions ?? [];
	const tourTypes = options?.tourTypes ?? [];
	const locations = options?.locations ?? [];
	const bounds = options?.priceRange ?? { min: 0, max: 0 };
	const hasPriceRange = bounds.max > bounds.min;

	const toggleDivision = (id: string) =>
		onChange({
			...value,
			divisions: value.divisions.includes(id) ? value.divisions.filter((d) => d !== id) : [...value.divisions, id],
		});

	const setPrice = (min: number, max: number) =>
		onChange({
			...value,
			minPrice: min > bounds.min ? min : undefined,
			maxPrice: max < bounds.max ? max : undefined,
		});

	return (
		<div className="flex flex-col gap-6.5">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Filters</h2>
				<button
					type="button"
					onClick={onReset}
					className="min-h-9 px-1.5 text-[13.5px] font-medium text-primary-text hover:underline"
				>
					Reset all
				</button>
			</div>

			{divisions.length > 0 && (
				<fieldset className="flex flex-col gap-0.5">
					<legend className="mb-2.5 text-sm font-semibold">Division</legend>
					{divisions.map((d) => (
						<label key={d._id} className="flex min-h-8.5 cursor-pointer items-center gap-2.5 text-sm">
							<input
								type="checkbox"
								checked={value.divisions.includes(d._id)}
								onChange={() => toggleDivision(d._id)}
								className="m-0 size-4.5 cursor-pointer accent-primary"
							/>
							<span className="flex-1">{d.name}</span>
							<span className="text-[12.5px] text-muted-foreground">{d.count}</span>
						</label>
					))}
				</fieldset>
			)}

			{tourTypes.length > 0 && (
				<fieldset>
					<legend className="mb-2.5 text-sm font-semibold">Tour type</legend>
					<div className="flex flex-wrap gap-2">
						{[{ _id: "", name: "All" }, ...tourTypes].map((t) => {
							const active = value.tourType === t._id;
							return (
								<button
									key={t._id || "all"}
									type="button"
									aria-pressed={active}
									onClick={() => onChange({ ...value, tourType: t._id })}
									className={cn(
										"inline-flex min-h-9.5 items-center rounded-full border-[1.5px] px-3.5 text-[13.5px] font-medium transition-colors",
										active
											? "border-primary bg-accent text-primary-text"
											: "border-border bg-card text-foreground hover:border-primary/50",
									)}
								>
									{t.name}
								</button>
							);
						})}
					</div>
				</fieldset>
			)}

			{locations.length > 0 && (
				<div>
					<label htmlFor={`${idPrefix}-location`} className="mb-2.5 block text-sm font-semibold">
						Location
					</label>
					<select
						id={`${idPrefix}-location`}
						value={value.location}
						onChange={(e) => onChange({ ...value, location: e.target.value })}
						className={tourInputCls}
					>
						<option value="">Any location</option>
						{locations.map((l) => (
							<option key={l.name} value={l.name}>
								{l.name}
							</option>
						))}
					</select>
				</div>
			)}

			{hasPriceRange && (
				<PriceRange
					bounds={bounds}
					min={value.minPrice ?? bounds.min}
					max={value.maxPrice ?? bounds.max}
					onChange={setPrice}
					idPrefix={idPrefix}
				/>
			)}

			<button type="button" onClick={onApply} className={tourPrimaryBtn}>
				Apply filters
			</button>
		</div>
	);
}
