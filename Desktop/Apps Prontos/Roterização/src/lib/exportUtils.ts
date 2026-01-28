import * as XLSX from "xlsx";
import { RouteOption, Waypoint } from "@/types/route";
import { format } from "date-fns";

export function exportRouteToExcel(routeName: string, route: RouteOption, waypoints: Waypoint[]) {
  const wb = XLSX.utils.book_new();
  const sheetName = "Relatório de Rota";

  // 1. Header / Summary Info
  const summaryData = [
    ["Relatório de Rota"],
    [], // empty row
    ["Nome da Rota", routeName],
    ["Data de Exportação", format(new Date(), "dd/MM/yyyy HH:mm")],
    ["Distância Total", `${route.totalDistance.toFixed(2)} km`],
    ["Duração Total", `${Math.round(route.totalDuration)} min`],
    ["Número de Paradas", waypoints.length > 0 ? waypoints.length - 1 : 0], // Excluding start point
    [], // empty row
    ["Detalhes das Entregas"],
  ];

  // 2. Delivery Details
  const deliveryHeader = [
    "Parada",
    "Cliente",
    "Cidade",
    "Endereço",
    "Embalado (Kg)",
    "Embalado (Pc)",
    "Nr Pedido",
  ];

  const deliveryData = waypoints.slice(1).flatMap((wp, index) => {
    if (wp.orders && wp.orders.length > 0) {
      return wp.orders.map((order) => ({
        Parada: index + 1,
        Cliente: order.Cliente,
        Cidade: order["Cidade Entrega"],
        Endereço: order["Local Entrega"],
        "Embalado (Kg)": order["Embalado Kg"],
        "Embalado (Pc)": order["Embalado Pc"],
        "Nr Pedido": order["Nr Pedido"],
      }));
    }
    return [
      {
        Parada: index + 1,
        Cliente: wp.address,
        Cidade: "",
        Endereço: wp.address,
        "Embalado (Kg)": "",
        "Embalado (Pc)": "",
        "Nr Pedido": "N/A",
      },
    ];
  });

  // Convert delivery data to array of arrays for sheet_add_aoa
  const deliveryRows = deliveryData.map((row) => [
    row.Parada,
    row.Cliente,
    row.Cidade,
    row.Endereço,
    row["Embalado (Kg)"],
    row["Embalado (Pc)"],
    row["Nr Pedido"],
  ]);

  // Create sheet from summary
  const ws = XLSX.utils.aoa_to_sheet(summaryData);

  // Add delivery details to the same sheet
  XLSX.utils.sheet_add_aoa(ws, [deliveryHeader, ...deliveryRows], { origin: -1 }); // -1 appends to the end

  // Auto-fit columns
  const cols = [
    { wch: 10 }, // Parada
    { wch: 30 }, // Cliente
    { wch: 20 }, // Cidade
    { wch: 40 }, // Endereço
    { wch: 15 }, // Embalado (Kg)
    { wch: 15 }, // Embalado (Pc)
    { wch: 15 }, // Nr Pedido
  ];
  ws["!cols"] = cols;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Download the file
  const fileName = `Relatorio_Rota_${routeName.replace(/ /g, "_")}_${format(new Date(), "yyyyMMdd")}.xlsx`;
  XLSX.writeFile(wb, fileName);
}