import { v2 as cloudinary } from "cloudinary";
import { envVars } from "../../app/config/env";
import "../../app/config/cloudinary.config";

// Only the hand-picked Unsplash photo ids in data.ts are ever used — never a random image source.
const FOLDER = "tourly/seed";

const fromCloudinary = async (photoId: string) => {
	try {
		const resource = await cloudinary.api.resource(`${FOLDER}/${photoId}`);
		return resource.secure_url as string;
	} catch {
		return null;
	}
};

// https://unsplash.com/documentation#get-a-photo
const fromUnsplash = async (photoId: string) => {
	const key = envVars.UNSPLASH_ACCESS_KEY;
	if (!key) return null;

	try {
		const headers = { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };
		const response = await fetch(`https://api.unsplash.com/photos/${photoId}`, { headers });
		if (!response.ok) {
			console.warn(`  Unsplash ${photoId}: HTTP ${response.status}`);
			return null;
		}

		const photo = (await response.json()) as { urls: { raw: string }; links: { download_location: string } };
		// Unsplash API guidelines: report a download when the photo is used
		void fetch(photo.links.download_location, { headers }).catch(() => undefined);

		const url = new URL(photo.urls.raw);
		url.searchParams.set("w", "1600");
		url.searchParams.set("q", "80");
		url.searchParams.set("fm", "jpg");
		url.searchParams.set("fit", "max");
		return url.toString();
	} catch (error) {
		console.warn(`  Unsplash ${photoId}: ${(error as Error).message}`);
		return null;
	}
};

const uploadToCloudinary = async (remoteUrl: string, photoId: string) => {
	try {
		const result = await cloudinary.uploader.upload(remoteUrl, {
			folder: FOLDER,
			public_id: photoId,
			overwrite: false,
			resource_type: "image",
		});
		return result.secure_url;
	} catch (error) {
		console.warn(`  Cloudinary upload failed for ${photoId}: ${(error as Error).message}`);
		return null;
	}
};

const resolveOne = async (photoId: string, upload: boolean) => {
	if (upload) {
		const cached = await fromCloudinary(photoId);
		if (cached) return cached;
	}

	const unsplashUrl = await fromUnsplash(photoId);
	if (!unsplashUrl) return null;

	return upload ? ((await uploadToCloudinary(unsplashUrl, photoId)) ?? unsplashUrl) : unsplashUrl;
};

// Resolves every photo id once. Ids that can't be fetched are left out (no placeholder).
export const resolveAllImages = async (photoIds: string[], upload: boolean) => {
	const resolved = new Map<string, string>();

	for (const photoId of new Set(photoIds)) {
		const url = await resolveOne(photoId, upload);
		if (url) resolved.set(photoId, url);
		else console.warn(`  Skipped image ${photoId}`);
	}

	if (resolved.size === 0) {
		throw new Error(
			"No tour images could be loaded. Set UNSPLASH_ACCESS_KEY (free key from https://unsplash.com/developers) and run the seed again.",
		);
	}

	return resolved;
};
