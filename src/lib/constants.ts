const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from(
  { length: 25 },
  (_, index) => currentYear - index
);

export const PRICE_OPTIONS = [2000, 5000, 10000, 15000, 20000, 30000, 50000];
export const MILEAGE_OPTIONS = [10000, 20000, 40000, 60000, 80000, 100000, 120000];
export const ENGINE_SIZES = [1.0, 1.2, 1.4, 1.6, 2.0, 2.5, 3.0];
export const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 200];
export const LIMIT_OPTIONS = [12, 18, 24, 32];
export const BODY_TYPES = [
  "Hatchback",
  "SUV",
  "Saloon",
  "Estate",
  "Coupe",
  "Convertible",
  "MPV",
];
export const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid"];
export const TRANSMISSION_OPTIONS = ["Automatic", "Manual"];
export const DOOR_OPTIONS = [2, 3, 4, 5];
export const SEAT_OPTIONS = [2, 4, 5, 7];
export const SORT_OPTIONS = [
  { label: "Most recent", value: "most-recent" },
  { label: "Price (low to high)", value: "price-asc" },
  { label: "Price (high to low)", value: "price-desc" },
];

