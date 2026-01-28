import { normalizeAddress, normalizeCep, normalizeString } from "@/lib/normalization";
import { CustomerRecord } from "@/types/customer";
import { OrderSupabaseRow } from "@/types/order";
import { searchAddress, SearchAddressOptions } from "@/services/nominatim";
import {
  buildGeocodeCacheKey,
  getGeocodeCacheRecord,
  updateCustomerGeocode,
  updateOrderGeocode,
  upsertGeocodeCacheRecord,
  updateCustomerTransportadoraGeocode,
  updateOrdersTransportadora,
} from "@/services/supabaseData";

type Coordinates = { lat: number; lon: number };

type CacheKey = `${string}:${string}`;

type CacheValue = Coordinates | null;

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/search";
const DEFAULT_CEP = "13054-703";
const ROUTE_DEFAULT_COORDS: Record<string, Coordinates> = {
  "ENTREGAS ZINCOLOR": { lat: -22.989473229980398, lon: -47.11499624654793 },
};
const REQUEST_DELAY_MS = 900;

const BRAZIL_BOUNDS = {
  minLat: -34,
  maxLat: 6,
  minLon: -74,
  maxLon: -28,
};

function isWithinBrazil(coords: Coordinates | null): coords is Coordinates {
  if (!coords) return false;
  const { lat, lon } = coords;
  return (
    lat >= BRAZIL_BOUNDS.minLat &&
    lat <= BRAZIL_BOUNDS.maxLat &&
    lon >= BRAZIL_BOUNDS.minLon &&
    lon <= BRAZIL_BOUNDS.maxLon
  );
}

function sanitizeCoordinates(coords: Coordinates | null): Coordinates | null {
  if (!coords) return null;
  return isWithinBrazil(coords) ? coords : null;
}

const cache = new Map<CacheKey, CacheValue>();

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCityState(value: unknown): { city?: string | null; state?: string | null } {
  if (typeof value !== "string") {
    return {};
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return {};
  }

  const normalizedWhitespace = cleaned.replace(/\s+/g, " ");
  const parts = normalizedWhitespace.split(/[-,]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return {};
  }

  let city = parts[0] || null;
  let state: string | null = null;

  const lastPart = parts[parts.length - 1];
  if (/^[A-Za-z]{2}$/.test(lastPart)) {
    state = lastPart.toUpperCase();
    if (parts.length > 1) {
      city = parts.slice(0, -1).join(" ") || city;
    }
  }

  return { city, state };
}

