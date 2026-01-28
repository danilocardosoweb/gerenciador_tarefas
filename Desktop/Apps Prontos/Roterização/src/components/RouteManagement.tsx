import { useState } from "react";
import { SavedRoute, RouteOption, Waypoint } from "@/types/route";
import { Button } from "@/components/ui/button";
import { Save, Download, Trash2, Map, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportRouteToExcel } from "@/lib/exportUtils";

interface RouteManagementProps {
  selectedRoute: RouteOption | null;
  waypoints: Waypoint[];
  savedRoutes: SavedRoute[];
  onSave: (name: string) => void;
  onLoad: (route: SavedRoute) => void;
  onDelete: (id: string) => void;
}

export function RouteManagement({
  selectedRoute,
  waypoints,
  savedRoutes,
  onSave,
  onLoad,
  onDelete,
}: RouteManagementProps) {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [routeName, setRouteName] = useState("");

  const handleSaveClick = () => {
    setRouteName(`Rota - ${format(new Date(), "dd/MM/yyyy")}`);
    setIsSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (routeName.trim()) {
      onSave(routeName.trim());
      setIsSaveDialogOpen(false);
      setRouteName("");
    }
  };

  const handleExportClick = () => {
    if (selectedRoute) {
      exportRouteToExcel(selectedRoute.name, selectedRoute, waypoints);
    }
  };

  return (
    <div className="space-y-6">
      {selectedRoute && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações da Rota</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={handleSaveClick} className="flex-1 gap-2">
              <Save className="h-4 w-4" /> Salvar Rota
            </Button>
            <Button onClick={handleExportClick} variant="outline" className="flex-1 gap-2">
              <Download className="h-4 w-4" /> Exportar (Excel)
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Rotas Salvas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedRoutes.length > 0 ? (
            <ScrollArea className="h-48">
              <div className="space-y-2 pr-4">
                {savedRoutes.map((route) => (
                  <div key={route.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-semibold">{route.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Salva em: {format(new Date(route.createdAt), "P p", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => onLoad(route)} title="Carregar Rota">
                        <Map className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(route.id)} title="Excluir Rota">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma rota salva ainda.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Rota Atual</DialogTitle>
            <DialogDescription>
              Dê um nome para a rota para identificá-la facilmente mais tarde.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}