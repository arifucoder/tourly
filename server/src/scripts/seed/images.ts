/* eslint-disable no-console */
import { v2 as cloudinary } from "cloudinary";
import "../../app/config/cloudinary.config";

const cache = new Map<string, string>();

const placeholder = (photoId: string) => `https://picsum.photos/seed/${encodeURIComponent(photoId)}/1600/1000`;

// unsplash.com/photos/<id>/download redirects to the real file on images.unsplash.com
const resolveUnsplash = async (photoId: string) => {
	try {
		const response = await fetch(`https://unsplash.com/photos/${photoId}/download`, { redirect: "manual" });
		const location = response.headers.get("location");
		if (!location) return null;

		const url = new URL(location);
		url.searchParams.delete("dl");
		url.searchParams.set("w", "1600");
		url.searchParams.set("q", "80");
		url.searchParams.set("fm", "jpg");
		url.searchParams.set("fit", "max");
		return url.toString();
	} catch {
		return null;
	}
};

const uploadToCloudinary = async (remoteUrl: string, photoId: string) => {
	try {
		const result = await cloudinary.uploader.upload(remoteUrl, {
			folder: "tourly/seed",
			public_id: photoId,
			overwrite: false,
			resource_type: "image",
		});
		return result.secure_url;
	} catch (error) {
		console.warn(`  Cloudinary upload failed for ${photoId}:`, (error as Error).message ?? error);
		return null;
	}
};

export const resolveImage = async (photoId: string, upload: boolean) => {
	const cached = cache.get(photoId);
	if (cached) return cached;

	const unsplashUrl = await resolveUnsplash(photoId);
	let url = unsplashUrl ?? placeholder(photoId);

	if (!unsplashUrl) console.warn(`  Unsplash photo ${photoId} not found, using a placeholder`);
	else if (upload) url = (await uploadToCloudinary(unsplashUrl, photoId)) ?? unsplashUrl;

	cache.set(photoId, url);
	return url;
};

export const resolveImages = async (photoIds: string[], upload: boolean) => {
	const urls: string[] = [];
	for (const photoId of photoIds) urls.push(await resolveImage(photoId, upload));
	return urls;
};
