import type { UploadApiResponse } from "cloudinary";
import multer, { type StorageEngine } from "multer";
import path from "path";
import AppError from "../errorHelpers/AppError";
import { cloudinaryUpload } from "./cloudinary.config";

const makeUniqueFileName = (originalName: string) => {
	const fileName = path
		.parse(originalName)
		.name.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/\./g, "-")
		.replace(/[^a-z0-9-]/g, "");

	return Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + fileName;
};

const cloudinaryStorage: StorageEngine = {
	_handleFile(req, file, cb) {
		const uploadStream = cloudinaryUpload.uploader.upload_stream(
			{
				resource_type: "auto",
				public_id: makeUniqueFileName(file.originalname),
			},
			(error, result?: UploadApiResponse) => {
				if (error || !result) return cb(error ?? new Error("Cloudinary upload failed"));

				cb(null, {
					path: result.secure_url,
					filename: result.public_id,
					size: result.bytes,
				});
			},
		);

		file.stream.on("error", cb);
		file.stream.pipe(uploadStream);
	},

	_removeFile(req, file, cb) {
		cloudinaryUpload.uploader.destroy(file.filename).then(
			() => cb(null),
			(error) => cb(error),
		);
	},
};

export const multerUpload = multer({ storage: cloudinaryStorage });

export const avatarUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 2 * 1024 * 1024, files: 1 },
	fileFilter: (req, file, cb) => {
		if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
			cb(null, true);
			return;
		}
		cb(new AppError(400, "Profile picture must be a JPG or PNG image."));
	},
});
