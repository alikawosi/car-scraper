import OpenAI from "openai";

import { CarValuation, ScrapedCar } from "./types";

// File is available globally in Node.js 18+, which this project requires

let cachedClient: OpenAI | null | undefined;

function getClient(): OpenAI | null {
  if (cachedClient === undefined) {
    const apiKey = process.env.OPENAI_API_KEY;
    cachedClient = apiKey ? new OpenAI({ apiKey }) : null;
  }
  return cachedClient;
}

type ResponseContent = {
  text?: string | string[];
};

type ResponseChunk = {
  content?: ResponseContent[];
};

type ResponsePayload = {
  output?: ResponseChunk[];
  choices?: ResponseChunk[];
};

function extractTextFromResponse(
  response: ResponsePayload | undefined | null
): string {
  const chunks: string[] = [];
  const output = response?.output ?? response?.choices ?? [];
  for (const item of output) {
    const content = item?.content ?? [];
    for (const piece of content) {
      if (typeof piece?.text === "string") {
        chunks.push(piece.text);
      } else if (Array.isArray(piece?.text)) {
        chunks.push(piece.text.filter(Boolean).join(" "));
      }
    }
  }
  return chunks.join("\n").trim();
}

export async function readPlateFromImage(image?: string): Promise<string> {
  if (!image) {
    return "UNKNOWN";
  }
  const client = getClient();
  if (!client) {
    return "UNKNOWN";
  }
  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_PLATE_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Extract ONLY the license plate number from this car photo. Return nothing else - just the plate number text, no explanations, no additional text.",
            },
            {
              type: "input_image",
              image_url: image,
              detail: "auto",
            },
          ],
        },
      ],
    });

    const plate = extractTextFromResponse(response as ResponsePayload)
      .replace(/\s+/g, " ")
      .trim();
    return plate || "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

export async function valueCar(
  car: ScrapedCar,
  plate: string
): Promise<CarValuation> {
  const fallback: CarValuation = {
    fair_price: Number((car.price * 0.98).toFixed(2)),
    range_low: Number((car.price * 0.9).toFixed(2)),
    range_high: Number((car.price * 1.05).toFixed(2)),
    confidence: 0.35,
    notes: "Heuristic fallback valuation.",
  };

  const client = getClient();
  if (!client) {
    return fallback;
  }

  const schema = {
    type: "object",
    properties: {
      fair_price: { type: "number" },
      range_low: { type: "number" },
      range_high: { type: "number" },
    },
    required: ["fair_price", "range_low", "range_high"],
    additionalProperties: false,
  };

  const listingSummary = JSON.stringify(
    {
      title: car.title,
      subtitle: car.subtitle,
      price: car.price,
      mileageMiles: car.mileageMiles,
      location: car.location,
      sellerType: car.sellerType,
      licensePlate: plate,
    },
    null,
    2
  );
  console.log("Listing summary", listingSummary);
  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_VALUATION_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are an automotive pricing analyst. Estimate a fair used price and price range only.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Return ONLY a JSON object with fair_price, range_low, and range_high for the following car. Do not include any other fields:\n" +
                listingSummary,
            },
          ],
        },
      ],
      text: { format: { type: "json_schema", name: "valuation", schema } },
    });
    const text = extractTextFromResponse(response as ResponsePayload);
    console.log("Text", text);
    if (text) {
      const parsed = JSON.parse(text) as {
        fair_price: number;
        range_low: number;
        range_high: number;
      };
      // Return only price range, use fallback values for confidence and notes
      return {
        fair_price: parsed.fair_price,
        range_low: parsed.range_low,
        range_high: parsed.range_high,
        confidence: 0.8, // Default confidence when AI provides valuation
        notes: "AI-generated valuation",
      };
    }
    return fallback;
  } catch (error) {
    console.error("Error valuing car");
    console.error(error);
    return fallback;
  }
}
