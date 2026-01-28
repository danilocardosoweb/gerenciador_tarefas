import { RouteResult } from "@/types/route";
import { Card } from "@/components/ui/card";
import { Route, Clock, Navigation } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface RouteInfoProps {
  route: RouteResult | null;
}

export function RouteInfo({ route }: RouteInfoProps) {
  if (!route) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Adicione pelo menos 2 pontos para calcular a rota
        </p>
      </Card>
    );
  }

  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${formatNumber(km * 1000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} m`;
    }
    return `${formatNumber(km)} km`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Navigation className="h-5 w-5 text-primary" />
          Resumo da Rota
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Route className="h-4 w-4" />
              <span className="text-xs font-medium">Distância Total</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatDistance(route.totalDistance)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Tempo Estimado</span>
            </div>
            <p className="text-2xl font-bold text-accent">
              {formatDuration(route.totalDuration)}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">
            Rota calculada com {route.waypoints.length} pontos
          </p>
        </div>
      </div>
    </Card>
  );
}