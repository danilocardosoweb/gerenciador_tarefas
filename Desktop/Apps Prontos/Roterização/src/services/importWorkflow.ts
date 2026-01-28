import { parseCustomerImport, parseOrderImport } from "@/lib/importers";
import {
  buildCustomerRecords,
  buildOrderRecords,
  customerRecordToInsert,
  fetchCustomers,
  insertCustomers,
  insertOrders,
  truncateCustomers,
  truncateOrders,
  normalizeShortName,
} from "@/services/supabaseData";
import { Order } from "@/types/order";

interface ImportResult {
  customers?: number;
  orders?: number;
}

interface ImportParams {
  customerFile?: File;
  orderFile?: File;
}

function collectUnmatchedOrders(orders: Order[], customerShortNames: Set<string>): string[] {
  const unmatched = new Map<string, { cliente: string; rota?: string }>();

  for (const order of orders) {
    const shortName = normalizeShortName(order.Cliente);
    if (!customerShortNames.has(shortName)) {
      if (!unmatched.has(shortName)) {
        unmatched.set(shortName, {
          cliente: order.Cliente,
          rota: order.Rota,
        });
      }
    }
  }

  return Array.from(unmatched.values()).slice(0, 5).map((item) => {
    if (item.rota) {
      return `${item.cliente} (rota ${item.rota})`;
    }
    return item.cliente;
  });
}

export async function importCustomersAndOrders(params: ImportParams): Promise<ImportResult> {
  const { customerFile, orderFile } = params;
  const shouldImportCustomers = Boolean(customerFile);
  const shouldImportOrders = Boolean(orderFile);

  if (!shouldImportCustomers && !shouldImportOrders) {
    throw new Error("Selecione ao menos um arquivo para importação.");
  }

  let customersInserted: number | undefined;
  let ordersInserted: number | undefined;

  let importedCustomers: ReturnType<typeof buildCustomerRecords> | null = null;

  if (shouldImportCustomers && customerFile) {
    const customerRows = await parseCustomerImport(customerFile);
    if (customerRows.length === 0) {
      throw new Error("O arquivo de clientes está vazio.");
    }
    importedCustomers = buildCustomerRecords(customerRows);
  }

  let orderRows: Order[] = [];
  if (shouldImportOrders && orderFile) {
    orderRows = await parseOrderImport(orderFile);
    if (orderRows.length === 0) {
      throw new Error("O arquivo de pedidos está vazio.");
    }
  }

  let customerSourceRecords: ReturnType<typeof buildCustomerRecords> | null = importedCustomers;
  if (shouldImportOrders && !customerSourceRecords) {
    const existingCustomers = await fetchCustomers();
    if (existingCustomers.length === 0) {
      throw new Error("Não há clientes cadastrados no Supabase. Importe clientes antes de pedidos.");
    }
    customerSourceRecords = existingCustomers.map(customerRecordToInsert);
  }

  let ordersPayload: ReturnType<typeof buildOrderRecords> | null = null;
  if (shouldImportOrders) {
    const customerMap = new Map(
      customerSourceRecords!.map((customer) => [normalizeShortName(customer.short_name), customer]),
    );
    const shortNameSet = new Set(Array.from(customerMap.keys()));
    const unmatched = collectUnmatchedOrders(orderRows, shortNameSet);
    if (unmatched.length > 0) {
      const exemplos = unmatched.join(", ");
      throw new Error(`Alguns pedidos não possuem cliente correspondente: ${exemplos}`);
    }

    const customerMapForPayload = new Map(
      customerSourceRecords!.map((customer) => [customer.short_name, customer]),
    );
    ordersPayload = buildOrderRecords({ orders: orderRows, customerMap: customerMapForPayload });
  }

  if (shouldImportCustomers && shouldImportOrders) {
    await truncateOrders();
    await truncateCustomers();
    await insertCustomers(importedCustomers!);
    await insertOrders(ordersPayload!);
    customersInserted = importedCustomers!.length;
    ordersInserted = ordersPayload!.length;
  } else if (shouldImportCustomers) {
    await truncateCustomers();
    await insertCustomers(importedCustomers!);
    customersInserted = importedCustomers!.length;
  } else if (shouldImportOrders) {
    await truncateOrders();
    await insertOrders(ordersPayload!);
    ordersInserted = ordersPayload!.length;
  }

  return {
    customers: customersInserted,
    orders: ordersInserted,
  };
}
