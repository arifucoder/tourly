export interface ITourType {
	_id: string;
	name: string;
	tourCount?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface IMeta {
	page: number;
	limit: number;
	total: number;
	totalPage: number;
}

export interface ITour {
	_id: string;
	title: string;
	slug: string;
	description?: string;
	images?: string[];
	location?: string;
	costFrom?: number;
	startDate?: string;
	endDate?: string;
	departureLocation?: string;
	arrivalLocation?: string;
	included?: string[];
	excluded?: string[];
	amenities?: string[];
	tourPlan?: string[];
	maxGuest?: number;
	minAge?: number;
	division: { _id: string; name: string; slug?: string } | null;
	tourType: { _id: string; name: string } | null;
	seatsLeft?: number | null;
	bookingsCount?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface ITourFilterOption {
	_id: string;
	name: string;
	count: number;
}

export interface ITourFilterOptions {
	divisions: ITourFilterOption[];
	tourTypes: ITourFilterOption[];
	locations: { name: string; count: number }[];
	priceRange: { min: number; max: number };
	totalTours: number;
}
