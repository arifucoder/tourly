import type { TTourFilters } from "./TourFilters";

export const emptyTourFilters: TTourFilters = { divisions: [], tourType: "", location: "" };

export const countActiveFilters = (f: TTourFilters) =>
	f.divisions.length + Number(Boolean(f.tourType)) + Number(Boolean(f.location)) +
	Number(f.minPrice !== undefined || f.maxPrice !== undefined);
