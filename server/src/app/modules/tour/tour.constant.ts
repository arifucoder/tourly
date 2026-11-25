export const tourSearchableFields = ["title", "description", "location"];
export const tourFilterableFields = ["division", "tourType", "location"];
export const tourMultiValueFields = ["division", "tourType"];
export const tourSortableFields = ["createdAt", "costFrom", "startDate", "title"];
export const tourSelectableFields = [
	"title",
	"slug",
	"images",
	"location",
	"costFrom",
	"startDate",
	"endDate",
	"maxGuest",
	"division",
	"tourType",
];

export const TOUR_STATUS = ["active", "expired", "all"] as const;
export type TTourStatus = (typeof TOUR_STATUS)[number];

export const toTourStatus = (value?: string): TTourStatus =>
	TOUR_STATUS.includes(value as TTourStatus) ? (value as TTourStatus) : "active";

export const tourStatusFilter = (status: TTourStatus, now = new Date()) => {
	if (status === "expired") return { startDate: { $lt: now } };
	if (status === "active") return { startDate: { $not: { $lt: now } } };
	return {};
};

export const isTourExpired = (startDate?: Date | null, now = new Date()) =>
	Boolean(startDate && startDate.getTime() < now.getTime());
