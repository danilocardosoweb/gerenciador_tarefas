import { Order } from "@/types/order";
import { CustomerRecord } from "@/types/customer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { normalizeString } from "@/lib/normalization";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Boxes, PackageCheck, Truck } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type GroupByOption = "Rota" | "Cliente" | "Nr Pedido";

interface OrderTableProps {
  groupedOrders: Record<string, Order[]>;
  groupBy: GroupByOption;
  selectedGroups: string[];
  onGroupSelectionChange: (groupKey: string, isSelected: boolean) => void;
  totalOrders: number;
  isLoading?: boolean;
  excludedOrderIds: Set<string>;
  onOrderIncludeChange: (orderId: string, included: boolean) => void;
  customerLookup: Map<string, CustomerRecord>;
  onManageTransportadora?: (customer: CustomerRecord) => void;
}

const allColumns = [
  { key: "Cliente", header: "Cliente" },
  { key: "Nr Pedido", header: "Nr Pedido" },
  { key: "Data Entrega", header: "Data Entrega" },
  { key: "Produto", header: "Produto" },
  { key: "Ferramenta", header: "Ferramenta" },
  { key: "Un.At", header: "Un.At" },
  { key: "Pedido Kg", header: "Pedido Kg" },
  { key: "Pedido Pc", header: "Pedido Pc" },
  { key: "Produzido Kg", header: "Produzido Kg" },
  { key: "Embalado Kg", header: "Embalado Kg" },
  { key: "Cidade Entrega", header: "Cidade Entrega" },
  { key: "Rota", header: "Rota" },
  { key: "lat", header: "Lat/Lon" },
];

const numericColumns = new Set([
  "Pedido Kg",
  "Pedido Pc",
  "Produzido Kg",
  "Embalado Kg",
]);

const dateColumns = new Set([
  "Data Entrega",
  "Data Implant",
  "Data Ent.Orig",
  "Data Prog",
  "Data Ult Fat",
]);

