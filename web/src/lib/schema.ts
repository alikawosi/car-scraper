import { z } from "zod";

export const searchCriteriaSchema = z.object({
  channel: z.string().optional(),
  bodyType: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  minYear: z.number().int().optional(),
  maxYear: z.number().int().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minMileage: z.number().optional(),
  maxMileage: z.number().optional(),
  minEngineSize: z.number().optional(),
  maxEngineSize: z.number().optional(),
  postcode: z.string().optional(),
  radius: z.number().int().optional(),
  colours: z.array(z.string()).optional(),
  transmissions: z.array(z.string()).optional(),
  sellerType: z.enum(["private", "trade"]).optional(),
  fuelType: z.string().optional(),
  doors: z.number().int().optional(),
  seats: z.number().int().optional(),
  sort: z.string().optional(),
  limit: z.number().int().optional(),
  sources: z.array(z.enum(["autotrader", "ebay", "gumtree"])).optional(),
});

export const searchRequestSchema = z.object({
  criteria: searchCriteriaSchema,
});

export type SearchCriteriaInput = z.infer<typeof searchCriteriaSchema>;
