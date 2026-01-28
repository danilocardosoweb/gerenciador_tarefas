import { useCallback } from "react";

const GEOCODING_CACHE_KEY = "routemaster_geocoding_cache";

interface Coordinates {
  lat: number;
  lon: number;
}

// Cache in memory to avoid repeated localStorage access during a single session
let memoryCache: Record<string, Coordinates> | null = null;

function getCache(): Record<string, Coordinates> {
  if (memoryCache) {
    return memoryCache;
  }
  try {
    const cachedData = localStorage.getItem(GEOCODING_CACHE_KEY);
    memoryCache = cachedData ? JSON.parse(cachedData) : {};
    return memoryCache!;
  } catch (error) {
    console.error("Failed to read geocoding cache:", error);
    return {};
  }
}

function setCache(cache: Record<string, Coordinates>) {
  try {
    localStorage.setItem(GEOCODING_CACHE_KEY, JSON.stringify(cache));
    memoryCache = cache;
  } catch (error) {
    console.error("Failed to save geocoding cache:", error);
  }
}

export function useGeocodingCache() {
  const getCachedCoordinates = useCallback((address: string): Coordinates | null => {
    const normalizedAddress = address.toLowerCase().trim();
    const cache = getCache();
    return cache[normalizedAddress] || null;
  }, []);

  const setCachedCoordinates = useCallback((address: string, coords: Coordinates) => {
    const normalizedAddress = address.toLowerCase().trim();
    const cache = getCache();
    cache[normalizedAddress] = coords;
    setCache(cache);
  }, []);

  return { getCachedCoordinates, setCachedCoordinates };
}