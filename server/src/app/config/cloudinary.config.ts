/* eslint-disable @typescript-eslint/no-explicit-any */

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import Stream from "stream";
import AppError from "../errorHelpers/AppError";
import { envVars } from "./env";

cloudinary.config({
	cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
	api_key: envVars.CLOUDINARY_API_KEY,
	api_secret: envVars.CLOUDINARY_API_SECRET,
});

export const uploadBufferToCloudinary = async (
	buffer: Buffer,
	fileName: string,
): Promise<UploadApiResponse | undefined> => {
	try {
		return new Promise((resolve, reject) => {
			const public_id = `pdf/${fileName}-${Date.now()}`;

			const bufferStream = new Stream.PassThrough();
			bufferStream.end(buffer);

			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "auto",
						public_id: public_id,
						folder: "pdf",
					},
					(error, result) => {
						if (error) {
							return reject(error);
						}
						resolve(result);
					},
				)
				.end(buffer);
		});
	} catch (error: any) {
		console.log(error);
		throw new AppError(401, `Error uploading file ${error.message}`);
	}
};

export const uploadAvatarToCloudinary = (buffer: Buffer, userId: string) =>
	new Promise<UploadApiResponse>((resolve, reject) => {
		cloudinary.uploader
			.upload_stream(
				{
					folder: "avatars",
					public_id: `${userId}-${Date.now()}`,
					resource_type: "image",
					transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
				},
				(error, result) => (error || !result ? reject(error ?? new Error("Upload failed")) : resolve(result)),
			)
			.end(buffer);
	});

export const deleteImageFromCLoudinary = async (url: string) => {
	try {
		const regex = /\/upload\/(?:v\d+\/)?(.+?)\.[a-z0-9]+$/i;
		const match = url.match(regex);

		if (!match?.[1]) {
			console.warn("Could not extract public_id from:", url);
			return;
		}

		const public_id = match[1];
		const result = await cloudinary.uploader.destroy(public_id);
		console.log(`Cloudinary destroy ${public_id}:`, result);
	} catch (error: any) {
		throw new AppError(401, "Cloudinary image deletion failed", error.message);
	}
};

const INVOICE_LINK_TTL_SECONDS = 60 * 60;

export const getSignedDownloadUrl = (url: string, ttlSeconds = INVOICE_LINK_TTL_SECONDS) => {
	const match = url.match(/\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+?)\.([a-z0-9]+)$/i);
	if (!match) return url;

	const [, resourceType, publicId, format] = match;
	return cloudinary.utils.private_download_url(publicId as string, format as string, {
		resource_type: resourceType,
		type: "upload",
		expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
	});
};

export const cloudinaryUpload = cloudinary;
