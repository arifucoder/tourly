/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
	secure: true,
	auth: {
		user: envVars.SMTP_USER,
		pass: envVars.SMTP_PASS,
	},
	port: envVars.SMTP_PORT,
	host: envVars.SMTP_HOST,
});

interface SendEmailOptions {
	to: string;
	subject: string;
	templateName: string;
	templateData?: Record<string, any>;
	previewText?: string;
	attachments?: {
		filename: string;
		content: Buffer | string;
		contentType: string;
	}[];
}

const templatePath = (name: string) => path.join(__dirname, "templates", `${name}.ejs`);

export const sendEmail = async ({
	to,
	subject,
	templateName,
	templateData,
	previewText,
	attachments,
}: SendEmailOptions) => {
	try {
		const common = {
			frontendUrl: envVars.FRONTEND_URL,
			supportEmail: envVars.SMTP_FROM,
			year: new Date().getFullYear(),
		};
		const bodyHtml = await ejs.renderFile(templatePath(templateName), { ...common, ...templateData });
		const html = await ejs.renderFile(templatePath("layout"), {
			...common,
			title: subject,
			previewText: previewText ?? subject,
			bodyHtml,
		});

		await transporter.sendMail({
			from: { name: "Tourly", address: envVars.SMTP_FROM },
			to: to,
			subject: subject,
			html: html,
			attachments: attachments?.map((attachment) => ({
				filename: attachment.filename,
				content: attachment.content,
				contentType: attachment.contentType,
			})),
		});
	} catch (error: any) {
		console.error("Email sending failed", error.message);
		throw new AppError(500, "Failed to send email");
	}
};
