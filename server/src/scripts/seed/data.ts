import { IsActive, Role } from "../../app/modules/user/user.interface";

export const DEMO_EMAIL_DOMAIN = "tourly.demo";

export interface ISeedDivision {
	name: string;
	description: string;
}

export const divisions: ISeedDivision[] = [
	{ name: "Dhaka", description: "The capital — Mughal forts, old bazaars and the ancient city of Sonargaon." },
	{ name: "Chattogram", description: "Hills, lakes, islands and the world's longest natural sea beach." },
	{ name: "Sylhet", description: "Tea gardens, swamp forests and clear rivers at the foot of the Meghalaya hills." },
	{ name: "Khulna", description: "Gateway to the Sundarbans and the UNESCO mosque city of Bagerhat." },
	{ name: "Rajshahi", description: "Silk, mangoes and the ruins of the great Paharpur Buddhist monastery." },
	{ name: "Barishal", description: "Rivers, floating markets and the sunrise-and-sunset beach of Kuakata." },
	{ name: "Rangpur", description: "Zamindar palaces and the finest terracotta temple in Bengal." },
	{ name: "Mymensingh", description: "China-clay hills, the Someshwari river and Garo villages." },
];

export const tourTypes = [
	"Beach & Island",
	"Hill & Trekking",
	"Lake & River",
	"Forest & Wildlife",
	"Heritage & Culture",
	"Tea & Countryside",
];

export interface ISeedTour {
	key: string;
	title: string;
	division: string;
	tourType: string;
	location: string;
	departureLocation: string;
	arrivalLocation: string;
	costFrom: number;
	maxGuest: number;
	minAge: number;
	// first start date, in days from today (negative = already happened)
	startInDays: number;
	days: number;
	// false = a finished trip kept for booking history; it is never moved to a new date
	autoRollover: boolean;
	// Unsplash photo ids (unsplash.com/photos/<id>)
	images: string[];
	description: string;
	included: string[];
	excluded: string[];
	amenities: string[];
	tourPlan: string[];
}

const STANDARD_EXCLUDED = ["Personal expenses", "Travel insurance", "Anything not listed in included"];

