# Tourly — Demo data, demo login আর interview walkthrough

Demo-র জন্য একটা seed script আছে, যেটা ৮টা division, ৬টা tour type, ২০টা tour, ১৩ জন demo user আর ৬ মাসের booking/payment activity বানায়। Demo tour-এর তারিখ পার হয়ে গেলে server নিজেই সেটাকে নতুন তারিখে সরিয়ে দেয়, তাই site কখনো "সব tour expired" দেখায় না।

---

## 1. Demo accounts

সব `@tourly.demo` account-এর password এক: **`Tourly@2026`** (`SEED_DEMO_PASSWORD` দিয়ে বদলানো যায়)।

| Role | Email | নাম | কী দেখাবে |
|---|---|---|---|
| `SUPER_ADMIN` | `.env`-এর `SUPER_ADMIN_EMAIL` | Super admin | সব কিছু + কাউকে `SUPER_ADMIN` বানানো |
| `ADMIN` | `admin@tourly.demo` | Nusrat Jahan | Overview/Analytics, bookings, guide assign, guide applications, users |
| `ADMIN` | `ops@tourly.demo` | Fahim Chowdhury | দ্বিতীয় admin (role list ভরা দেখাতে) |
| `GUIDE` | `guide@tourly.demo` | Rafiq Ahmed (Chattogram) | ৪টা assigned trip (Cox's Bazar, Saint Martin, Bandarban, Sajek) |
| `GUIDE` | `guide.sylhet@tourly.demo` | Tanvir Hasan (Sylhet) | upcoming + past trip (Tanguar Haor) |
| `GUIDE` | `guide.khulna@tourly.demo` | Mitu Akter (Khulna) | Sundarbans trip |
| `USER` | `user@tourly.demo` | Arif Hossain | **মূল demo user**: ২টা upcoming paid trip (guide সহ), ২টা past trip, ১টা cancelled, ১টা failed |
| `USER` | `rahim@tourly.demo` | Rahim Uddin | Guide application **PENDING** (admin approve করে দেখাও) |
| `USER` | `nabila@tourly.demo` | Nabila Ahmed | Guide application **PENDING** (admin reject করে দেখাও) |
| `USER` | `farhana@tourly.demo` | Farhana Rahman | Guide application **REJECTED** (review note সহ) |
| `USER` | `karim@tourly.demo` | Karim Sheikh | **BLOCKED** user — login হবে না |
| `USER` | `sadia@`, `imran@`, `tasnim@tourly.demo` | — | Analytics chart ভরার জন্য বাকি bookings |

> Demo email-গুলোতে আসল mail যায় না। তাই OTP / invoice email দেখাতে হলে নিজের email দিয়ে নতুন account খোলো।

---

## 2. Seed চালানো

```bash
cd server
pnpm seed            # নেই এমন জিনিস তৈরি করে; আবার চালালে duplicate হয় না
pnpm seed:fresh      # আগের demo data (demo user, demo tour, তাদের booking/payment/application) মুছে নতুন করে বানায়
pnpm seed -- --no-upload   # Cloudinary-তে image upload না করে সরাসরি Unsplash URL রাখে
```

Docker / VPS-এ (build-এর পর):

```bash
docker compose exec api node dist/seed-demo.js
docker compose exec api node dist/seed-demo.js --fresh --force   # production-এ --fresh দিতে --force লাগে
```

কী হয়:
- Division আর tour type **নাম দিয়ে** খোঁজে — আগে থাকলে সেটাই ব্যবহার করে, নতুন বানায় না।
- Tour **title দিয়ে** খোঁজে। নতুন tour-এর ছবি Unsplash থেকে নিয়ে Cloudinary-র `tourly/seed/` folder-এ upload হয় (একই ছবি দ্বিতীয়বার upload হয় না)। Unsplash না পেলে placeholder ছবি বসে।
- User, guide application, booking, payment raw insert হয় যাতে `createdAt` পেছনের তারিখে থাকে → Analytics chart-এ ৬ মাসের data দেখায়।
- Demo user-দের booking আগে থেকেই থাকলে activity আবার বানায় না (`--fresh` লাগবে)।
- কিছু `COMPLETE` booking-এ ইচ্ছা করে guide দেওয়া হয়নি, যাতে admin interview-এ live assign করে দেখাতে পারে।

ছবি বদলাতে চাইলে `server/src/scripts/seed/data.ts`-এ tour-এর `images` array-তে Unsplash photo id বদলাও (`unsplash.com/photos/<id>`), তারপর `pnpm seed:fresh`।

---

## 3. Tour date auto-rollover (cron job)

**সমস্যা:** Demo tour-এর তারিখ পার হয়ে গেলে public list-এ আর দেখায় না, book-ও করা যায় না। কয়েক সপ্তাহ পরে কেউ live link খুললে site খালি দেখাবে।

**সমাধান:**
- `Tour`-এ নতুন field `autoRollover` (default `false`)। Seed করা ১৮টা tour-এ `true`; admin-এর বানানো আসল tour কখনো নিজে থেকে সরে না।
- `jobs/rolloverTourDates.ts` server start হলে চালু হয় আর প্রতি `TOUR_ROLLOVER_CHECK_HOURS` (default **৬ ঘণ্টা**) পর পর চলে।
- যেসব `autoRollover` tour-এর `startDate` পার হয়ে গেছে, সেগুলোর নতুন start = **আজ + `TOUR_ROLLOVER_LEAD_DAYS` (৩ দিন) + ০–`TOUR_ROLLOVER_SPREAD_DAYS` (২১) দিন**। সব tour একই দিনে যাতে না পড়ে, তাই spread দেওয়া হয়েছে। Departure-এর সময় (সকাল ৮টা Dhaka) আর trip-এর দৈর্ঘ্য একই থাকে।
- একসাথে একটা `bulkWrite` — যত tour-ই হোক, একটা DB round-trip।
- হাতে চালাতে: `pnpm tours:rollover` (Docker-এ `node dist/rollover-tours.js`)। বন্ধ করতে: `TOUR_ROLLOVER_ENABLED=false`।

ঠিক "প্রতি ৩ দিনে" job না চালিয়ে ৬ ঘণ্টা পর পর check করা হয়েছে, কারণ ৩ দিন পর পর চালালে কোনো tour ৩ দিন পর্যন্ত expired থেকে যেতে পারে। Query-টা খুব হালকা (index: `{ autoRollover, startDate }`), তাই ঘন ঘন চালালেও কোনো খরচ নেই। চাইলে `TOUR_ROLLOVER_CHECK_HOURS=72` দিয়ে ৩ দিন করা যায়।

**Trade-off (interview-এ বলার মতো):** Booking-এ trip-এর তারিখ আলাদা করে রাখা হয় না, tour থেকে পড়া হয়। তাই rolling tour-এর booking সব সময় "upcoming" থাকে। "Past trip" দেখানোর জন্য ২টা tour (`Tanguar Haor`, `Nijhum Dwip`) `autoRollover: false` রেখে অতীতের তারিখে রাখা হয়েছে। আসল production-এ booking-এ trip date-এর snapshot রাখা ভালো।

Server Vercel-এর মতো serverless-এ চললে `setInterval` চলবে না — তখন Vercel Cron বা GitHub Actions schedule দিয়ে `rollover-tours.js` চালাতে হবে। আমাদের deploy Docker/VPS-এ, তাই in-process job ঠিক আছে।

---

## 4. Interview walkthrough (৫–৭ মিনিট)

1. **Home → Tours** (logout অবস্থায়): ১৮টা active tour, division/type/price filter, তারিখ সব ভবিষ্যতে (auto-rollover)।
2. **USER — `user@tourly.demo`**
   - My bookings: Upcoming (Cox's Bazar — guide Rafiq, Sreemangal — guide Tanvir), Past (Tanguar Haor, Nijhum Dwip), Cancelled, Failed → Failed booking-এ "Retry payment"।
   - নতুন tour book → Booking review → SSLCommerz sandbox → Payment success → invoice PDF।
   - Profile / Security / Become a guide form।
3. **ADMIN — `admin@tourly.demo`**
   - Overview + Analytics: ৬ মাসের revenue, bookings, নতুন user chart।
   - Bookings: Arif-এর নতুন booking দেখা যায় → **guide assign** (ওই division-এর approved guide উপরে, তারিখ মিললে conflict দেখায়)। Assign ছাড়া booking: Rahim → Paharpur, Imran → Kaptai, Tasnim → Kuakata।
   - Guide applications: Rahim **approve** (role সাথে সাথে `GUIDE`), Nabila **reject** (note সহ)।
   - Users: role change, Karim blocked।
   - Tours: Active/Expired filter, create/edit tour।
4. **GUIDE — `guide@tourly.demo`**: Upcoming/Past trips, trip details sheet, traveller-এর phone/email (trip-এর কাছাকাছি সময়ে দেখায়)।
5. **SUPER_ADMIN**: admin-কে `SUPER_ADMIN` বানানো যায় শুধু এখান থেকে — RBAC দেখাও।

**বলার মতো technical point:** ৪-role RBAC (`checkAuth`), Mongoose transaction দিয়ে booking + payment একসাথে, ৩০ মিনিটে unpaid booking auto-expire, demo tour auto-rollover job, idempotent seed script (আবার চালালে duplicate হয় না, production-এ ভুল করে data মোছে না)।
