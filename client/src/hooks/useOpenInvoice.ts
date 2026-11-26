import { useGetInvoiceUrlMutation } from "@/redux/features/Booking/booking.api";
import type { TApiError } from "@/types";
import { toast } from "sonner";

export function useOpenInvoice() {
	const [getInvoiceUrl, { isLoading, originalArgs }] = useGetInvoiceUrlMutation();

	const openInvoice = async (paymentId: string) => {
		const tab = window.open("", "_blank");
		try {
			const url = await getInvoiceUrl(paymentId).unwrap();
			if (tab) tab.location.href = url;
			else window.location.href = url;
		} catch (err) {
			tab?.close();
			toast.error((err as TApiError).data?.message || "Couldn't open the invoice");
		}
	};

	return { openInvoice, openingId: isLoading ? originalArgs : undefined };
}
