import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { UploadCloud } from "lucide-react";
import { Order } from "@/types/order";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { parse, isValid } from "date-fns";

interface ExcelImporterProps {
  onImport: (data: Order[]) => void;
}

export function ExcelImporter({ onImport }: ExcelImporterProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        toast.error("Formato de arquivo inválido. Por favor, use .xlsx ou .xls.");
        return;
      }

      const file = acceptedFiles[0];

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Use sheet_to_json without date parsing, to handle it manually
          const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

          if (rawJson.length === 0) {
            toast.warn("O arquivo Excel está vazio. A tabela de pedidos foi limpa.");
            onImport([]);
            return;
          }

          const dateColumns = [
            "Data Implant",
            "Data Entrega",
            "Data Ent.Orig",
            "Data Prog",
            "Data Ult Fat",
          ];

          const parseDateValue = (value: any): Date | string => {
            if (value === null || value === undefined || value === "") {
              return ""; // Return empty string for empty cells
            }

            // 1. Handle Excel serial numbers (which are numbers)
            if (typeof value === "number" && value > 0) {
              const dateParts = XLSX.SSF.parse_date_code(value);
              if (dateParts) {
                // Construct date in UTC to avoid local timezone shifts during creation
                return new Date(
                  Date.UTC(dateParts.y, dateParts.m - 1, dateParts.d, dateParts.H, dateParts.M, dateParts.S),
                );
              }
            }

            // 2. Handle date strings
            if (typeof value === "string") {
              // Try common formats that date-fns can parse
              const formats = [
                "dd/MM/yyyy",
                "MM/dd/yyyy",
                "yyyy-MM-dd",
                "dd-MM-yyyy",
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
              ];
              for (const fmt of formats) {
                const parsed = parse(value, fmt, new Date());
                if (isValid(parsed)) {
                  return parsed;
                }
              }
              // Fallback for other formats JS can handle
              const nativeParsed = new Date(value);
              if (isValid(nativeParsed)) {
                return nativeParsed;
              }
            }

            // If it's already a Date object (can happen with some files/libraries)
            if (value instanceof Date && isValid(value)) {
              return value;
            }

            // Return original value as string if all parsing fails
            return String(value);
          };

          const processedJson: Order[] = rawJson.map((row) => {
            const newRow = { ...row };
            for (const col of dateColumns) {
              if (Object.prototype.hasOwnProperty.call(newRow, col)) {
                newRow[col] = parseDateValue(newRow[col]);
              }
            }
            return newRow as Order;
          });

          onImport(processedJson);
          toast.success(`Arquivo "${file.name}" importado com sucesso.`);
        } catch (error) {
          console.error("Erro ao processar arquivo Excel:", error);
          toast.error("Erro ao processar o arquivo. Verifique se o formato está correto.");
        }
      };
      reader.readAsBinaryString(file);
    },
    [onImport],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <Button variant="outline" size="icon" className="cursor-pointer">
            <UploadCloud className="h-4 w-4" />
            <span className="sr-only">Importar Pedidos</span>
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Importar Pedidos (.xlsx, .xls)</p>
      </TooltipContent>
    </Tooltip>
  );
}