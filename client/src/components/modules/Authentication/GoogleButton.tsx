import GoogleIcon from "@/assets/icons/GoogleIcon";
import config from "@/config";
import { authGhostBtn } from "./authStyles";

export default function GoogleButton({ label, redirect = "/" }: { label: string; redirect?: string }) {
	return (
		<button
			type="button"
			onClick={() => {
				window.location.href = `${config.baseUrl}/auth/google?redirect=${encodeURIComponent(redirect)}`;
			}}
			className={authGhostBtn}
		>
			<span className="[&_svg]:size-5">
				<GoogleIcon />
			</span>
			{label}
		</button>
	);
}
