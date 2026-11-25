import { Outlet, ScrollRestoration } from "react-router";
import CommonLayout from "./components/layout/CommonLayout";

function App() {
	return (
		<CommonLayout>
			<Outlet />
			<ScrollRestoration />
		</CommonLayout>
	);
}

export default App;
