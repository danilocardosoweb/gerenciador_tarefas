import { getSupabaseClient } from "@/lib/supabaseClient";
import { OrderInsertPayload, OrderSupabaseRow, Order } from "@/types/order";
import { CustomerImportRow, CustomerRecord } from "@/types/customer";
import { SavedRoute, RouteOption, Waypoint, RouteMetrics } from "@/types/route";
import { normalizeString, normalizeCep } from "@/lib/normalization";

export type CustomerInsert = Omit<CustomerRecord, "id" | "created_at">;

export interface GeocodeCacheKey {
  entityType: string;
  shortNameNormalized: string;
  cepNormalized: string;
  addressNormalized: string;
  cityNormalized: string;
  stateNormalized: string;
}

type SavedRouteRow = {
  id: string;
  name: string;
  created_at: string;
  route_data: RouteOption;
  saved_route_waypoints: { id: string; position: number; waypoint_data: Waypoint }[];
  route_metrics: {
    total_distance: number;
    total_duration: number;
    waypoint_count: number;
    order_count: number;
    produzido_kg: number;
    embalado_kg: number;
  } | {
    total_distance: number;
    total_duration: number;
    waypoint_count: number;
    order_count: number;
    produzido_kg: number;
    embalado_kg: number;
  }[] | null;
};