export function OrderTable({
  groupedOrders,
  groupBy,
  selectedGroups,
  onGroupSelectionChange,
  totalOrders,
  isLoading = false,
  excludedOrderIds,
  onOrderIncludeChange,
  customerLookup,
  onManageTransportadora,
}: OrderTableProps) {
  if (isLoading) {
    return (
      <Card className="flex h-full items-center justify-center p-6">
        <p className="text-muted-foreground">Carregando pedidos do Supabase...</p>
      </Card>
    );
  }

  if (totalOrders === 0) {
    return (
      <Card className="flex h-full items-center justify-center p-6">
        <p className="text-muted-foreground">Nenhum pedido carregado. Importe um arquivo Excel acima.</p>
      </Card>
    );
  }

  const groupKeys = Object.keys(groupedOrders);
  const columns = allColumns.filter((col) => col.key !== groupBy);

  const calculateGroupTotals = (orders: Order[], excludedIds: Set<string>) => {
    return orders.reduce(
      (acc, order) => {
        const enrichedOrder = order as Order & { id?: string };
        if (enrichedOrder.id && excludedIds.has(enrichedOrder.id)) {
          return acc;
        }
        acc.produzidoKg += Number(order["Produzido Kg"]) || 0;
        acc.embaladoKg += Number(order["Embalado Kg"]) || 0;
        return acc;
      },
      { produzidoKg: 0, embaladoKg: 0 },
    );
  };

  if (groupKeys.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum pedido encontrado para os filtros aplicados.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-2 p-1">
        {groupKeys.map((groupKey) => {
          const ordersInGroup = groupedOrders[groupKey];
          const totals = calculateGroupTotals(ordersInGroup, excludedOrderIds);
          const firstOrder = ordersInGroup[0];
          const rota = firstOrder?.Rota ?? null;

          const customerName = firstOrder?.Cliente?.toString().trim();
          const displayTitle = customerName && customerName.length > 0 ? customerName : groupKey;
          const customerShort = firstOrder?.customer_short_name ?? "";
          const normalizedShortName = customerShort ? normalizeString(customerShort) : "";
          const customerRecord = normalizedShortName ? customerLookup.get(normalizedShortName) : undefined;

          const highlightLabel = (() => {
            switch (groupBy) {
              case "Cliente":
                return customerName || displayTitle;
              case "Nr Pedido": {
                const numeroPedido = firstOrder?.["Nr Pedido"]?.toString().trim();
                return numeroPedido ? `Pedido ${numeroPedido}` : "Pedido";
              }
              case "Rota":
              default:
                return rota || "Rota";
            }
          })();

          const secondaryLabel = `${ordersInGroup.length} pedidos • ${highlightLabel}`;
          const isOutsideSP = Boolean(customerRecord?.state && customerRecord.state.trim().toUpperCase() !== "SP");
          const usesTransportadora = Boolean(customerRecord?.use_transportadora);
          const transportadoraGeocoded = Boolean(customerRecord?.transportadora_geocoded);

          return (
            <Collapsible
              key={groupKey}
              className="overflow-hidden rounded-lg border transition-colors data-[state=open]:border-[#0000AA]"
            >
              <CollapsibleTrigger asChild>
                <div
                  className="group flex items-center justify-between gap-3 bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-[#0000AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0000AA] data-[state=open]:bg-[#0000AA]"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <Checkbox
                      checked={selectedGroups.includes(groupKey)}
                      onCheckedChange={(checked) => onGroupSelectionChange(groupKey, !!checked)}
                      aria-label={`Selecionar ${displayTitle}`}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold leading-tight group-hover:text-white group-data-[state=open]:text-white">{displayTitle}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-white group-data-[state=open]:text-white">{secondaryLabel}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-muted-foreground group-hover:text-white group-data-[state=open]:text-white">
                    {groupBy === "Rota" && rota && (
                      <div className="flex items-center gap-1.5 font-semibold" title="Rota selecionada">
                        <Truck className="h-4 w-4 group-hover:text-white group-data-[state=open]:text-white" />
                        <span>{rota}</span>
                      </div>
                    )}
                    {isOutsideSP && (
                      <Badge variant="destructive" className="bg-red-600 text-white">Fora de SP</Badge>
                    )}
                    {usesTransportadora && (
                      <Badge variant={transportadoraGeocoded ? "secondary" : "destructive"}>
                        {transportadoraGeocoded ? "Transportadora geocodificada" : "Transportadora pendente"}
                      </Badge>
                    )}
                    {customerRecord && onManageTransportadora && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500 text-blue-500 hover:bg-blue-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          onManageTransportadora?.(customerRecord);
                        }}
                      >
                        Definir Transportadora
                      </Button>
                    )}
                    <div className="flex items-center gap-1.5" title="Total Produzido">
                      <Boxes className="h-4 w-4 group-hover:text-white group-data-[state=open]:text-white" />
                      <span>{formatNumber(totals.produzidoKg)} Kg</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Total Embalado">
                      <PackageCheck className="h-4 w-4 group-hover:text-white group-data-[state=open]:text-white" />
                      <span>{formatNumber(totals.embaladoKg)} Kg</span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary transition-transform duration-200 group-hover:text-white group-data-[state=open]:rotate-90 group-data-[state=open]:text-white" />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="overflow-x-auto border-t">
                  <Table className="min-w-max">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24 text-xs">Incluir</TableHead>
                        {columns.map((col) => (
                          <TableHead key={col.key} className={cn("text-xs whitespace-nowrap", numericColumns.has(col.key) && "text-right")}>
                            {col.header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersInGroup.map((order, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs whitespace-nowrap">
                            <Checkbox
                              checked={order.id ? !excludedOrderIds.has(order.id) : true}
                              onCheckedChange={(checked) => {
                                if (!order.id) return;
                                onOrderIncludeChange(order.id, !!checked);
                              }}
                              aria-label={`Incluir pedido ${order["Nr Pedido"] ?? "sem número"}`}
                            />
                          </TableCell>
                          {columns.map((col) => {
                            const value = order[col.key as keyof Order];
                            if (col.key === "lat") {
                              return (
                                <TableCell key={col.key} className="text-xs whitespace-nowrap">
                                  {order.lat && order.lon ? `${order.lat.toFixed(4)}, ${order.lon.toFixed(4)}` : "N/A"}
                                </TableCell>
                              );
                            }
                            if (dateColumns.has(col.key)) {
                              const dateValue = value as Date | string;
                              let formattedDate = "-";
                              if (dateValue) {
                                try {
                                  const date = new Date(dateValue);
                                  if (!isNaN(date.getTime())) {
                                    formattedDate = format(date, "dd/MM/yyyy");
                                  }
                                } catch (e) {
                                  // Keep default value
                                }
                              }
                              return (
                                <TableCell key={col.key} className="text-xs whitespace-nowrap">
                                  {formattedDate}
                                </TableCell>
                              );
                            }
                            if (numericColumns.has(col.key)) {
                              const options = {
                                minimumFractionDigits: col.key.endsWith(" Pc") ? 0 : 2,
                                maximumFractionDigits: col.key.endsWith(" Pc") ? 0 : 2,
                              };
                              return (
                                <TableCell key={col.key} className="text-xs whitespace-nowrap text-right">
                                  {formatNumber(value as number | string, options)}
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell key={col.key} className="text-xs whitespace-nowrap">
                                {value !== undefined && value !== null ? String(value) : "-"}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </ScrollArea>
  );
}