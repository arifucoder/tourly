import BestTours from "@/components/modules/Home/BestTours";
import DivisionGrid from "@/components/modules/Home/DivisionGrid";
import Hero from "@/components/modules/Home/Hero";
import SearchCta from "@/components/modules/Home/SearchCta";
import TrendingTours from "@/components/modules/Home/TrendingTours";
import WhyChooseUs from "@/components/modules/Home/WhyChooseUs";
import { useGetTrendingToursQuery } from "@/redux/features/Tour/tour.api";

export default function Home() {
	const { data: trending } = useGetTrendingToursQuery(8);
	const featureImage = trending?.find((tour) => tour.images?.[0])?.images?.[0];

	return (
		<div className="bg-background">
			<Hero />
			<BestTours />
			<WhyChooseUs image={featureImage} />
			<TrendingTours />
			<DivisionGrid />
			<SearchCta />
		</div>
	);
}
