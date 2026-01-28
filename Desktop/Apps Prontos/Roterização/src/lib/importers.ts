import * as XLSX from "xlsx";
import { parse, isValid, format } from "date-fns";
import { normalizeString } from "@/lib/normalization";
import { CustomerImportRow } from "@/types/customer";
import { Order } from "@/types/order";

const DATE_FORMATS = [
  "dd/MM/yyyy",
  "MM/dd/yyyy",
  "yyyy-MM-dd",
  "dd-MM-yyyy",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd'T'HH:mm:ssXXX",
];

function parseDateValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number" && value > 0) {
    const excelDate = XLSX.SSF.parse_date_code(value);
    if (excelDate) {
      const date = new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
      return format(date, "yyyy-MM-dd");
    }
  }

  if (typeof value === "string") {
    for (const pattern of DATE_FORMATS) {
      const parsed = parse(value, pattern, new Date());
      if (isValid(parsed)) {
        return format(parsed, "yyyy-MM-dd");
      }
    }

    const native = new Date(value);
    if (isValid(native)) {
      return format(native, "yyyy-MM-dd");
    }
  }

  if (value instanceof Date && isValid(value)) {
    return format(value, "yyyy-MM-dd");
  }

  return null;
}

function normalizeRow<T extends Record<string, unknown>>(row: T): T {
  const normalizedEntries = Object.entries(row).map(([key, value]) => {
    if (typeof value === "string") {
      return [key, normalizeString(value)];
    }
    return [key, value];
  });
  return Object.fromEntries(normalizedEntries) as T;
}

function removeEmptyRows<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.filter((row) =>
    Object.values(row).some((value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") {
        return value.trim().length > 0;
      }
      return true;
    }),
  );
}

async function readSheet(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
}

export async function parseCustomerImport(file: File): Promise<CustomerImportRow[]> {
  const rows = await readSheet(file);
  const cleaned = removeEmptyRows(rows).map((row) => {
    const normalized = normalizeRow(row);
    const copy = { ...normalized };
    return copy;
  });
  return cleaned as unknown as CustomerImportRow[];
}

export async function parseOrderImport(file: File): Promise<Order[]> {
  const rows = await readSheet(file);
  const cleaned = removeEmptyRows(rows).map((row) => {
    const normalized = normalizeRow(row);
    const copy = { ...normalized };

    const dateColumns = [
      "Data Implant",
      "Data Entrega",
      "Data Ent.Orig",
      "Data Prog",
      "Data Ult Fat",
    ];

    for (const column of dateColumns) {
      if (Object.prototype.hasOwnProperty.call(copy, column)) {
        copy[column] = parseDateValue(copy[column]) ?? null;
      }
    }

    return copy;
  });

  return cleaned as unknown as Order[];
}
