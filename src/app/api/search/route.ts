import { NextRequest, NextResponse } from "next/server";
import { runSearchGenerator } from "@/lib/pipeline";
import { searchRequestSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = searchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid search payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = runSearchGenerator(parsed.data.criteria);
          
          for await (const event of generator) {
            // Send each event as a JSON line
            const chunk = JSON.stringify(event) + "\n";
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          console.error("Pipeline stream error:", error);
          const errorChunk = JSON.stringify({ 
            type: "error", 
            message: (error as Error).message 
          }) + "\n";
          controller.enqueue(encoder.encode(errorChunk));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("API Route error:", error);
    return NextResponse.json(
      {
        error: "Unable to start search.",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
