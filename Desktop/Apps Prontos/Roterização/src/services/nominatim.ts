import { SearchResult } from "@/types/route";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

export interface SearchAddressOptions {
  limit?: number;
  countryCodes?: string;
}

export async function searchAddress(query: string, options: SearchAddressOptions = {}): Promise<SearchResult[]> {
  if (!query || query.length < 3) return [];

  const { limit = 5, countryCodes } = options;

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: String(limit),
    });

    if (countryCodes) {
      params.set("countrycodes", countryCodes);
    }

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
      headers: {
        "User-Agent": "RoutePlannerApp/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to search address");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Nominatim search error:", error);
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          "User-Agent": "RoutePlannerApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to reverse geocode");
    }

    const data = await response.json();
    return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}
