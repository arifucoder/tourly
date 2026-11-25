import type { Query } from "mongoose";

interface IQueryBuilderOptions {
	searchableFields?: string[];
	filterableFields?: string[];
	multiValueFields?: string[];
	sortableFields?: string[];
	selectableFields?: string[];
	defaultSort?: string;
	defaultLimit?: number;
	maxLimit?: number;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPositiveInt = (value: unknown, fallback: number) => {
	const parsed = Number.parseInt(String(value), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export class QueryBuilder<T> {
	public modelQuery: Query<T[], T>;
	public readonly query: Record<string, unknown>;
	private readonly options: Required<IQueryBuilderOptions>;

	constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>, options: IQueryBuilderOptions = {}) {
		this.modelQuery = modelQuery;
		this.query = query;
		this.options = {
			searchableFields: [],
			filterableFields: [],
			multiValueFields: [],
			sortableFields: ["createdAt"],
			selectableFields: [],
			defaultSort: "-createdAt",
			defaultLimit: 10,
			maxLimit: 100,
			...options,
		};
	}

	private get page() {
		return toPositiveInt(this.query.page, 1);
	}

	private get limit() {
		return Math.min(toPositiveInt(this.query.limit, this.options.defaultLimit), this.options.maxLimit);
	}

	search(): this {
		const term = typeof this.query.searchTerm === "string" ? this.query.searchTerm.trim().slice(0, 100) : "";

		if (!term || this.options.searchableFields.length === 0) return this;

		const regex = { $regex: escapeRegex(term), $options: "i" };
		this.modelQuery = this.modelQuery.find({
			$or: this.options.searchableFields.map((field) => ({ [field]: regex })),
		} as never);

		return this;
	}

	filter(): this {
		const conditions: Record<string, unknown> = {};

		for (const field of this.options.filterableFields) {
			const value = this.query[field];
			if (typeof value !== "string" || value.trim() === "") continue;

			if (this.options.multiValueFields.includes(field)) {
				const values = value.split(",").map((v) => v.trim()).filter(Boolean);
				conditions[field] = values.length > 1 ? { $in: values } : values[0];
			} else {
				conditions[field] = value.trim();
			}
		}

		if (Object.keys(conditions).length > 0) {
			this.modelQuery = this.modelQuery.find(conditions as never);
		}

		return this;
	}

	sort(): this {
		const requested = typeof this.query.sort === "string" ? this.query.sort : "";
		const safe = requested
			.split(",")
			.map((part) => part.trim())
			.filter((part) => this.options.sortableFields.includes(part.replace(/^-/, "")));

		this.modelQuery = this.modelQuery.sort(safe.length > 0 ? safe.join(" ") : this.options.defaultSort);

		return this;
	}

	fields(): this {
		const requested = typeof this.query.fields === "string" ? this.query.fields : "";
		const safe = requested
			.split(",")
			.map((field) => field.trim())
			.filter((field) => this.options.selectableFields.includes(field));

		if (safe.length > 0) {
			this.modelQuery = this.modelQuery.select(safe.join(" "));
		}

		return this;
	}

	paginate(): this {
		this.modelQuery = this.modelQuery.skip((this.page - 1) * this.limit).limit(this.limit);
		return this;
	}

	build() {
		return this.modelQuery;
	}

	async getMeta() {
		const total = await this.modelQuery.model.countDocuments(this.modelQuery.getFilter());
		const limit = this.limit;

		return { page: this.page, limit, total, totalPage: Math.ceil(total / limit) };
	}
}