function mapSavedRouteRow(row: SavedRouteRow): SavedRoute {
  const waypoints = [...(row.saved_route_waypoints ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((item) => item.waypoint_data);

  let metricsRow: undefined | {
    total_distance: number;
    total_duration: number;
    waypoint_count: number;
    order_count: number;
    produzido_kg: number;
    embalado_kg: number;
  };

  if (Array.isArray(row.route_metrics)) {
    metricsRow = row.route_metrics[0];
  } else if (row.route_metrics) {
    metricsRow = row.route_metrics;
  }

  const metrics: RouteMetrics | undefined = metricsRow
    ? {
        totalDistance: Number(metricsRow.total_distance) || 0,
        totalDuration: Number(metricsRow.total_duration) || 0,
        waypointCount: Number(metricsRow.waypoint_count) || 0,
        orderCount: Number(metricsRow.order_count) || 0,
        produzidoKg: Number(metricsRow.produzido_kg) || 0,
        embaladoKg: Number(metricsRow.embalado_kg) || 0,
      }
    : undefined;

  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    waypoints,
    route: row.route_data,
    metrics,
  };
}

export async function fetchSavedRoutes(): Promise<SavedRoute[]> {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("saved_routes")
    .select(
      `id, name, created_at, route_data,
       saved_route_waypoints(id, position, waypoint_data),
       route_metrics(total_distance, total_duration, waypoint_count, order_count, produzido_kg, embalado_kg)`,
    )
    .order("created_at", { ascending: false })
    .order("position", { ascending: true, referencedTable: "saved_route_waypoints" });

  if (error) {
    throw new Error(`Falha ao carregar rotas salvas: ${error.message}`);
  }

  return (data as SavedRouteRow[] | null)?.map(mapSavedRouteRow) ?? [];
}

export async function saveRoute(payload: SaveRoutePayload): Promise<SavedRoute> {
  const supabase = assertSupabase();

  const { data: routeRow, error: insertError } = await supabase
    .from("saved_routes")
    .insert({
      name: payload.name,
      route_data: payload.route,
    })
    .select("id, name, created_at, route_data")
    .single();

  if (insertError || !routeRow) {
    throw new Error(insertError ? insertError.message : "Não foi possível salvar a rota.");
  }

  const routeId = routeRow.id as string;

  try {
    if (payload.waypoints.length > 0) {
      const waypointRows = payload.waypoints.map((waypoint, index) => ({
        route_id: routeId,
        position: index,
        waypoint_data: waypoint,
      }));

      const { error: waypointError } = await supabase.from("saved_route_waypoints").insert(waypointRows);
      if (waypointError) {
        throw new Error(`Falha ao salvar pontos da rota: ${waypointError.message}`);
      }
    }

    const { error: metricsError } = await supabase.from("route_metrics").insert({
      route_id: routeId,
      total_distance: payload.metrics.totalDistance,
      total_duration: payload.metrics.totalDuration,
      waypoint_count: payload.metrics.waypointCount,
      order_count: payload.metrics.orderCount,
      produzido_kg: payload.metrics.produzidoKg,
      embalado_kg: payload.metrics.embaladoKg,
    });

    if (metricsError) {
      throw new Error(`Falha ao salvar métricas da rota: ${metricsError.message}`);
    }
  } catch (error) {
    await supabase.from("saved_routes").delete().eq("id", routeId);
    throw error;
  }

  return {
    id: routeId,
    name: routeRow.name,
    createdAt: routeRow.created_at,
    waypoints: payload.waypoints,
    route: payload.route,
    metrics: payload.metrics,
  };
}

export async function deleteSavedRoute(id: string): Promise<void> {
  const supabase = assertSupabase();
  const { error } = await supabase.from("saved_routes").delete().eq("id", id);
  if (error) {
    throw new Error(`Falha ao remover rota salva: ${error.message}`);
  }
}

export function buildGeocodeCacheKey(params: {
  entityType: string;
  shortName: string;
  cep?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}): GeocodeCacheKey {
  const { entityType, shortName, cep, address, city, state } = params;
  return {
    entityType: entityType.trim().toLowerCase(),
    shortNameNormalized: normalizeString(shortName),
    cepNormalized: normalizeCep(cep ?? null) ?? "",
    addressNormalized: normalizeString(address ?? ""),
    cityNormalized: normalizeString(city ?? ""),
    stateNormalized: normalizeString(state ?? ""),
  };
}

export async function getGeocodeCacheRecord(key: GeocodeCacheKey): Promise<GeocodeCacheRecord | null> {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("geocode_cache")
    .select("*")
    .match({
      entity_type: key.entityType,
      short_name_normalized: key.shortNameNormalized,
      cep_normalized: key.cepNormalized,
      address: key.addressNormalized,
      city: key.cityNormalized,
      state: key.stateNormalized,
    })
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao consultar cache de geocodificação: ${error.message}`);
  }

  return (data as GeocodeCacheRecord) ?? null;
}

export async function upsertGeocodeCacheRecord(
  key: GeocodeCacheKey,
  payload: GeocodeCacheUpsertPayload,
): Promise<void> {
  const supabase = assertSupabase();
  const { error } = await supabase
    .from("geocode_cache")
    .upsert(
      {
        entity_type: key.entityType,
        short_name_normalized: key.shortNameNormalized,
        cep_normalized: key.cepNormalized,
        address: key.addressNormalized,
        city: key.cityNormalized,
        state: key.stateNormalized,
        lat: payload.lat,
        lon: payload.lon,
        provider: payload.provider ?? null,
        confidence: payload.confidence ?? null,
        metadata: payload.metadata ?? null,
        geocoded_at: payload.geocodedAt ?? new Date().toISOString(),
      },
      {
        onConflict: "entity_type,short_name_normalized,cep_normalized,address,city,state",
      },
    );

  if (error) {
    throw new Error(`Falha ao atualizar cache de geocodificação: ${error.message}`);
  }
}

export interface GeocodeCacheRecord extends GeocodeCacheKey {
  id: string;
  lat: number | null;
  lon: number | null;
  provider: string | null;
  confidence: number | null;
  metadata: Record<string, unknown> | null;
  geocoded_at: string;
  created_at: string;
  updated_at: string;
}

export interface GeocodeCacheUpsertPayload {
  lat: number | null;
  lon: number | null;
  provider?: string | null;
  confidence?: number | null;
  metadata?: Record<string, unknown> | null;
  geocodedAt?: string;
}

export interface SaveRoutePayload {
  name: string;
  route: RouteOption;
  waypoints: Waypoint[];
  metrics: RouteMetrics;
}

function assertSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase não configurado. Verifique as variáveis de ambiente.");
  }
  return client;
}

export async function truncateOrders() {
  const supabase = assertSupabase();
  const { error } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    throw new Error(`Falha ao limpar pedidos: ${error.message}`);
  }
}

export async function truncateCustomers() {
  const supabase = assertSupabase();
  const { error } = await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    throw new Error(`Falha ao limpar clientes: ${error.message}`);
  }
}

export async function clearAllData() {
  await clearSupabaseData({ orders: true, customers: true });
}

export async function clearSupabaseData(options: { orders: boolean; customers: boolean }) {
  const { orders, customers } = options;
  if (!orders && !customers) {
    return;
  }

  if (orders) {
    await truncateOrders();
  }

  if (customers) {
    await truncateCustomers();
  }
}

export async function insertCustomers(customers: CustomerInsert[]) {
  if (customers.length === 0) return;
  const supabase = assertSupabase();
  const payload = customers.map((customer) => ({
    short_name: customer.short_name,
    name: customer.name,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    cep: customer.cep,
    lat: customer.lat,
    lon: customer.lon,
    geocoded: customer.geocoded,
    transportadora_address: customer.transportadora_address ?? null,
    transportadora_city: customer.transportadora_city ?? null,
    transportadora_state: customer.transportadora_state ?? null,
    transportadora_cep: customer.transportadora_cep ?? null,
    transportadora_lat: customer.transportadora_lat ?? null,
    transportadora_lon: customer.transportadora_lon ?? null,
    transportadora_geocoded: customer.transportadora_geocoded ?? false,
    use_transportadora: customer.use_transportadora ?? false,
    raw_data: customer.raw_data,
  }));

  const { error } = await supabase.from("customers").insert(payload);
  if (error) {
    throw new Error(`Falha ao inserir clientes: ${error.message}`);
  }
}

export async function insertOrders(orders: OrderInsertPayload[]) {
  if (orders.length === 0) return;
  const supabase = assertSupabase();
  const { error } = await supabase.from("orders").insert(orders);
  if (error) {
    throw new Error(`Falha ao inserir pedidos: ${error.message}`);
  }
}

export async function fetchOrders(): Promise<OrderSupabaseRow[]> {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_short_name, cliente, data_entrega, rota, rota_normalizada, cep, lat, lon, geocoded, raw_data, created_at")
    .order("cliente", { ascending: true });
  if (error) {
    throw new Error(`Falha ao carregar pedidos: ${error.message}`);
  }
  return data ?? [];
}

export async function fetchCustomers(): Promise<CustomerRecord[]> {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, short_name, name, address, city, state, cep, lat, lon, geocoded, transportadora_address, transportadora_city, transportadora_state, transportadora_cep, transportadora_lat, transportadora_lon, transportadora_geocoded, use_transportadora, raw_data, created_at",
    )
    .order("short_name", { ascending: true });
  if (error) {
    throw new Error(`Falha ao carregar clientes: ${error.message}`);
  }
  return data ?? [];
}

export async function updateOrderGeocode(id: string, payload: { lat: number | null; lon: number | null; geocoded: boolean; cep?: string | null }) {
  const supabase = assertSupabase();
  const { error } = await supabase
    .from("orders")
    .update({
      lat: payload.lat,
      lon: payload.lon,
      geocoded: payload.geocoded,
      cep: payload.cep ?? null,
    })
    .eq("id", id);
  if (error) {
    throw new Error(`Falha ao atualizar geocodificação do pedido ${id}: ${error.message}`);
  }
}

export async function updateCustomerGeocode(id: string, payload: { lat: number | null; lon: number | null; geocoded: boolean }) {
  const supabase = assertSupabase();
  const { error } = await supabase
    .from("customers")
    .update({
      lat: payload.lat,
      lon: payload.lon,
      geocoded: payload.geocoded,
    })
    .eq("id", id);
  if (error) {
    throw new Error(`Falha ao atualizar geocodificação do cliente ${id}: ${error.message}`);
  }
}

export async function updateCustomerTransportadora(
  id: string,
  payload: {
    address: string | null;
    city: string | null;
    state: string | null;
    cep: string | null;
    useTransportadora: boolean;
  },
) {
  const supabase = assertSupabase();
  const { error } = await supabase
    .from("customers")
    .update({
      transportadora_address: payload.address,
      transportadora_city: payload.city,
      transportadora_state: payload.state,
      transportadora_cep: payload.cep,
      use_transportadora: payload.useTransportadora,
      transportadora_geocoded: false,
      transportadora_lat: null,
      transportadora_lon: null,
    })
    .eq("id", id);
  if (error) {
    throw new Error(`Falha ao salvar transportadora do cliente ${id}: ${error.message}`);
  }
}

export async function updateCustomerTransportadoraGeocode(
  id: string,
  payload: { lat: number | null; lon: number | null; geocoded: boolean },
) {
  const supabase = assertSupabase();
  const { error } = await supabase
    .from("customers")
    .update({
      transportadora_lat: payload.lat,
      transportadora_lon: payload.lon,
      transportadora_geocoded: payload.geocoded,
    })
    .eq("id", id);
  if (error) {
    throw new Error(`Falha ao atualizar geocodificação da transportadora do cliente ${id}: ${error.message}`);
  }
}

export async function updateOrdersTransportadora(
  customerShortName: string,
  payload: { lat: number | null; lon: number | null; geocoded: boolean; cep?: string | null },
) {
  const supabase = assertSupabase();
  const { error } = await supabase
    .from("orders")
    .update({
      lat: payload.lat,
      lon: payload.lon,
      geocoded: payload.geocoded,
      cep: payload.cep ?? null,
    })
    .eq("customer_short_name", customerShortName);
  if (error) {
    throw new Error(`Falha ao atualizar pedidos para transportadora de ${customerShortName}: ${error.message}`);
  }
}

export function normalizeShortName(value: string): string {
  return normalizeString(value);
}

export function buildCustomerRecords(rows: CustomerImportRow[]): CustomerInsert[] {
  return rows.map((row) => {
    const shortName = normalizeShortName(row["Nome Abreviado"] || row["Nome"] || "");
    const addressParts = [row["Logradouro"], row["Número"], row["Complemento"], row["Bairro"]]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean);
    const address = addressParts.join(", ");

    return {
      short_name: shortName,
      name: (row["Nome"] || "").toString().trim(),
      address: address || null,
      city: (row["Cidade"] || "").toString().trim() || null,
      state: (row["Estado"] || "").toString().trim() || null,
      cep: normalizeCep(row["CEP"] || null) || null,
      lat: null,
      lon: null,
      geocoded: false,
      transportadora_address: null,
      transportadora_city: null,
      transportadora_state: null,
      transportadora_cep: null,
      transportadora_lat: null,
      transportadora_lon: null,
      transportadora_geocoded: false,
      use_transportadora: false,
      raw_data: row as unknown as Record<string, unknown>,
    };
  });
}

export function customerRecordToInsert(customer: CustomerRecord): CustomerInsert {
  const { id: _id, created_at: _createdAt, ...rest } = customer;
  return rest as CustomerInsert;
}

export function buildOrderRecords(params: {
  orders: Order[];
  customerMap: Map<string, CustomerInsert>;
}): OrderInsertPayload[] {
  const { orders, customerMap } = params;
  return orders.map((order) => {
    const shortName = normalizeShortName(order.Cliente);
    const customer = customerMap.get(shortName);

    const rotaNormalizada = normalizeString(order.Rota);
    const orderRecord = order as unknown as Record<string, unknown>;
    const cepFromOrder = orderRecord["CEP"] ?? orderRecord["Cep"] ?? orderRecord["CEP Entrega"];
    let cep = normalizeCep(cepFromOrder);
    if (!cep && customer?.cep) {
      cep = normalizeCep(customer.cep);
    }
    if (!cep && rotaNormalizada === "ENTREGAS ZINCOLOR") {
      cep = "13054-703";
    }

    const customerLat = typeof customer?.lat === "number" ? customer.lat : null;
    const customerLon = typeof customer?.lon === "number" ? customer.lon : null;
    const orderLat = typeof order.lat === "number" ? order.lat : null;
    const orderLon = typeof order.lon === "number" ? order.lon : null;

    const lat = customerLat ?? orderLat ?? null;
    const lon = customerLon ?? orderLon ?? null;
    const geocodedFromCustomer = Boolean(customer?.geocoded && customerLat !== null && customerLon !== null);
    const geocoded = geocodedFromCustomer || Boolean(order.geocoded && orderLat !== null && orderLon !== null);

    return {
      customer_short_name: shortName,
      cliente: order.Cliente,
      data_entrega: order["Data Entrega"] ?? null,
      rota: order.Rota ?? null,
      rota_normalizada: rotaNormalizada || null,
      cep: cep || null,
      lat,
      lon,
      geocoded,
      raw_data: order,
    };
  });
}
