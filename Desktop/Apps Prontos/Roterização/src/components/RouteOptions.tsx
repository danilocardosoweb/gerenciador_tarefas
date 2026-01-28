import { RouteOption } from "@/types/route";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, Route, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

interface RouteOptionsProps {
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
}

export function RouteOptions({ routes, selectedRouteId, onSelectRoute }: RouteOptionsProps) {
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${formatNumber(km * 1000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} m`;
    }
    return `${formatNumber(km, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return (
    <Card className="p-4">
      <h3 className="mb-4 font-semibold flex items-center gap-2">
        <Route className="h-4 w-4 text-primary" />
        Opções de Rota
      </h3>

      <RadioGroup value={selectedRouteId || ""} onValueChange={onSelectRoute}>
        <div className="space-y-3">
          {routes.map((route) => (
            <Label
              key={route.id}
              htmlFor={route.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent/50",
                selectedRouteId === route.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <RadioGroupItem value={route.id} id={route.id} className="mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{route.name}</p>
                  {selectedRouteId === route.id && (
                    <span className="text-xs font-medium text-primary">Selecionada</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{route.description}</p>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Route className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{formatDistance(route.totalDistance)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{formatDuration(route.totalDuration)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">
                      {formatNumber(route.totalDistance / (route.totalDuration / 60), { minimumFractionDigits: 0, maximumFractionDigits: 0 })} km/h
                    </span>
                  </div>
                </div>
              </div>
            </Label>
          ))}
        </div>
      </RadioGroup>
    </Card>
  );
}