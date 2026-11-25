import { useCallback, useState } from "react";

const STORAGE_KEY = "tourly-wishlist";

const readWishlist = (): string[] => {
	try {
		const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

export function useWishlist(tourId?: string) {
	const [ids, setIds] = useState<string[]>(readWishlist);
	const saved = Boolean(tourId && ids.includes(tourId));

	const toggle = useCallback(() => {
		if (!tourId) return;
		const next = readWishlist().includes(tourId)
			? readWishlist().filter((id) => id !== tourId)
			: [...readWishlist(), tourId];
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			return;
		}
		setIds(next);
	}, [tourId]);

	return { saved, toggle };
}
