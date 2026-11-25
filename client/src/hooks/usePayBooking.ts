import { useInitPaymentMutation } from "@/redux/features/Booking/booking.api";
import type { IMyBooking, TApiError } from "@/types";
import { toast } from "sonner";

export const canPay = (booking: Pick<IMyBooking, "status" | "expiredAt">) =>
	booking.status === "PENDING" || booking.status === "FAILED" || (booking.status === "CANCEL" && Boolean(booking.expiredAt));

export function usePayBooking() {
	const [initPayment, { isLoading, originalArgs }] = useInitPaymentMutation();

	const pay = async (bookingId: string) => {
		const toastId = toast.loading("Opening secure payment…");
		try {
			const { paymentUrl } = await initPayment(bookingId).unwrap();
			window.location.href = paymentUrl;
		} catch (err) {
			toast.error((err as TApiError).data?.message || "Couldn't start the payment", { id: toastId });
		}
	};

	return { pay, payingId: isLoading ? originalArgs : undefined };
}
