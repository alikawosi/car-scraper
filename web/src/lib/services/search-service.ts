import { SearchCriteria, Listing, SearchEvent } from "@/lib/types";

export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public async search(
    criteria: SearchCriteria,
    onResults: (listings: Listing[]) => void
  ): Promise<void> {
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentListings: Listing[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line) as SearchEvent;
            
            if (event.type === "listings") {
              // Initial batch
              currentListings = event.listings;
              onResults([...currentListings]);
            } else if (event.type === "update") {
              // Update specific listing
              currentListings = currentListings.map(l => 
                l.listingId === event.id 
                  ? { ...l, ...event.update }
                  : l
              );
              onResults([...currentListings]);
            } else if (event.type === "error") {
              console.error("Stream error:", event.message);
            }
          } catch {
            console.warn("Failed to parse stream line:", line);
          }
        }
      }
    } catch (error) {
      console.error("Search service error:", error);
      throw error;
    }
  }
}