export const tours: ISeedTour[] = [
	{
		key: "coxs-bazar",
		title: "Cox's Bazar Beach Escape",
		division: "Chattogram",
		tourType: "Beach & Island",
		location: "Cox's Bazar",
		departureLocation: "Dhaka (Sayedabad)",
		arrivalLocation: "Cox's Bazar Kolatoli",
		costFrom: 8500,
		maxGuest: 30,
		minAge: 5,
		startInDays: 4,
		days: 3,
		autoRollover: true,
		images: ["l3Zg9-znzdY", "GHhlnkFbN8c", "cnbwGzhY_jk"],
		description:
			"Three relaxed days on the world's longest natural sea beach. Sunset at Laboni Point, a jeep ride along Marine Drive and fresh seafood at the Kolatoli market.",
		included: ["AC bus both ways", "2 nights sea-view hotel", "Daily breakfast", "Marine Drive jeep ride", "Tour guide"],
		excluded: ["Lunch and dinner", ...STANDARD_EXCLUDED],
		amenities: ["Wi-Fi", "Sea-view room", "Pool access"],
		tourPlan: [
			"Day 1: Night bus from Dhaka, hotel check-in, sunset at Laboni Point",
			"Day 2: Marine Drive to Himchari waterfall and Inani beach",
			"Day 3: Burmese market, beach time, night bus back to Dhaka",
		],
	},
	{
		key: "saint-martin",
		title: "Saint Martin's Coral Island",
		division: "Chattogram",
		tourType: "Beach & Island",
		location: "Saint Martin's Island",
		departureLocation: "Dhaka (Arambagh)",
		arrivalLocation: "Saint Martin's Island",
		costFrom: 12500,
		maxGuest: 25,
		minAge: 8,
		startInDays: 10,
		days: 3,
		autoRollover: true,
		images: ["lzt6qx3CnJc", "Scy8XixPwhk", "ujRuHDnzN84"],
		description:
			"Bangladesh's only coral island: turquoise water, coconut palms and a cycle ride to Chhera Dwip at low tide. Ship from Teknaf with a night stay on the island.",
		included: ["AC bus to Teknaf", "Ship tickets", "1 night island resort", "All meals on the island", "Tour guide"],
		excluded: ["Snorkelling gear rent", ...STANDARD_EXCLUDED],
		amenities: ["Beachfront cottage", "Bonfire night"],
		tourPlan: [
			"Day 1: Night bus to Teknaf",
			"Day 2: Ship to the island, cycle to Chhera Dwip, barbecue dinner",
			"Day 3: Sunrise walk, ship back and bus to Dhaka",
		],
	},
	{
		key: "inani-himchari",
		title: "Inani & Himchari Coastal Drive",
		division: "Chattogram",
		tourType: "Beach & Island",
		location: "Inani, Cox's Bazar",
		departureLocation: "Chattogram city",
		arrivalLocation: "Inani beach",
		costFrom: 4200,
		maxGuest: 20,
		minAge: 0,
		startInDays: 6,
		days: 1,
		autoRollover: true,
		images: ["c1VMTdtNF1g", "mSUXyXEbBbc"],
		description:
			"A one-day drive on Marine Drive with the hills on one side and the sea on the other. Rocky Inani beach, Himchari hill top and a seafood lunch.",
		included: ["AC microbus", "Seafood lunch", "Entry tickets", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Family friendly"],
		tourPlan: ["Morning: Himchari hill top and waterfall", "Noon: Inani coral rocks and lunch", "Evening: Sunset and return"],
	},
	{
		key: "bandarban",
		title: "Bandarban Nilgiri Hill Trek",
		division: "Chattogram",
		tourType: "Hill & Trekking",
		location: "Bandarban",
		departureLocation: "Dhaka (Fakirapool)",
		arrivalLocation: "Nilgiri, Bandarban",
		costFrom: 9800,
		maxGuest: 18,
		minAge: 12,
		startInDays: 7,
		days: 3,
		autoRollover: true,
		images: ["SAMR5VepTIc", "MrKPi-yajC0"],
		description:
			"Walk above the clouds at Nilgiri, visit the Golden Temple and swim in the Shoilo Propat falls. A light trek for anyone who wants real hills.",
		included: ["AC bus both ways", "Chander gari (jeep) transfers", "2 nights hill resort", "All meals", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Hill-view cottage", "Campfire"],
		tourPlan: [
			"Day 1: Bus to Bandarban, Nilachal sunset",
			"Day 2: Jeep to Nilgiri, Shoilo Propat falls, Golden Temple",
			"Day 3: Meghla lake and bus back",
		],
	},
	{
		key: "sajek",
		title: "Sajek Valley Cloud Retreat",
		division: "Chattogram",
		tourType: "Hill & Trekking",
		location: "Sajek, Rangamati",
		departureLocation: "Dhaka (Kalabagan)",
		arrivalLocation: "Sajek Valley",
		costFrom: 9200,
		maxGuest: 22,
		minAge: 6,
		startInDays: 14,
		days: 3,
		autoRollover: true,
		images: ["ADFyoO70OVA", "TAUjeniJWjs"],
		description:
			"Wake up above a sea of clouds. Konglak hill sunrise, Lushai village and the Alutila cave on the way from Khagrachari.",
		included: ["AC bus to Khagrachari", "Jeep to Sajek", "2 nights cottage", "All meals", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Cloud-view balcony", "Barbecue night"],
		tourPlan: [
			"Day 1: Bus to Khagrachari, jeep to Sajek, sunset at helipad",
			"Day 2: Konglak hill sunrise, Ruilui para walk",
			"Day 3: Alutila cave, Richhang falls and bus back",
		],
	},
	{
		key: "kaptai",
		title: "Rangamati Kaptai Lake Cruise",
		division: "Chattogram",
		tourType: "Lake & River",
		location: "Rangamati",
		departureLocation: "Chattogram city",
		arrivalLocation: "Rangamati",
		costFrom: 6500,
		maxGuest: 24,
		minAge: 0,
		startInDays: 15,
		days: 2,
		autoRollover: true,
		images: ["e8RJwsQxl5c", "LQi7Z25gKJY"],
		description:
			"Cruise Bangladesh's largest lake by engine boat — the hanging bridge, Shuvolong falls, Rajban Vihara and a lunch on a lake island.",
		included: ["AC microbus", "Full-day boat", "1 night lake resort", "All meals", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Lake-view room", "Life jackets"],
		tourPlan: ["Day 1: Hanging bridge, Rajban Vihara, sunset cruise", "Day 2: Shuvolong falls, island lunch, return"],
	},
	{
		key: "ratargul",
		title: "Ratargul Swamp Forest Boat Ride",
		division: "Sylhet",
		tourType: "Forest & Wildlife",
		location: "Gowainghat, Sylhet",
		departureLocation: "Sylhet city",
		arrivalLocation: "Ratargul",
		costFrom: 3500,
		maxGuest: 16,
		minAge: 6,
		startInDays: 5,
		days: 1,
		autoRollover: true,
		images: ["SfBZbmyG79c"],
		description:
			"Glide by small wooden boat through the only freshwater swamp forest in Bangladesh, then climb the watchtower for a view over the canopy.",
		included: ["CNG/microbus transfer", "Boat ride", "Lunch", "Entry tickets", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Life jackets"],
		tourPlan: ["Morning: Drive to Ratargul", "Noon: Boat ride and watchtower", "Afternoon: Lunch and return to Sylhet"],
	},
	{
		key: "sreemangal",
		title: "Sreemangal Tea Garden Trail",
		division: "Sylhet",
		tourType: "Tea & Countryside",
		location: "Sreemangal, Moulvibazar",
		departureLocation: "Dhaka (Kamalapur railway)",
		arrivalLocation: "Sreemangal",
		costFrom: 7200,
		maxGuest: 20,
		minAge: 0,
		startInDays: 8,
		days: 2,
		autoRollover: true,
		images: ["ManOOO3-280", "EW6ylTlIwME"],
		description:
			"Tea estates, the Lawachara rainforest and the famous seven-layer tea. Train ride both ways and a night in a tea resort.",
		included: ["Train tickets (AC chair)", "1 night tea resort", "All meals", "Lawachara entry", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Garden view", "Bicycle"],
		tourPlan: [
			"Day 1: Train to Sreemangal, tea estate walk, seven-layer tea",
			"Day 2: Lawachara forest trail, Madhabpur lake, train back",
		],
	},
	{
		key: "jaflong",
		title: "Jaflong & Lalakhal River Day",
		division: "Sylhet",
		tourType: "Lake & River",
		location: "Jaflong, Sylhet",
		departureLocation: "Sylhet city",
		arrivalLocation: "Jaflong Zero Point",
		costFrom: 3900,
		maxGuest: 20,
		minAge: 0,
		startInDays: 10,
		days: 1,
		autoRollover: true,
		images: ["LQi7Z25gKJY", "e8RJwsQxl5c"],
		description:
			"Blue-green Lalakhal river by boat, then the stone river of Jaflong at the foot of the Khasia hills, with a Khasia village visit.",
		included: ["AC microbus", "Lalakhal boat", "Lunch", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Family friendly"],
		tourPlan: ["Morning: Lalakhal boat ride", "Noon: Jaflong Zero Point and Khasia village", "Evening: Return to Sylhet"],
	},
	{
		key: "sundarbans",
		title: "Sundarbans Mangrove Safari",
		division: "Khulna",
		tourType: "Forest & Wildlife",
		location: "Sundarbans",
		departureLocation: "Khulna launch ghat",
		arrivalLocation: "Kotka, Sundarbans",
		costFrom: 16500,
		maxGuest: 30,
		minAge: 8,
		startInDays: 14,
		days: 3,
		autoRollover: true,
		images: ["nZ2cEh8Qzcg"],
		description:
			"Three days on a cruise ship inside the largest mangrove forest on Earth. Spotted deer at Kotka, crocodiles at Karamjal and, with luck, a tiger track.",
		included: ["Cruise ship cabin", "All meals and snacks", "Forest permits", "Armed forest guard", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["AC cabin", "Country boat trips"],
		tourPlan: [
			"Day 1: Board at Khulna, sail to Harbaria",
			"Day 2: Kotka beach, Kochikhali trail, deer watching",
			"Day 3: Karamjal crocodile centre and return",
		],
	},
	{
		key: "bagerhat",
		title: "Bagerhat Sixty Dome Heritage",
		division: "Khulna",
		tourType: "Heritage & Culture",
		location: "Bagerhat",
		departureLocation: "Khulna city",
		arrivalLocation: "Bagerhat",
		costFrom: 3200,
		maxGuest: 25,
		minAge: 0,
		startInDays: 11,
		days: 1,
		autoRollover: true,
		images: ["8Q5HBZsJclY"],
		description:
			"The UNESCO mosque city of Khan Jahan Ali: the Sixty Dome Mosque, Singair Mosque and the shrine pond with its famous crocodiles.",
		included: ["AC microbus", "Entry tickets", "Lunch", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Museum visit"],
		tourPlan: ["Morning: Sixty Dome Mosque and museum", "Noon: Singair and Nine Dome mosques", "Afternoon: Khan Jahan Ali shrine"],
	},
	{
		key: "old-dhaka",
		title: "Old Dhaka Heritage Walk",
		division: "Dhaka",
		tourType: "Heritage & Culture",
		location: "Old Dhaka",
		departureLocation: "Lalbagh Fort gate",
		arrivalLocation: "Sadarghat",
		costFrom: 1800,
		maxGuest: 15,
		minAge: 0,
		startInDays: 3,
		days: 1,
		autoRollover: true,
		images: ["l2KnpnOrhhA", "2rxRDvwdTjw"],
		description:
			"Lalbagh Fort, Armenian Church, Star Mosque, Ahsan Manzil and a boat across the Buriganga — finished with Old Dhaka biriyani and borhani.",
		included: ["Walking guide", "Entry tickets", "Rickshaw rides", "Biriyani lunch"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Small group"],
		tourPlan: ["Morning: Lalbagh Fort and Armenian Church", "Noon: Star Mosque and biriyani lunch", "Afternoon: Ahsan Manzil and Buriganga boat"],
	},
	{
		key: "sonargaon",
		title: "Sonargaon Panam City Day Trip",
		division: "Dhaka",
		tourType: "Heritage & Culture",
		location: "Sonargaon, Narayanganj",
		departureLocation: "Dhaka (Gulistan)",
		arrivalLocation: "Panam City",
		costFrom: 2500,
		maxGuest: 25,
		minAge: 0,
		startInDays: 13,
		days: 1,
		autoRollover: true,
		images: ["XaNNgx1ZpYA", "0amq4aiNFuw"],
		description:
			"The old capital of Bengal: the abandoned merchant street of Panam City, the Folk Art Museum and Goaldi Mosque.",
		included: ["AC microbus", "Entry tickets", "Lunch", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Family friendly"],
		tourPlan: ["Morning: Folk Art and Craft Museum", "Noon: Panam City walk", "Afternoon: Goaldi Mosque and return"],
	},
	{
		key: "paharpur",
		title: "Paharpur & Puthia Heritage Tour",
		division: "Rajshahi",
		tourType: "Heritage & Culture",
		location: "Naogaon & Rajshahi",
		departureLocation: "Rajshahi city",
		arrivalLocation: "Paharpur",
		costFrom: 5400,
		maxGuest: 20,
		minAge: 0,
		startInDays: 16,
		days: 2,
		autoRollover: true,
		images: ["shxBTnLl5Hk"],
		description:
			"The 8th-century Somapura Mahavihara at Paharpur, the temple town of Puthia and an evening on the Padma riverbank in Rajshahi.",
		included: ["AC microbus", "1 night hotel", "All meals", "Entry tickets", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Mango season special"],
		tourPlan: ["Day 1: Puthia temples, Padma riverside evening", "Day 2: Paharpur vihara and museum, return"],
	},
	{
		key: "kuakata",
		title: "Kuakata Sunrise & Sunset Beach",
		division: "Barishal",
		tourType: "Beach & Island",
		location: "Kuakata, Patuakhali",
		departureLocation: "Dhaka (Sadarghat launch)",
		arrivalLocation: "Kuakata",
		costFrom: 7800,
		maxGuest: 26,
		minAge: 0,
		startInDays: 18,
		days: 3,
		autoRollover: true,
		images: ["yqcL3UGJqgQ", "5Hu7CYUyEWU", "ETeDLzMMAUQ"],
		description:
			"The one beach in Bangladesh where you see both sunrise and sunset over the sea. Overnight launch from Dhaka, Rakhine village and Fatrar Char mangroves.",
		included: ["Launch cabin both ways", "1 night hotel", "Daily breakfast", "Motorbike beach tour", "Tour guide"],
		excluded: ["Lunch and dinner", ...STANDARD_EXCLUDED],
		amenities: ["Sea-view room"],
		tourPlan: ["Day 1: Overnight launch to Barishal", "Day 2: Kuakata sunrise, Rakhine village, sunset", "Day 3: Fatrar Char and launch back"],
	},
	{
		key: "barishal-guava",
		title: "Barishal Floating Guava Market",
		division: "Barishal",
		tourType: "Lake & River",
		location: "Bhimruli, Jhalokathi",
		departureLocation: "Barishal launch ghat",
		arrivalLocation: "Bhimruli floating market",
		costFrom: 4600,
		maxGuest: 18,
		minAge: 0,
		startInDays: 20,
		days: 2,
		autoRollover: true,
		images: ["e8RJwsQxl5c", "0amq4aiNFuw"],
		description:
			"Row through the backwater canals to Bhimruli, where farmers sell guava straight from their boats, then visit the Durga Sagar lake.",
		included: ["Launch cabin", "Country boat", "1 night hotel", "All meals", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Small group"],
		tourPlan: ["Day 1: Launch to Barishal, Durga Sagar", "Day 2: Bhimruli floating market by boat, return"],
	},
	{
		key: "dinajpur",
		title: "Dinajpur Kantajew Temple & Rajbari",
		division: "Rangpur",
		tourType: "Heritage & Culture",
		location: "Dinajpur",
		departureLocation: "Rangpur city",
		arrivalLocation: "Kantanagar, Dinajpur",
		costFrom: 4800,
		maxGuest: 20,
		minAge: 0,
		startInDays: 22,
		days: 2,
		autoRollover: true,
		images: ["2rxRDvwdTjw", "shxBTnLl5Hk"],
		description:
			"The terracotta masterpiece of Kantajew Temple, the Dinajpur Rajbari, Ramsagar lake and the Tajhat Palace in Rangpur.",
		included: ["AC microbus", "1 night hotel", "All meals", "Entry tickets", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Photography stops"],
		tourPlan: ["Day 1: Tajhat Palace, drive to Dinajpur, Ramsagar", "Day 2: Kantajew Temple and Rajbari, return"],
	},
	{
		key: "birishiri",
		title: "Birishiri China-Clay Hills & Someshwari",
		division: "Mymensingh",
		tourType: "Lake & River",
		location: "Birishiri, Netrokona",
		departureLocation: "Dhaka (Mohakhali)",
		arrivalLocation: "Birishiri",
		costFrom: 5200,
		maxGuest: 20,
		minAge: 0,
		startInDays: 17,
		days: 2,
		autoRollover: true,
		images: ["shxBTnLl5Hk", "LQi7Z25gKJY"],
		description:
			"Blue-green clay lakes, the clear Someshwari river and Garo culture at the Birishiri cultural academy, close to the Meghalaya border.",
		included: ["AC bus both ways", "1 night guest house", "All meals", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Village walk"],
		tourPlan: ["Day 1: Bus to Birishiri, Someshwari river, Garo cultural academy", "Day 2: China-clay hills and lakes, return"],
	},
	// Finished trips: keep booking history in the past (autoRollover: false, hidden from the public list)
	{
		key: "tanguar-haor",
		title: "Tanguar Haor Houseboat (Monsoon)",
		division: "Sylhet",
		tourType: "Lake & River",
		location: "Tanguar Haor, Sunamganj",
		departureLocation: "Sunamganj",
		arrivalLocation: "Tanguar Haor",
		costFrom: 11500,
		maxGuest: 16,
		minAge: 6,
		startInDays: -38,
		days: 2,
		autoRollover: false,
		images: ["LQi7Z25gKJY"],
		description: "Two days on a houseboat across the monsoon wetland, with Niladri lake and the Barik tila sunset.",
		included: ["Houseboat cabin", "All meals", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Houseboat"],
		tourPlan: ["Day 1: Houseboat across the haor, watchtower swim", "Day 2: Niladri lake, Barik tila, return"],
	},
	{
		key: "nijhum-dwip",
		title: "Nijhum Dwip Deer Island",
		division: "Chattogram",
		tourType: "Forest & Wildlife",
		location: "Hatiya, Noakhali",
		departureLocation: "Dhaka (Sadarghat launch)",
		arrivalLocation: "Nijhum Dwip",
		costFrom: 8900,
		maxGuest: 18,
		minAge: 8,
		startInDays: -74,
		days: 3,
		autoRollover: false,
		images: ["mSUXyXEbBbc"],
		description: "A quiet island of mangroves and spotted deer at the mouth of the Meghna.",
		included: ["Launch cabin", "2 nights eco-cottage", "All meals", "Tour guide"],
		excluded: STANDARD_EXCLUDED,
		amenities: ["Eco-cottage"],
		tourPlan: ["Day 1: Launch to Hatiya", "Day 2: Chowdhury khal deer watch", "Day 3: Return"],
	},
];

export type TSeedUserKey =
	| "superadmin"
	| "admin"
	| "admin2"
	| "guide"
	| "guide2"
	| "guide3"
	| "user"
	| "sadia"
	| "rahim"
	| "farhana"
	| "imran"
	| "nabila"
	| "tasnim"
	| "karim";

export interface ISeedUser {
	key: TSeedUserKey;
	name: string;
	email: string;
	role: Role;
	phone: string;
	address: string;
	joinedDaysAgo: number;
	isActive?: IsActive;
}

const email = (local: string) => `${local}@${DEMO_EMAIL_DOMAIN}`;

export const users: ISeedUser[] = [
	{
		key: "superadmin",
		name: "Demo Super Admin",
		email: email("superadmin"),
		role: Role.SUPER_ADMIN,
		phone: "+8801711000000",
		address: "Gulshan, Dhaka",
		joinedDaysAgo: 240,
	},
	{ key: "admin", name: "Nusrat Jahan", email: email("admin"), role: Role.ADMIN, phone: "+8801711000001", address: "Banani, Dhaka", joinedDaysAgo: 210 },
	{ key: "admin2", name: "Fahim Chowdhury", email: email("ops"), role: Role.ADMIN, phone: "+8801711000002", address: "Agrabad, Chattogram", joinedDaysAgo: 120 },
	{ key: "guide", name: "Rafiq Ahmed", email: email("guide"), role: Role.GUIDE, phone: "+8801811000003", address: "Kolatoli, Cox's Bazar", joinedDaysAgo: 190 },
	{ key: "guide2", name: "Tanvir Hasan", email: email("guide.sylhet"), role: Role.GUIDE, phone: "+8801811000004", address: "Zindabazar, Sylhet", joinedDaysAgo: 175 },
	{ key: "guide3", name: "Mitu Akter", email: email("guide.khulna"), role: Role.GUIDE, phone: "+8801811000005", address: "Sonadanga, Khulna", joinedDaysAgo: 150 },
	{ key: "user", name: "Arif Hossain", email: email("user"), role: Role.USER, phone: "+8801911000006", address: "Dhanmondi, Dhaka", joinedDaysAgo: 160 },
	{ key: "sadia", name: "Sadia Islam", email: email("sadia"), role: Role.USER, phone: "+8801911000007", address: "Mirpur, Dhaka", joinedDaysAgo: 140 },
	{ key: "rahim", name: "Rahim Uddin", email: email("rahim"), role: Role.USER, phone: "+8801911000008", address: "Shaheb Bazar, Rajshahi", joinedDaysAgo: 110 },
	{ key: "farhana", name: "Farhana Rahman", email: email("farhana"), role: Role.USER, phone: "+8801911000009", address: "Uttara, Dhaka", joinedDaysAgo: 95 },
	{ key: "imran", name: "Imran Kabir", email: email("imran"), role: Role.USER, phone: "+8801911000010", address: "Khulshi, Chattogram", joinedDaysAgo: 60 },
	{ key: "nabila", name: "Nabila Ahmed", email: email("nabila"), role: Role.USER, phone: "+8801911000011", address: "Amberkhana, Sylhet", joinedDaysAgo: 34 },
	{ key: "tasnim", name: "Tasnim Ferdous", email: email("tasnim"), role: Role.USER, phone: "+8801911000012", address: "Gulshan, Dhaka", joinedDaysAgo: 12 },
	{
		key: "karim",
		name: "Karim Sheikh",
		email: email("karim"),
		role: Role.USER,
		phone: "+8801911000013",
		address: "Boyra, Khulna",
		joinedDaysAgo: 80,
		isActive: IsActive.BLOCKED,
	},
];

export interface ISeedGuideApplication {
	user: TSeedUserKey;
	division: string;
	experienceYears: number;
	languages: string[];
	message: string;
	status: "PENDING" | "APPROVED" | "REJECTED";
	daysAgo: number;
	reviewNote?: string;
}

export const guideApplications: ISeedGuideApplication[] = [
	{
		user: "guide",
		division: "Chattogram",
		experienceYears: 6,
		languages: ["Bangla", "English", "Chakma"],
		message: "I have led beach and hill groups in Cox's Bazar and Bandarban for six years and know every Marine Drive stop.",
		status: "APPROVED",
		daysAgo: 185,
	},
	{
		user: "guide2",
		division: "Sylhet",
		experienceYears: 4,
		languages: ["Bangla", "English", "Sylheti"],
		message: "Born in Sylhet. I run boat trips in Ratargul and Tanguar Haor and tea garden walks in Sreemangal.",
		status: "APPROVED",
		daysAgo: 170,
	},
	{
		user: "guide3",
		division: "Khulna",
		experienceYears: 3,
		languages: ["Bangla", "English"],
		message: "Licensed Sundarbans guide, three seasons on cruise ships out of Khulna and Mongla.",
		status: "APPROVED",
		daysAgo: 145,
	},
	{
		user: "rahim",
		division: "Rajshahi",
		experienceYears: 2,
		languages: ["Bangla", "English"],
		message: "History graduate from Rajshahi University. I can guide Paharpur, Puthia and the Varendra museum.",
		status: "PENDING",
		daysAgo: 2,
	},
	{
		user: "nabila",
		division: "Sylhet",
		experienceYears: 1,
		languages: ["Bangla", "English", "Hindi"],
		message: "I organise university trips to Jaflong and Lalakhal and would like to guide families.",
		status: "PENDING",
		daysAgo: 1,
	},
	{
		user: "farhana",
		division: "Dhaka",
		experienceYears: 0,
		languages: ["Bangla"],
		message: "I love Old Dhaka food and would like to start guiding food walks.",
		status: "REJECTED",
		daysAgo: 40,
		reviewNote: "Thanks for applying! Please apply again after you have some guiding experience.",
	},
];

export type TSeedBookingStatus = "COMPLETE" | "CANCEL" | "FAILED";

export interface ISeedBooking {
	user: TSeedUserKey;
	tour: string;
	guests: number;
	status: TSeedBookingStatus;
	daysAgo: number;
	guide?: TSeedUserKey;
}

// COMPLETE bookings without a guide are left on purpose so the admin can show "assign guide" live.
export const bookings: ISeedBooking[] = [
	// main demo user — Arif
	{ user: "user", tour: "coxs-bazar", guests: 2, status: "COMPLETE", daysAgo: 12, guide: "guide" },
	{ user: "user", tour: "sreemangal", guests: 3, status: "COMPLETE", daysAgo: 4, guide: "guide2" },
	{ user: "user", tour: "tanguar-haor", guests: 2, status: "COMPLETE", daysAgo: 52, guide: "guide2" },
	{ user: "user", tour: "nijhum-dwip", guests: 1, status: "COMPLETE", daysAgo: 95 },
	{ user: "user", tour: "sajek", guests: 2, status: "CANCEL", daysAgo: 3 },
	{ user: "user", tour: "sundarbans", guests: 1, status: "FAILED", daysAgo: 20 },

	// other travellers — spread over ~6 months for the analytics charts
	{ user: "sadia", tour: "saint-martin", guests: 2, status: "COMPLETE", daysAgo: 1, guide: "guide" },
	{ user: "sadia", tour: "old-dhaka", guests: 4, status: "COMPLETE", daysAgo: 9 },
	{ user: "sadia", tour: "tanguar-haor", guests: 3, status: "COMPLETE", daysAgo: 60, guide: "guide2" },
	{ user: "sadia", tour: "kuakata", guests: 2, status: "CANCEL", daysAgo: 33 },
	{ user: "rahim", tour: "paharpur", guests: 3, status: "COMPLETE", daysAgo: 6 },
	{ user: "rahim", tour: "bandarban", guests: 2, status: "COMPLETE", daysAgo: 27, guide: "guide" },
	{ user: "rahim", tour: "nijhum-dwip", guests: 2, status: "COMPLETE", daysAgo: 120 },
	{ user: "farhana", tour: "sundarbans", guests: 2, status: "COMPLETE", daysAgo: 15, guide: "guide3" },
	{ user: "farhana", tour: "bagerhat", guests: 3, status: "COMPLETE", daysAgo: 2 },
	{ user: "farhana", tour: "coxs-bazar", guests: 2, status: "COMPLETE", daysAgo: 150 },
	{ user: "imran", tour: "kaptai", guests: 4, status: "COMPLETE", daysAgo: 3 },
	{ user: "imran", tour: "sajek", guests: 2, status: "COMPLETE", daysAgo: 22, guide: "guide" },
	{ user: "imran", tour: "inani-himchari", guests: 5, status: "COMPLETE", daysAgo: 0 },
	{ user: "imran", tour: "dinajpur", guests: 2, status: "FAILED", daysAgo: 8 },
	{ user: "nabila", tour: "ratargul", guests: 3, status: "COMPLETE", daysAgo: 5 },
	{ user: "nabila", tour: "jaflong", guests: 2, status: "COMPLETE", daysAgo: 18, guide: "guide2" },
	{ user: "tasnim", tour: "kuakata", guests: 2, status: "COMPLETE", daysAgo: 7 },
	{ user: "tasnim", tour: "birishiri", guests: 3, status: "COMPLETE", daysAgo: 1 },
	{ user: "tasnim", tour: "barishal-guava", guests: 2, status: "CANCEL", daysAgo: 10 },
	{ user: "karim", tour: "sundarbans", guests: 2, status: "COMPLETE", daysAgo: 75 },
	{ user: "karim", tour: "sonargaon", guests: 4, status: "COMPLETE", daysAgo: 100 },
	{ user: "sadia", tour: "sreemangal", guests: 2, status: "COMPLETE", daysAgo: 130 },
	{ user: "imran", tour: "saint-martin", guests: 3, status: "COMPLETE", daysAgo: 170 },
	{ user: "rahim", tour: "ratargul", guests: 2, status: "COMPLETE", daysAgo: 45 },
];