export async function geocodeTransportadora(customer: CustomerRecord): Promise<GeocodeCustomerResult> {
  if (!customer.use_transportadora) {
    await updateCustomerTransportadoraGeocode(customer.id, {
      lat: null,
      lon: null,
      geocoded: false,
    });
    return { id: customer.id, coords: null, cep: null };
  }

  const cepCandidate = normalizeCep(customer.transportadora_cep || null);
  const address = buildTransportadoraAddress(customer);

  const cacheKey = buildGeocodeCacheKey({
    entityType: "transportadora",
    shortName: customer.short_name,
    cep: customer.transportadora_cep,
    address,
    city: customer.transportadora_city,
    state: customer.transportadora_state,
  });

  if (!cepCandidate && !address) {
    throw new Error("Informe pelo menos o CEP ou o endereço completo da transportadora.");
  }

  const cached = await getGeocodeCacheRecord(cacheKey);
  const cachedCoords = cached && cached.lat !== null && cached.lon !== null
    ? sanitizeCoordinates({ lat: cached.lat, lon: cached.lon })
    : null;
  if (cachedCoords) {
    await updateCustomerTransportadoraGeocode(customer.id, {
      lat: cachedCoords.lat,
      lon: cachedCoords.lon,
      geocoded: true,
    });
    await updateOrdersTransportadora(customer.short_name, {
      lat: cachedCoords.lat,
      lon: cachedCoords.lon,
      geocoded: true,
      cep: cacheKey.cepNormalized || null,
    });
    return { id: customer.id, coords: cachedCoords, cep: cacheKey.cepNormalized || null };
  }

  if (cepCandidate) {
    const coords = await geocodeByCep(cepCandidate, {
      city: customer.transportadora_city,
      state: customer.transportadora_state,
    });
    if (coords) {
      await updateCustomerTransportadoraGeocode(customer.id, {
        lat: coords.lat,
        lon: coords.lon,
        geocoded: true,
      });
      await updateOrdersTransportadora(customer.short_name, {
        lat: coords.lat,
        lon: coords.lon,
        geocoded: true,
        cep: cepCandidate,
      });
      await upsertGeocodeCacheRecord(cacheKey, {
        lat: coords.lat,
        lon: coords.lon,
        provider: "cep",
      });
      return { id: customer.id, coords, cep: cepCandidate };
    }
  }

  if (address) {
    let coords = await geocodeWithORS(address);
    if (!coords) {
      coords = await geocodeWithNominatim(address);
    }
    if (coords) {
      await updateCustomerTransportadoraGeocode(customer.id, {
        lat: coords.lat,
        lon: coords.lon,
        geocoded: true,
      });
      await updateOrdersTransportadora(customer.short_name, {
        lat: coords.lat,
        lon: coords.lon,
        geocoded: true,
        cep: cepCandidate ?? customer.transportadora_cep ?? null,
      });
      await upsertGeocodeCacheRecord(cacheKey, {
        lat: coords.lat,
        lon: coords.lon,
        provider: "address",
      });
      return {
        id: customer.id,
        coords,
        cep: cepCandidate ?? customer.transportadora_cep ?? null,
      };
    }
  }

  await updateCustomerTransportadoraGeocode(customer.id, {
    lat: null,
    lon: null,
    geocoded: false,
  });
  throw new Error("Não foi possível geocodificar a transportadora informada.");
}

export type GeocodeStage = "clientes" | "pedidos";

export interface GeocodeProgressUpdate {
  stage: GeocodeStage;
  processed: number;
  total: number;
  label?: string;
}

export interface GeocodeSummary {
  customers: {
    total: number;
    geocoded: number;
    failed: number;
  };
  orders: {
    total: number;
    geocoded: number;
    failed: number;
    reusedFromCustomer: number;
  };
}

export interface GeocodeCustomersSummary {
  total: number;
  geocoded: number;
  failed: number;
}

export async function geocodeCustomersBatch(customers: CustomerRecord[]): Promise<GeocodeCustomersSummary> {
  const customersToProcess = customers.filter((customer) => !customer.geocoded || customer.lat === null || customer.lon === null);

  const summary: GeocodeCustomersSummary = {
    total: customersToProcess.length,
    geocoded: 0,
    failed: 0,
  };

  for (const customer of customersToProcess) {
    try {
      const result = await geocodeCustomer(customer);
      if (result.coords) {
        summary.geocoded += 1;
      } else {
        summary.failed += 1;
      }
    } catch (error) {
      summary.failed += 1;
      console.error(`Falha ao geocodificar cliente ${customer.short_name}:`, error);
    }
  }

  return summary;
}

interface GeocodePendingOptions {
  orders: OrderSupabaseRow[];
  customers: CustomerRecord[];
  onProgress?: (update: GeocodeProgressUpdate) => void;
}

