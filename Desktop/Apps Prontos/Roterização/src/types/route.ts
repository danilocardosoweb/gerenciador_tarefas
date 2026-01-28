import { Order } from "./order";

export interface Waypoint {
  id: string;
  lat: number;
  lon: number;
  address: string;
  order?: number;
  orders?: Order[];
  produzidoTotal?: number;
  embaladoTotal?: number;
}

export interface RouteSegment {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface RouteResult {
  waypoints: Waypoint[];
  totalDistance: number;
  totalDuration: number;
  geometry: [number, number][];
  segments: RouteSegment[];
}

export interface RouteOption {
  id: string;
  name: string;
  totalDistance: number;
  totalDuration: number;
  geometry: [number, number][];
  segments: RouteSegment[];
  description: string;
}

export interface MultiRouteResult {
  waypoints: Waypoint[];
  routes: RouteOption[];
}

export interface RouteMetrics {
  totalDistance: number;
  totalDuration: number;
  waypointCount: number;
  orderCount: number;
  produzidoKg: number;
  embaladoKg: number;
}

export interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface SavedRoute {
  id: string;
  name: string;
  createdAt: string;
  waypoints: Waypoint[];
  route: RouteOption;
  metrics?: RouteMetrics;
}