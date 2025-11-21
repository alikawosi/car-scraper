import { SearchCriteria } from "@/lib/types";

export function criteriaToParams(criteria: SearchCriteria): URLSearchParams {
  const params = new URLSearchParams();
  
  // Helper to set param if value exists
  const set = (key: string, val: string | number | boolean | undefined | null) => {
    if (val !== undefined && val !== null && val !== "") {
      params.set(key, String(val));
    }
  };

  set("postcode", criteria.postcode);
  set("make", criteria.make);
  set("model", criteria.model);
  set("radius", criteria.radius);
  set("minPrice", criteria.minPrice);
  set("maxPrice", criteria.maxPrice);
  set("minYear", criteria.minYear);
  set("maxYear", criteria.maxYear);
  set("minMileage", criteria.minMileage);
  set("maxMileage", criteria.maxMileage);
  set("minEngineSize", criteria.minEngineSize);
  set("maxEngineSize", criteria.maxEngineSize);
  set("fuelType", criteria.fuelType);
  set("bodyType", criteria.bodyType);
  set("sellerType", criteria.sellerType);
  set("sort", criteria.sort);
  set("limit", criteria.limit);
  
  // Arrays
  if (criteria.transmissions?.length) {
      criteria.transmissions.forEach(t => params.append("transmissions", t));
  }
  if (criteria.doors) set("doors", criteria.doors);
  if (criteria.seats) set("seats", criteria.seats);

  return params;
}

export function paramsToCriteria(searchParams: URLSearchParams): SearchCriteria {
  const getNum = (key: string) => {
      const val = searchParams.get(key);
      return val ? Number(val) : undefined;
  };
  
  const getStr = (key: string) => searchParams.get(key) || undefined;

  return {
    postcode: getStr("postcode"),
    make: getStr("make"),
    model: getStr("model"),
    radius: getNum("radius"),
    minPrice: getNum("minPrice"),
    maxPrice: getNum("maxPrice"),
    minYear: getNum("minYear"),
    maxYear: getNum("maxYear"),
    minMileage: getNum("minMileage"),
    maxMileage: getNum("maxMileage"),
    minEngineSize: getNum("minEngineSize"),
    maxEngineSize: getNum("maxEngineSize"),
    fuelType: getStr("fuelType"),
    bodyType: getStr("bodyType"),
    sellerType: getStr("sellerType") as SearchCriteria["sellerType"],
    sort: getStr("sort"),
    limit: getNum("limit"),
    transmissions: searchParams.getAll("transmissions"),
    doors: getNum("doors"),
    seats: getNum("seats"),
  };
}