export async function geocodePendingOrders({ orders, customers, onProgress }: GeocodePendingOptions): Promise<GeocodeSummary> {
  const customerMap = new Map<string, CustomerRecord>();
  customers.forEach((customer) => {
    customerMap.set(normalizeString(customer.short_name), { ...customer });
  });

  const customersToProcess = customers.filter((customer) => !customer.geocoded || customer.lat === null || customer.lon === null);
  const customerSummary = {
    total: customersToProcess.length,
    geocoded: 0,
    failed: 0,
  };

  for (let index = 0; index < customersToProcess.length; index++) {
    const customer = customersToProcess[index];
    onProgress?.({ stage: "clientes", processed: index, total: customersToProcess.length, label: customer.name });

    try {
      const result = await geocodeCustomer(customer);
      if (result.coords) {
        customerSummary.geocoded += 1;
        const updated: CustomerRecord = {
          ...customer,
          lat: result.coords.lat,
          lon: result.coords.lon,
          geocoded: true,
        };
        customerMap.set(normalizeString(customer.short_name), updated);
      } else {
        customerSummary.failed += 1;
      }
    } catch (error) {
      console.error(`Erro ao geocodificar cliente ${customer.short_name}:`, error);
      customerSummary.failed += 1;
    }

    onProgress?.({ stage: "clientes", processed: index + 1, total: customersToProcess.length, label: customer.name });
  }

  const ordersToProcess = orders.filter((order) => !order.geocoded || order.lat === null || order.lon === null);
  const orderSummary = {
    total: ordersToProcess.length,
    geocoded: 0,
    failed: 0,
    reusedFromCustomer: 0,
  };

  for (let index = 0; index < ordersToProcess.length; index++) {
    const order = ordersToProcess[index];
    onProgress?.({ stage: "pedidos", processed: index, total: ordersToProcess.length, label: order.cliente ?? order.raw_data?.Cliente });

    try {
      const customer = customerMap.get(normalizeString(order.customer_short_name));
      const result = await geocodeOrder(order, customer);
      if (result.coords) {
        orderSummary.geocoded += 1;
        if (result.reusedFromCustomer) {
          orderSummary.reusedFromCustomer += 1;
        }
      } else {
        orderSummary.failed += 1;
      }
    } catch (error) {
      console.error(`Erro ao geocodificar pedido ${order.id}:`, error);
      orderSummary.failed += 1;
    }

    onProgress?.({ stage: "pedidos", processed: index + 1, total: ordersToProcess.length, label: order.cliente ?? order.raw_data?.Cliente });
  }

  return {
    customers: customerSummary,
    orders: orderSummary,
  };
}

function buildCacheKey(namespace: string, value: string): CacheKey {
  return `${namespace}:${value}`;
}

function getCached(namespace: string, value: string): CacheValue | undefined {
  return cache.get(buildCacheKey(namespace, value));
}

function setCached(namespace: string, value: string, result: CacheValue) {
  cache.set(buildCacheKey(namespace, value), result);
}

async function geocodeWithORS(query: string): Promise<Coordinates | null> {
  if (!ORS_API_KEY) return null;

  const normalized = normalizeString(query);
  const cached = getCached("ors", normalized);
  if (cached !== undefined) return cached;

  await wait(REQUEST_DELAY_MS);

  try {
    const response = await fetch(
      `${ORS_GEOCODE_URL}?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&boundary.country=BR&size=1`,
      {
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      throw new Error(`OpenRouteService retornou status ${response.status}`);
    }

    const data = await response.json();
    const coordinates = data?.features?.[0]?.geometry?.coordinates;
    let result: Coordinates | null = null;
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const [lon, lat] = coordinates;
      result = sanitizeCoordinates({ lat, lon });
    }

    setCached("ors", normalized, result);
    if (result) {
      return result;
    }

    return null;
  } catch (error) {
    console.warn(`Falha na geocodificação ORS para "${query}":`, error);
    setCached("ors", normalized, null);
    return null;
  }
}

async function geocodeWithNominatim(query: string): Promise<Coordinates | null> {
  const normalized = normalizeString(query);
  const cached = getCached("nominatim", normalized);
  if (cached !== undefined) return cached;

  await wait(REQUEST_DELAY_MS);

  try {
    const results = await searchAddress(query, { limit: 1, countryCodes: "br" });
    let coords: Coordinates | null = null;
    if (results.length > 0) {
      const lat = parseFloat(results[0].lat);
      const lon = parseFloat(results[0].lon);
      coords = sanitizeCoordinates({ lat, lon });
    }

    setCached("nominatim", normalized, coords);
    if (coords) {
      return coords;
    }

    return null;
  } catch (error) {
    console.error(`Falha na geocodificação Nominatim para "${query}":`, error);
    setCached("nominatim", normalized, null);
    return null;
  }
}

