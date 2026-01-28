import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Waypoint, MultiRouteResult, SavedRoute } from "@/types/route";
import { MapView } from "@/components/MapView";
import { SearchBar } from "@/components/SearchBar";
import { WaypointList } from "@/components/WaypointList";
import { RouteInfo } from "@/components/RouteInfo";
import { RouteOptions } from "@/components/RouteOptions";
import { Button } from "@/components/ui/button";
import { calculateMultipleRoutes, optimizeRoute } from "@/services/routing";
import { reverseGeocode } from "@/services/nominatim";
import { toast } from "sonner";
import { Route, Loader2, PanelLeftClose, Wand2 } from "lucide-react";
import { useInitialWaypoint } from "@/hooks/use-initial-waypoint";
import { AppNavigation } from "@/components/AppNavigation";
import { cn } from "@/lib/utils";
import { useSavedRoutes } from "@/hooks/use-saved-routes";
import { RouteManagement } from "@/components/RouteManagement";

const Index = () => {
  const { waypoints, setWaypoints, handleAddWaypoint, handleRemoveWaypoint, handleClearWaypoints, handleAddWaypointsBatch, handleReorderWaypoints } = useInitialWaypoint();
  const { savedRoutes, saveRoute, deleteRoute, isSaving, isDeleting, isLoading } = useSavedRoutes();
  
  const [multiRoute, setMultiRoute] = useState<MultiRouteResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isCalculatingRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.newWaypoints) {
      handleAddWaypointsBatch(location.state.newWaypoints);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, handleAddWaypointsBatch, navigate]);

  const handleRouteSuccess = (result: (MultiRouteResult & { usedFallback?: boolean; }) | null) => {
    if (result?.usedFallback) {
      toast.info("Usando serviço de rotas alternativo.", {
        description: "Para obter mais opções (curta, rápida, etc.), adicione uma chave de API do OpenRouteService.",
        duration: 8000,
      });
    }

    if (result && result.routes.length > 0) {
      setWaypoints(result.waypoints); // Atualiza a ordem dos waypoints na UI
      setMultiRoute(result);
      setSelectedRouteId(result.routes[0].id);
      toast.success(`${result.routes.length} rotas calculadas!`);
    } else {
      setMultiRoute(null);
      setSelectedRouteId(null);
      toast.error("Não foi possível calcular as rotas. Verifique os pontos ou a conectividade.");
    }
  };

  const calculateRouteMutation = useMutation({
    mutationFn: (waypointsToCalculate: Waypoint[]) => {
      isCalculatingRef.current = true;
      return calculateMultipleRoutes(waypointsToCalculate);
    },
    onSuccess: handleRouteSuccess,
    onError: (error) => {
      setMultiRoute(null);
      setSelectedRouteId(null);
      toast.error("Erro ao calcular rotas", { description: error.message });
    },
    onSettled: () => {
      isCalculatingRef.current = false;
    },
  });

  const optimizeRouteMutation = useMutation({
    mutationFn: (waypointsToOptimize: Waypoint[]) => {
      isCalculatingRef.current = true;
      return optimizeRoute(waypointsToOptimize);
    },
    onSuccess: (result) => {
      toast.success("Rota otimizada com sucesso!");
      handleRouteSuccess(result);
    },
    onError: (error) => {
      setMultiRoute(null);
      setSelectedRouteId(null);
      toast.error("Erro ao otimizar a rota", { description: error.message });
    },
    onSettled: () => {
      isCalculatingRef.current = false;
    },
  });

  const selectedRoute = multiRoute?.routes.find(r => r.id === selectedRouteId) || null;

  const handleMapClick = async (lat: number, lon: number) => {
    const address = await reverseGeocode(lat, lon);
    handleAddWaypoint(lat, lon, address);
  };

  const handleCalculateRoute = () => {
    if (waypoints.length < 2) {
      toast.error("Adicione pelo menos 1 ponto de entrega além do ponto de partida.");
      return;
    }
    calculateRouteMutation.mutate(waypoints);
  };

  const handleOptimizeRoute = () => {
    if (waypoints.length < 2) {
      toast.error("Adicione pelo menos 1 ponto de entrega para otimizar.");
      return;
    }
    optimizeRouteMutation.mutate(waypoints);
  };

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
  };

  const calculateRouteMetrics = (routeOption: MultiRouteResult["routes"][number], currentWaypoints: Waypoint[]) => {
    const totalWaypoints = currentWaypoints.length;
    const orders = currentWaypoints.flatMap((wp) => wp.orders ?? []);
    const orderCount = orders.length;
    const produzidoKg = orders.reduce((acc, order) => acc + (Number(order["Produzido Kg"]) || 0), 0);
    const embaladoKg = orders.reduce((acc, order) => acc + (Number(order["Embalado Kg"]) || 0), 0);
    return {
      totalDistance: routeOption.totalDistance,
      totalDuration: routeOption.totalDuration,
      waypointCount: totalWaypoints,
      orderCount,
      produzidoKg,
      embaladoKg,
    };
  };

  const handleSaveRoute = async (name: string) => {
    if (!selectedRoute || !waypoints) {
      toast.error("Calcule uma rota antes de salvar.");
      return;
    }

    try {
      const metrics = calculateRouteMetrics(selectedRoute, waypoints);
      await saveRoute({
        name,
        waypoints,
        route: selectedRoute,
        metrics,
      });
      toast.success(`Rota "${name}" salva com sucesso!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao salvar a rota.";
      toast.error("Falha ao salvar rota.", { description: message });
    }
  };

  const handleLoadRoute = (route: SavedRoute) => {
    setWaypoints(route.waypoints);
    setMultiRoute({
      waypoints: route.waypoints,
      routes: [route.route],
    });
    setSelectedRouteId(route.route.id);
    toast.info(`Rota "${route.name}" carregada.`);
  };

  const handleDeleteRoute = async (id: string) => {
    try {
      await deleteRoute(id);
      toast.success("Rota excluída.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao excluir a rota.";
      toast.error("Falha ao excluir rota.", { description: message });
    }
  };

  useEffect(() => {
    if (!isCalculatingRef.current) {
      setMultiRoute(null);
      setSelectedRouteId(null);
    }
  }, [waypoints]);

  const isProcessing = calculateRouteMutation.isPending || optimizeRouteMutation.isPending;

  return (
    <div className="flex h-full w-full flex-col">
      <header className="border-b bg-card shadow-sm z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold">Roterização TecnoPerfil</h1>
              <p className="text-xs text-muted-foreground">Otimização de Rotas Inteligente</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleOptimizeRoute}
              disabled={waypoints.length < 2 || isProcessing}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              {optimizeRouteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Otimizando...</>
              ) : (
                <><Wand2 className="h-4 w-4" /> Otimizar Rota</>
              )}
            </Button>
            <Button
              onClick={handleCalculateRoute}
              disabled={waypoints.length < 2 || isProcessing}
              size="lg"
              className="gap-2"
            >
              {calculateRouteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Calculando...</>
              ) : (
                <><Route className="h-4 w-4" /> Calcular Rota</>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn(
          "border-r bg-card shadow-lg flex flex-col transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-96" : "w-[80px]"
        )}>
          <div className="flex h-16 items-center border-b px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("transition-all ml-auto", !isSidebarOpen && "mx-auto rotate-180")}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? "Recolher menu" : "Expandir menu"}
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </div>
          <AppNavigation isCollapsed={!isSidebarOpen} />
          <div className={cn("overflow-y-auto p-6 space-y-6 flex-1", !isSidebarOpen && "hidden")}>
            <div>
              <h2 className="mb-3 text-lg font-semibold">Buscar Endereço</h2>
              <SearchBar
                onSelectLocation={handleAddWaypoint}
                placeholder="Digite um endereço..."
              />
            </div>

            <div>
              <WaypointList
                waypoints={waypoints}
                onRemove={handleRemoveWaypoint}
                onClear={handleClearWaypoints}
                onReorder={handleReorderWaypoints}
              />
            </div>

            {multiRoute && multiRoute.routes.length > 0 && (
              <>
                <RouteOptions
                  routes={multiRoute.routes}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={handleSelectRoute}
                />
                {selectedRoute && (
                  <RouteInfo route={{
                    waypoints: multiRoute.waypoints,
                    totalDistance: selectedRoute.totalDistance,
                    totalDuration: selectedRoute.totalDuration,
                    geometry: selectedRoute.geometry,
                    segments: selectedRoute.segments
                  }} />
                )}
              </>
            )}
            
            <RouteManagement
              selectedRoute={selectedRoute}
              waypoints={waypoints}
              savedRoutes={savedRoutes}
              onSave={handleSaveRoute}
              onLoad={handleLoadRoute}
              onDelete={handleDeleteRoute}
            />
          </div>
        </aside>

        <main className="flex-1 p-4 relative">
          <div className="h-full w-full rounded-lg overflow-hidden">
            <MapView
              waypoints={waypoints}
              routeGeometry={selectedRoute?.geometry ?? null}
              onMapClick={handleMapClick}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;