import { Waypoint } from "@/types/route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface WaypointListProps {
  waypoints: Waypoint[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

export function WaypointList({ waypoints, onRemove, onClear, onReorder }: WaypointListProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    onReorder(result.source.index, result.destination.index);
  };

  const initialWaypoint = waypoints[0];
  const draggableWaypoints = waypoints.slice(1);

  if (waypoints.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum ponto adicionado. Use a busca ou clique no mapa.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pontos da Rota ({waypoints.length})</h3>
        {waypoints.length > 1 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Limpar Tudo
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Card key={initialWaypoint.id} className="overflow-hidden bg-secondary/50">
          <div className="flex items-start gap-3 p-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              1
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{initialWaypoint.address}</p>
              <p className="text-xs text-muted-foreground">
                {initialWaypoint.lat.toFixed(4)}, {initialWaypoint.lon.toFixed(4)}
                {initialWaypoint.orders && initialWaypoint.orders.length > 0 && (
                  <span className="ml-2">({initialWaypoint.orders.length} pedido(s))</span>
                )}
              </p>
            </div>
          </div>
        </Card>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="waypoints">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {draggableWaypoints.map((waypoint, index) => (
                  <Draggable key={waypoint.id} draggableId={waypoint.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`group relative overflow-hidden transition-shadow ${
                          snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 p-3">
                          <div {...provided.dragHandleProps} className="cursor-grab">
                            <GripVertical className="h-5 w-5 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
                          </div>
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                            {index + 2}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium">{waypoint.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {waypoint.lat.toFixed(4)}, {waypoint.lon.toFixed(4)}
                              {waypoint.orders && waypoint.orders.length > 0 && (
                                <span className="ml-2">({waypoint.orders.length} pedido(s))</span>
                              )}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => onRemove(waypoint.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}