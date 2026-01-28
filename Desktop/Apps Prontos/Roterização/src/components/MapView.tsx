import { useEffect, useRef } from "react";
import L from "leaflet";
import { Waypoint } from "@/types/route";
import { formatNumber } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// Default marker icons
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl: iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapViewProps {
  waypoints: Waypoint[];
  routeGeometry: [number, number][] | null;
  onMapClick: (lat: number, lon: number) => void;
  center?: [number, number];
}

// Coordenadas da empresa: [-22.874799730732537, -47.1777205465513]
const DEFAULT_CENTER: [number, number] = [-22.874799730732537, -47.1777205465513];

export function MapView({ waypoints, routeGeometry, onMapClick, center = DEFAULT_CENTER }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 13, // Aumentando o zoom para a localização da empresa
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      detectRetina: true,
      maxZoom: 19,
    }).addTo(map);

    // Click handler
    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, onMapClick]);

  // Update markers when waypoints change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const group = markersLayerRef.current;
    group.clearLayers();

    waypoints.forEach((wp, idx) => {
      const marker = L.marker([wp.lat, wp.lon], { icon: DefaultIcon });
      const address = wp.address ?? "Endereço não informado";
      const produzido = formatNumber(wp.produzidoTotal ?? 0);
      const embalado = formatNumber(wp.embaladoTotal ?? 0);

      marker.bindPopup(
        `<div class="text-sm space-y-1">
          <p class="font-semibold">Ponto ${idx + 1}</p>
          <p class="font-medium">${address}</p>
          <p>Produzido Kg: <strong>${produzido}</strong></p>
          <p>Embalado Kg: <strong>${embalado}</strong></p>
        </div>`
      );
      marker.addTo(group);
    });
  }, [waypoints]);

  // Update route polyline and fit bounds
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove previous polyline
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeGeometry && routeGeometry.length > 0) {
      // Alterando a cor para um azul similar ao Google Maps
      const poly = L.polyline(routeGeometry, {
        color: "#4285F4", // Novo azul
        weight: 5, // Aumentando um pouco a espessura para visibilidade
        opacity: 0.9,
      }).addTo(map);
      routeLayerRef.current = poly;

      const bounds = poly.getBounds();
      // Only fit bounds if the route is calculated, otherwise keep the current view
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (waypoints.length > 0) {
      // If no route, but there are waypoints, fit bounds to waypoints
      const bounds = L.latLngBounds(waypoints.map((wp) => [wp.lat, wp.lon] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeGeometry, waypoints]);

  return <div ref={containerRef} className="h-full w-full rounded-lg shadow-lg" />;
}