async function geocodeByCep(
  cep: string | null | undefined,
  context?: { city?: string | null; state?: string | null },
): Promise<Coordinates | null> {
  if (!cep) return null;
  const normalizedCep = normalizeCep(cep);
  if (!normalizedCep) return null;

  const numericKey = normalizedCep.replace(/[^0-9]/g, "");
  const cached = getCached("cep", numericKey);
  if (cached !== undefined) return cached;

  const city = normalizeString(context?.city ?? "");
  const state = normalizeString(context?.state ?? "");
  const queryParts = [numericKey];
  if (city) queryParts.push(city);
  if (state) queryParts.push(state);
  queryParts.push("Brasil");
  const contextualQuery = queryParts.filter(Boolean).join(", ");

  let coords = await geocodeWithORS(contextualQuery);
  if (!coords) {
    coords = await geocodeWithNominatim(contextualQuery);
  }

  if (!coords) {
    coords = await geocodeWithORS(normalizedCep);
  }

  if (!coords) {
    coords = await geocodeWithNominatim(normalizedCep);
  }

  const sanitized = sanitizeCoordinates(coords);
  setCached("cep", numericKey, sanitized);
  return sanitized;
}

function buildCustomerAddress(customer: CustomerRecord): string | null {
  const parts = [customer.address, customer.city, customer.state].filter(Boolean) as string[];
  if (parts.length === 0) return null;
  return normalizeAddress(parts);
}

function buildTransportadoraAddress(customer: CustomerRecord): string | null {
  const parts = [customer.transportadora_address, customer.transportadora_city, customer.transportadora_state]
    .filter(Boolean)
    .map((value) => value!.toString().trim())
    .filter((value) => value.length > 0) as string[];
  if (parts.length === 0) {
    return null;
  }
  return normalizeAddress(parts);
}

function buildOrderAddress(order: OrderSupabaseRow, customer?: CustomerRecord): string | null {
  const raw = order.raw_data;
  const localEntrega = typeof raw["Local Entrega"] === "string" ? raw["Local Entrega"].trim() : "";
  const cidadeEntrega = typeof raw["Cidade Entrega"] === "string" ? raw["Cidade Entrega"].trim() : "";
  const cidadeFormatada = cidadeEntrega.replace(/\s*-\s*/, ", ");

  const parts: string[] = [];
  if (localEntrega) parts.push(localEntrega);
  if (cidadeFormatada) {
    parts.push(cidadeFormatada);
  } else if (customer?.city || customer?.state) {
    parts.push([customer?.city, customer?.state].filter(Boolean).join(", "));
  }

  if (parts.length === 0) return null;
  return normalizeAddress(parts);
}

interface GeocodeCustomerResult {
  id: string;
  coords: Coordinates | null;
  cep: string | null;
}

export async function geocodeCustomer(customer: CustomerRecord): Promise<GeocodeCustomerResult> {
  const cepCandidate = normalizeCep(customer.cep || null);
  const cacheKey = buildGeocodeCacheKey({
    entityType: "customer",
    shortName: customer.short_name,
    cep: customer.cep,
    address: customer.address,
    city: customer.city,
    state: customer.state,
  });

  const cached = await getGeocodeCacheRecord(cacheKey);
  const cachedCoords = cached && cached.lat !== null && cached.lon !== null
    ? sanitizeCoordinates({ lat: cached.lat, lon: cached.lon })
    : null;
  if (cachedCoords) {
    await updateCustomerGeocode(customer.id, { lat: cachedCoords.lat, lon: cachedCoords.lon, geocoded: true });
    return { id: customer.id, coords: cachedCoords, cep: cacheKey.cepNormalized || null };
  }

  if (cepCandidate) {
    const coords = await geocodeByCep(cepCandidate, {
      city: customer.city,
      state: customer.state,
    });
    if (coords) {
      await updateCustomerGeocode(customer.id, { lat: coords.lat, lon: coords.lon, geocoded: true });
      await upsertGeocodeCacheRecord(cacheKey, {
        lat: coords.lat,
        lon: coords.lon,
        provider: "cep",
      });
      return { id: customer.id, coords, cep: cepCandidate };
    }
  }

  const address = buildCustomerAddress(customer);
  if (address) {
    let coords = await geocodeWithORS(address);
    if (!coords) {
      coords = await geocodeWithNominatim(address);
    }
    if (coords) {
      await updateCustomerGeocode(customer.id, { lat: coords.lat, lon: coords.lon, geocoded: true });
      await upsertGeocodeCacheRecord(cacheKey, {
        lat: coords.lat,
        lon: coords.lon,
        provider: "address",
      });
      return { id: customer.id, coords, cep: cepCandidate ?? null };
    }
  }

  await updateCustomerGeocode(customer.id, { lat: null, lon: null, geocoded: false });
  return { id: customer.id, coords: null, cep: cepCandidate ?? null };
}

