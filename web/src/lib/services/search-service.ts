import { SearchCriteria, Listing, SearchEvent, SearchOptions, SearchOption } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export class SearchService {
  private static instance: SearchService;
  private optionsCache: SearchOptions | null = null;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public async getSearchOptions(): Promise<SearchOptions> {
    if (this.optionsCache) {
      return this.optionsCache;
    }

    try {
      const [
        { data: makes },
        { data: bodyTypes },
        { data: fuelTypes },
        { data: transmissionTypes },
        { data: doors },
        { data: seats },
        { data: searchRadius },
      ] = await Promise.all([
        supabase.from("makes").select("id, name").order("name"),
        supabase.from("body_types").select("name, display_name").order("display_name"),
        supabase.from("fuel_types").select("name, display_name").order("display_name"),
        supabase.from("transmission_types").select("name, display_name").order("display_name"),
        supabase.from("doors").select("value, display_name").order("value"),
        supabase.from("seats").select("value, display_name").order("value"),
        supabase.from("search_radius").select("value, display_name, sort_order").order("sort_order"),
      ]);

      // Fetch models separately or on demand? For now, let's fetch all models but maybe we should structure them by make.
      // Actually, fetching all models might be too much if there are thousands.
      // Let's just return empty models for now and handle dynamic fetching later, or fetch all if not too many.
      // The file size was 260KB, which is manageable.
      const { data: models } = await supabase.from("models").select("id, name, make_id").order("name");

      const mapToOption = (item: any, valueKey: string, labelKey: string): SearchOption => ({
        value: item[valueKey],
        label: item[labelKey],
      });

      this.optionsCache = {
        makes: (makes || []).map(m => ({ value: m.name, label: m.name, id: m.id })), // Include id for filtering models
        models: (models || []).map(m => ({ value: m.name, label: m.name, ...m })), // Include make_id in extra props
        bodyTypes: (bodyTypes || []).map(b => mapToOption(b, "name", "display_name")),
        fuelTypes: (fuelTypes || []).map(f => mapToOption(f, "name", "display_name")),
        transmissionTypes: (transmissionTypes || []).map(t => mapToOption(t, "name", "display_name")),
        doors: (doors || []).map(d => mapToOption(d, "value", "display_name")),
        seats: (seats || []).map(s => mapToOption(s, "value", "display_name")),
        searchRadius: (searchRadius || []).map(r => mapToOption(r, "value", "display_name")),
      };

      return this.optionsCache;
    } catch (error) {
      console.error("Failed to fetch search options:", error);
      // Return empty options or throw
      return {
        makes: [],
        models: [],
        bodyTypes: [],
        fuelTypes: [],
        transmissionTypes: [],
        doors: [],
        seats: [],
        searchRadius: [],
      };
    }
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
