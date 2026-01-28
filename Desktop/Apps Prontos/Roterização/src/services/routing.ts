import { RouteResult, Waypoint, MultiRouteResult, RouteOption } from "@/types/route";

const ORS_BASE_URL = "https://api.openrouteservice.org/v2";
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

// --- NOVA FUNÇÃO DE OTIMIZAÇÃO ---
export async function optimizeRoute(
  waypoints: Waypoint[]
): Promise<(MultiRouteResult & { usedFallback?: boolean }) | null> {
  if (waypoints.length < 2) return null;

  const startPoint = waypoints[0];
  const destinations = waypoints.slice(1);

  let optimizedWaypoints: Waypoint[] = [];

  if (ORS_API_KEY) {
    // Lógica de otimização com OpenRouteService (mais precisa)
    try {
      const jobs = destinations.map((wp, index) => ({ id: index, location: [wp.lon, wp.lat] }));
      const vehicles = [
        {
          id: 1,
          profile: "driving-car",
          start: [startPoint.lon, startPoint.lat],
          end: [startPoint.lon, startPoint.lat],
        },
      ];

      // CORREÇÃO: O endpoint de otimização não usa o prefixo /v2
      const response = await fetch(`https://api.openrouteservice.org/optimization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: ORS_API_KEY,
        },
        body: JSON.stringify({ jobs, vehicles }),
      });

      if (!response.ok) throw new Error("ORS Optimization API failed");

      const result = await response.json();
      const optimizedOrder = result.routes[0].steps.filter((step: any) => step.type === "job").map((step: any) => step.job);
      
      const reorderedDestinations = optimizedOrder.map((jobId: number) => destinations[jobId]);
      optimizedWaypoints = [startPoint, ...reorderedDestinations];

    } catch (error) {
      console.error("ORS Optimization failed, falling back to OSRM", error);
      // Se ORS falhar, usa o OSRM como fallback
      optimizedWaypoints = await optimizeWithOSRM(waypoints);
    }
  } else {
    // Lógica de otimização com OSRM (fallback)
    optimizedWaypoints = await optimizeWithOSRM(waypoints);
  }

  // Após otimizar a ordem, calcula as rotas detalhadas
  return calculateMultipleRoutes(optimizedWaypoints);
}

async function optimizeWithOSRM(waypoints: Waypoint[]): Promise<Waypoint[]> {
    const coordinates = waypoints.map((wp) => `${wp.lon},${wp.lat}`).join(";");
    const response = await fetch(
      `https://router.project-osrm.org/trip/v1/driving/${coordinates}?source=first&destination=last&roundtrip=false`
    );
    const data = await response.json();
    if (data.code !== "Ok") {
      console.error("OSRM Trip optimization failed");
      return waypoints; // Retorna a ordem original em caso de erro
    }
    const newOrder = data.waypoints.map((wp: any) => wp.waypoint_index);
    return newOrder.map((index: number) => waypoints[index]);
}


export async function calculateMultipleRoutes(
  waypoints: Waypoint[]
): Promise<(MultiRouteResult & { usedFallback?: boolean }) | null> {
  if (waypoints.length < 2) return null;

  if (!ORS_API_KEY) {
    console.warn("VITE_ORS_API_KEY not set. Falling back to OSRM for multiple routes.");
    const osrmResult = await calculateMultipleRoutesOSRM(waypoints);
    if (osrmResult) {
      return { ...osrmResult, usedFallback: true };
    }
    return null;
  }

  try {
    const routes: RouteOption[] = [];
    const coordinates: [number, number][] = waypoints.map((wp) => [wp.lon, wp.lat]);

    // Rota 1: Mais rápida (fastest)
    const fastestRoute = await fetchRoute(coordinates, "fastest", "Rota Mais Rápida", "Prioriza velocidade e tempo de viagem");
    if (fastestRoute) routes.push(fastestRoute);

    // Rota 2: Mais curta (shortest)
    const shortestRoute = await fetchRoute(coordinates, "shortest", "Rota Mais Curta", "Menor distância percorrida");
    if (shortestRoute) routes.push(shortestRoute);

    // Rota 3: Recomendada (recommended - balanceada)
    const recommendedRoute = await fetchRoute(coordinates, "recommended", "Rota Recomendada", "Equilíbrio entre distância e tempo");
    if (recommendedRoute) routes.push(recommendedRoute);

    if (routes.length === 0) {
      // If ORS failed to return any route, try OSRM as a final fallback
      const osrmResult = await calculateMultipleRoutesOSRM(waypoints);
      if (osrmResult) {
        return { ...osrmResult, usedFallback: true };
      }
      return null;
    }

    return {
      waypoints,
      routes,
      usedFallback: false,
    };
  } catch (error) {
    console.error("Routing error (ORS attempt):", error);
    const osrmResult = await calculateMultipleRoutesOSRM(waypoints);
    if (osrmResult) {
      return { ...osrmResult, usedFallback: true };
    }
    return null;
  }
}

async function fetchRoute(
  coordinates: [number, number][],
  preference: string,
  name: string,
  description: string
): Promise<RouteOption | null> {
  try {
    const response = await fetch(`${ORS_BASE_URL}/directions/driving-car/geojson`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates,
        preference,
        instructions: true,
        units: "km",
      }),
    });

    if (!response.ok) {
      console.warn(`ORS failed for preference ${preference}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const feature = data.features[0];
    const props = feature.properties;

    return {
      id: preference,
      name,
      description,
      totalDistance: props.summary.distance,
      totalDuration: props.summary.duration / 60,
      geometry: feature.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]),
      segments: props.segments.map((seg: any) => ({
        distance: seg.distance,
        duration: seg.duration / 60,
        steps: seg.steps.map((step: any) => ({
          instruction: step.instruction,
          distance: step.distance,
          duration: step.duration / 60,
        })),
      })),
    };
  } catch (error) {
    console.error(`Error fetching ${preference} route from ORS:`, error);
    return null;
  }
}

async function calculateMultipleRoutesOSRM(waypoints: Waypoint[]): Promise<MultiRouteResult | null> {
  try {
    const coordinates = waypoints.map((wp) => `${wp.lon},${wp.lat}`).join(";");
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true&alternatives=2`
    );

    if (!response.ok) {
      console.error("OSRM routing failed:", response.statusText);
      return null;
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const routes: RouteOption[] = data.routes.slice(0, 3).map((route: any, index: number) => ({
      id: `osrm-${index}`,
      name: index === 0 ? "Rota Principal (OSRM)" : `Rota Alternativa ${index} (OSRM)`,
      description: index === 0 ? "Rota recomendada pelo OSRM" : `Opção alternativa ${index}`,
      totalDistance: route.distance / 1000,
      totalDuration: route.duration / 60,
      geometry: route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]),
      segments: route.legs.map((leg: any) => ({
        distance: leg.distance / 1000,
        duration: leg.duration / 60,
        steps: leg.steps.map((step: any) => ({
          instruction: step.maneuver.instruction || "Continue",
          distance: step.distance / 1000,
          duration: step.duration / 60,
        })),
      })),
    }));

    return {
      waypoints,
      routes
    };
  } catch (error) {
    console.error("OSRM fallback error:", error);
    return null;
  }
}

