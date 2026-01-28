import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: number | string | undefined | null,
  options?: Intl.NumberFormatOptions
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  const defaultValue = (0).toLocaleString("pt-BR", defaultOptions);

  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  // Handle string inputs that might use comma as decimal separator
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;

  if (isNaN(num)) {
    return defaultValue;
  }

  return num.toLocaleString("pt-BR", defaultOptions);
}