interface GeocodeOrderResult {
  id: string;
  coords: Coordinates | null;
  cep: string | null;
  reusedFromCustomer: boolean;
  error?: string;
}

export async function geocodeOrder(order: OrderSupabaseRow, customer?: CustomerRecord): Promise<GeocodeOrderResult> {
  const rotaNormalizada = normalizeString(order.rota_normalizada || order.rota || order.raw_data.Rota || "");
  let cepCandidate = normalizeCep(order.cep || order.raw_data["CEP"] || order.raw_data["Cep"] || order.raw_data["CEP Entrega"]);
  if (!cepCandidate && rotaNormalizada === "ENTREGAS ZINCOLOR") {
    cepCandidate = DEFAULT_CEP;
  }

  const predefinedCoords = ROUTE_DEFAULT_COORDS[rotaNormalizada];
  if (predefinedCoords) {
    await updateOrderGeocode(order.id, {
      lat: predefinedCoords.lat,
      lon: predefinedCoords.lon,
      geocoded: true,
      cep: cepCandidate ?? customer?.cep ?? DEFAULT_CEP,
    });
    return {
      id: order.id,
      coords: predefinedCoords,
      cep: cepCandidate ?? customer?.cep ?? DEFAULT_CEP,
      reusedFromCustomer: false,
    };
  }

  if (customer?.geocoded && customer.lat !== null && customer.lon !== null) {
    await updateOrderGeocode(order.id, {
      lat: customer.lat,
      lon: customer.lon,
      geocoded: true,
      cep: cepCandidate ?? customer.cep ?? null,
    });
    return {
      id: order.id,
      coords: { lat: customer.lat, lon: customer.lon },
      cep: cepCandidate ?? customer.cep ?? null,
      reusedFromCustomer: true,
    };
  }

  const entregaCidadeRaw = typeof order.raw_data["Cidade Entrega"] === "string" ? order.raw_data["Cidade Entrega"] : null;
  const { city: entregaCity, state: entregaState } = parseCityState(entregaCidadeRaw);
  const cepCoords = await geocodeByCep(cepCandidate ?? null, {
    city: entregaCity ?? customer?.city ?? null,
    state: entregaState ?? customer?.state ?? null,
  });
  if (cepCoords) {
    await updateOrderGeocode(order.id, {
      lat: cepCoords.lat,
      lon: cepCoords.lon,
      geocoded: true,
      cep: cepCandidate ?? null,
    });
    return {
      id: order.id,
      coords: cepCoords,
      cep: cepCandidate ?? null,
      reusedFromCustomer: false,
    };
  }

  const address = buildOrderAddress(order, customer);
  if (address) {
    let coords = await geocodeWithORS(address);
    if (!coords) {
      coords = await geocodeWithNominatim(address);
    }
    if (coords) {
      await updateOrderGeocode(order.id, {
        lat: coords.lat,
        lon: coords.lon,
        geocoded: true,
        cep: cepCandidate ?? null,
      });
      return {
        id: order.id,
        coords,
        cep: cepCandidate ?? null,
        reusedFromCustomer: false,
      };
    }
  }

  await updateOrderGeocode(order.id, {
    lat: null,
    lon: null,
    geocoded: false,
    cep: cepCandidate ?? null,
  });
  return {
    id: order.id,
    coords: null,
    cep: cepCandidate ?? null,
    reusedFromCustomer: false,
    error: "Não foi possível geocodificar o endereço",
  };
}