// Keeping calculateRoute and calculateRouteOSRM for completeness, although calculateMultipleRoutes is used in Index.tsx
export async function calculateRoute(waypoints: Waypoint[]): Promise<RouteResult | null> {
  if (waypoints.length < 2) return null;

  if (!ORS_API_KEY) {
    return calculateRouteOSRM(waypoints);
  }

  try {
    const coordinates = waypoints.map((wp) => [wp.lon, wp.lat]);

    const response = await fetch(`${ORS_BASE_URL}/directions/driving-car/geojson`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates,
        instructions: true,
        units: "km",
      }),
    });

    if (!response.ok) {
      // Fallback to OSRM if ORS fails
      return calculateRouteOSRM(waypoints);
    }

    const data = await response.json();
    const feature = data.features[0];
    const props = feature.properties;

    return {
      waypoints,
      totalDistance: props.summary.distance, // Convert to km
      totalDuration: props.summary.duration / 60, // Convert to minutes
      geometry: feature.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]),
      segments: props.segments.map((seg: any) => ({
        distance: seg.distance,
        duration: seg.duration / 60,
        steps: seg.steps.map((step: any) => ({
          instruction: step.instruction,
          distance: step.distance,
          duration: step.duration / 60,
        })),
      })),
    };
  } catch (error) {
    console.error("Routing error:", error);
    return calculateRouteOSRM(waypoints);
  }
}

async function calculateRouteOSRM(waypoints: Waypoint[]): Promise<RouteResult | null> {
  try {
    const coordinates = waypoints.map((wp) => `${wp.lon},${wp.lat}`).join(";");
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`
    );

    if (!response.ok) {
      throw new Error("OSRM routing failed");
    }

    const data = await response.json();
    const route = data.routes[0];

    return {
      waypoints,
      totalDistance: route.distance / 1000,
      totalDuration: route.duration / 60,
      geometry: route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]),
      segments: route.legs.map((leg: any) => ({
        distance: leg.distance / 1000,
        duration: leg.duration / 60,
        steps: leg.steps.map((step: any) => ({
          instruction: step.maneuver.instruction || "Continue",
          distance: step.distance / 1000,
          duration: step.duration / 60,
        })),
      })),
    };
  } catch (error) {
    console.error("OSRM fallback error:", error);
    return null;
  }
}