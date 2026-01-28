import { useState, useEffect } from "react";
import { Waypoint } from "@/types/route";

// Coordenadas da Tecnoperfil Alumínio
const COMPANY_LAT = -22.874799730732537;
const COMPANY_LON = -47.1777205465513;
const COMPANY_ADDRESS = "Tecnoperfil Alumínio (Ponto de Partida)";

const INITIAL_WAYPOINT: Waypoint = {
  id: "company-start",
  lat: COMPANY_LAT,
  lon: COMPANY_LON,
  address: COMPANY_ADDRESS,
  order: 0,
};

export function useInitialWaypoint() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([INITIAL_WAYPOINT]);

  const handleAddWaypoint = (lat: number, lon: number, address: string) => {
    const newWaypoint: Waypoint = {
      id: `wp-${Date.now()}`,
      lat,
      lon,
      address,
    };
    setWaypoints((prev) => [...prev, newWaypoint].map((wp, index) => ({ ...wp, order: index })));
  };

  const handleAddWaypointsBatch = (newWaypoints: Omit<Waypoint, "id" | "order">[]) => {
    setWaypoints((prev) => {
      const existingCoords = new Set(prev.map((wp) => `${wp.lat.toFixed(6)},${wp.lon.toFixed(6)}`));

      const waypointsToAdd = newWaypoints
        .filter((wp) => !existingCoords.has(`${wp.lat.toFixed(6)},${wp.lon.toFixed(6)}`))
        .map((wp, index) => ({
          ...wp,
          id: `wp-batch-${Date.now()}-${index}`,
        }));

      return [...prev, ...waypointsToAdd].map((wp, index) => ({ ...wp, order: index }));
    });
  };

  const handleRemoveWaypoint = (id: string) => {
    setWaypoints((prev) => {
      if (id === INITIAL_WAYPOINT.id) return prev; // Prevent removing initial waypoint
      const newWaypoints = prev.filter((wp) => wp.id !== id);
      return newWaypoints.map((wp, index) => ({ ...wp, order: index }));
    });
  };

  const handleClearWaypoints = () => {
    setWaypoints([INITIAL_WAYPOINT]);
  };

  const handleReorderWaypoints = (startIndex: number, endIndex: number) => {
    setWaypoints((prev) => {
      const waypointsToReorder = prev.slice(1); // Exclude initial waypoint
      const [removed] = waypointsToReorder.splice(startIndex, 1);
      waypointsToReorder.splice(endIndex, 0, removed);

      const reorderedWaypoints = [INITIAL_WAYPOINT, ...waypointsToReorder];
      return reorderedWaypoints.map((wp, index) => ({ ...wp, order: index }));
    });
  };

  useEffect(() => {
    setWaypoints((prev) => {
      const hasInitial = prev.some((wp) => wp.id === INITIAL_WAYPOINT.id);
      if (!hasInitial) {
        return [INITIAL_WAYPOINT, ...prev].map((wp, index) => ({ ...wp, order: index }));
      }

      if (prev[0].id !== INITIAL_WAYPOINT.id) {
        const initial = prev.find((wp) => wp.id === INITIAL_WAYPOINT.id)!;
        const others = prev.filter((wp) => wp.id !== INITIAL_WAYPOINT.id);
        return [initial, ...others].map((wp, index) => ({ ...wp, order: index }));
      }

      const needsReorder = prev.some((wp, index) => wp.order !== index);
      if (needsReorder) {
        return prev.map((wp, index) => ({ ...wp, order: index }));
      }

      return prev;
    });
  }, []);

  return {
    waypoints,
    setWaypoints,
    handleAddWaypoint,
    handleRemoveWaypoint,
    handleClearWaypoints,
    handleAddWaypointsBatch,
    handleReorderWaypoints,
    initialWaypoint: INITIAL_WAYPOINT,
  };
}