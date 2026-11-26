import PDFDocument from "pdfkit";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";

export interface IInvoiceData {
	invoiceNumber: string;
	transactionId: string;
	bookingDate: Date;
	paidAt: Date;
	userName: string;
	userEmail: string;
	userPhone?: string;
	userAddress?: string;
	tourTitle: string;
	tourStartDate?: Date;
	tourEndDate?: Date;
	route?: string;
	guestCount: number;
	unitPrice: number;
	totalAmount: number;
}

const C = {
	orange: "#FF7B29",
	orangeStrong: "#F26A1B",
	orangeText: "#C2410C",
	orangeSoft: "#FFF1E8",
	ink: "#2D3134",
	muted: "#676A6C",
	line: "#EEEEEE",
	soft: "#FFF7F2",
	success: "#1E7A4B",
	successSoft: "#E2F3EA",
};

const TZ = "Asia/Dhaka";

export const formatInvoiceDate = (date: Date) =>
	date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });

export const formatTripDates = (start?: Date, end?: Date) => {
	if (!start) return "";
	if (!end || formatInvoiceDate(start) === formatInvoiceDate(end)) return formatInvoiceDate(start);
	return `${formatInvoiceDate(start)} – ${formatInvoiceDate(end)}`;
};

export const formatBdt = (amount: number) =>
	`BDT ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const drawLogo = (doc: PDFKit.PDFDocument, x: number, y: number) => {
	doc.circle(x + 17, y + 17, 17).fill(C.orangeStrong);
	doc.save()
		.translate(x + 7.5, y + 8)
		.scale(0.8)
		.lineWidth(2.4)
		.lineCap("round")
		.lineJoin("round")
		.strokeColor("#FFFFFF");
	doc.path("M22 2 11 13").stroke();
	doc.path("M22 2 15 22l-4-9-9-4z").stroke();
	doc.restore();
	doc.font("Helvetica-Bold").fontSize(22).fillColor(C.ink).text("tourly", x + 44, y + 7, { continued: true, lineBreak: false });
	doc.fillColor(C.orange).text(".", { lineBreak: false });
};

const label = (doc: PDFKit.PDFDocument, text: string, x: number, y: number, width?: number) =>
	doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.orangeText).text(text.toUpperCase(), x, y, { width, characterSpacing: 1.2 });

export const generatePdf = (data: IInvoiceData): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		try {
			const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `Invoice ${data.invoiceNumber}`, Author: "Tourly" } });
			const chunks: Buffer[] = [];
			doc.on("data", (chunk: Buffer) => chunks.push(chunk));
			doc.on("end", () => resolve(Buffer.concat(chunks)));
			doc.on("error", reject);

			const L = 50;
			const R = 545;
			const W = R - L;

			doc.rect(0, 0, 595.28, 6).fill(C.orange);

			drawLogo(doc, L, 40);
			doc.font("Helvetica").fontSize(9).fillColor(C.muted).text("Guided tours across Bangladesh", L + 44, 71);

			doc.font("Helvetica-Bold").fontSize(26).fillColor(C.ink).text("INVOICE", L, 40, { width: W, align: "right" });
			doc.font("Helvetica").fontSize(10).fillColor(C.muted)
				.text(`No. ${data.invoiceNumber}`, L, 72, { width: W, align: "right" })
				.text(`Issued ${formatInvoiceDate(data.paidAt)}`, L, 86, { width: W, align: "right" });

			doc.roundedRect(R - 58, 104, 58, 20, 10).fill(C.successSoft);
			doc.font("Helvetica-Bold").fontSize(9).fillColor(C.success).text("PAID", R - 58, 110, { width: 58, align: "center" });

			doc.moveTo(L, 140).lineTo(R, 140).lineWidth(1).strokeColor(C.line).stroke();

			const colW = (W - 30) / 2;
			const col2 = L + colW + 30;
			let y = 160;
			label(doc, "Billed to", L, y);
			label(doc, "Trip", col2, y);
			y += 16;

			doc.font("Helvetica-Bold").fontSize(12).fillColor(C.ink).text(data.userName, L, y, { width: colW });
			doc.font("Helvetica").fontSize(10).fillColor(C.muted);
			const billLines = [data.userEmail, data.userPhone, data.userAddress].filter(Boolean) as string[];
			let by = y + 17;
			for (const line of billLines) {
				doc.text(line, L, by, { width: colW });
				by = doc.y + 2;
			}

			doc.font("Helvetica-Bold").fontSize(12).fillColor(C.ink).text(data.tourTitle, col2, y, { width: colW });
			doc.font("Helvetica").fontSize(10).fillColor(C.muted);
			let ty = doc.y + 4;
			const tripLines = [
				formatTripDates(data.tourStartDate, data.tourEndDate),
				data.route?.replace(/\s*→\s*/g, " to "),
				`Booked on ${formatInvoiceDate(data.bookingDate)}`,
			].filter(Boolean) as string[];
			for (const line of tripLines) {
				doc.text(line, col2, ty, { width: colW });
				ty = doc.y + 2;
			}

			y = Math.max(by, ty) + 28;

			const desc = { title: "Description", x: L + 14, w: 230, align: "left" as const };
			const guests = { title: "Guests", x: L + 250, w: 60, align: "center" as const };
			const unit = { title: "Unit price", x: L + 315, w: 80, align: "right" as const };
			const amount = { title: "Amount", x: L + 400, w: W - 414, align: "right" as const };
			doc.roundedRect(L, y, W, 30, 6).fill(C.soft);
			doc.font("Helvetica-Bold").fontSize(9).fillColor(C.muted);
			for (const col of [desc, guests, unit, amount]) {
				doc.text(col.title.toUpperCase(), col.x, y + 11, { width: col.w, align: col.align, characterSpacing: 0.8 });
			}
			y += 42;

			doc.font("Helvetica-Bold").fontSize(11).fillColor(C.ink).text(data.tourTitle, desc.x, y, { width: desc.w });
			doc.font("Helvetica").fontSize(9.5).fillColor(C.muted).text("Guided group tour · per person", desc.x, doc.y + 2, { width: desc.w });
			const rowEnd = doc.y;
			doc.font("Helvetica").fontSize(11).fillColor(C.ink)
				.text(String(data.guestCount), guests.x, y, { width: guests.w, align: "center" })
				.text(formatBdt(data.unitPrice), unit.x, y, { width: unit.w, align: "right" });
			doc.font("Helvetica-Bold").text(formatBdt(data.totalAmount), amount.x, y, { width: amount.w, align: "right" });

			y = rowEnd + 16;
			doc.moveTo(L, y).lineTo(R, y).strokeColor(C.line).stroke();
			y += 16;

			const totX = L + 260;
			const totW = W - 260;
			const row = (k: string, v: string, yy: number) => {
				doc.font("Helvetica").fontSize(10.5).fillColor(C.muted).text(k, totX, yy, { width: totW / 2 });
				doc.font("Helvetica").fillColor(C.ink).text(v, totX + totW / 2, yy, { width: totW / 2 - 14, align: "right" });
			};
			row("Subtotal", formatBdt(data.totalAmount), y);
			row("Fees & taxes", formatBdt(0), y + 18);
			y += 44;
			doc.roundedRect(totX, y, totW, 40, 8).fill(C.orangeSoft);
			doc.font("Helvetica-Bold").fontSize(11).fillColor(C.ink).text("Total paid", totX + 14, y + 14);
			doc.fontSize(16).fillColor(C.orangeText).text(formatBdt(data.totalAmount), totX, y + 11, { width: totW - 14, align: "right" });

			y += 70;
			label(doc, "Payment details", L, y);
			y += 16;
			const pay = [
				["Method", "SSLCommerz (card / mobile banking)"],
				["Transaction ID", data.transactionId],
				["Paid on", formatInvoiceDate(data.paidAt)],
			];
			for (const [k, v] of pay) {
				doc.font("Helvetica").fontSize(10).fillColor(C.muted).text(k as string, L, y, { width: 110 });
				doc.fillColor(C.ink).text(v as string, L + 110, y, { width: W - 110 });
				y += 16;
			}

			const fy = 760;
			doc.moveTo(L, fy).lineTo(R, fy).strokeColor(C.line).stroke();
			doc.font("Helvetica-Bold").fontSize(11).fillColor(C.ink).text("Thank you for travelling with Tourly!", L, fy + 14, { width: W, align: "center" });
			const site = envVars.FRONTEND_URL.replace(/^https?:\/\//, "");
			doc.font("Helvetica").fontSize(9).fillColor(C.muted)
				.text(`${envVars.SMTP_FROM}  ·  ${site}  ·  Prices in Bangladeshi Taka`, L, fy + 32, { width: W, align: "center" })
				.text("Cancellations and refunds follow the Tourly cancellation policy.", L, fy + 46, { width: W, align: "center" });

			doc.end();
		} catch (error) {
			reject(new AppError(500, `Could not create the invoice PDF: ${(error as Error).message}`));
		}
	});
