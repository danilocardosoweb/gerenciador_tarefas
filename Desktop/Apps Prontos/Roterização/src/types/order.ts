export interface Order {
  Status: string;
  Pedido: number | string;
  Cliente: string;
  "Nr Pedido": number | string;
  "Base de Origem": string;
  "Data Implant": string | null;
  "Sem/Ent": string;
  "Data Entrega": string | null;
  "Data Ent.Orig": string | null;
  "Data Prog": string | null;
  "Data Ult Fat": string | null;
  Produto: string;
  Ferramenta: string;
  "Un.At": string;
  "Un.Fat": number | string;
  "Pedido Kg": number | string;
  "Pedido Pc": number | string;
  "Saldo Kg": number | string;
  "Saldo Pc": number | string;
  "Empenho Kg": number | string;
  "Empenho Pc": number | string;
  "Produzido Kg": number | string;
  "Produzido Pc": number | string;
  "Embalado Kg": number | string;
  "Embalado Pc": number | string;
  "Romaneio Kg": number | string;
  "Romaneio Pc": number | string;
  "Faturado Kg": number | string;
  "Faturado Pc": number | string;
  Prior: string;
  "Valor Pedido": number | string;
  "Aliq. IPI": number | string;
  "Aliq. ICMS": number | string;
  Representante: string;
  CFOP: number | string;
  Natureza: string;
  Liga: string;
  Têmpera: string;
  "Código Mercado": string;
  "Item do Cliente": string;
  "Local Entrega": string;
  "Cidade Entrega": string;
  "Atend.Pedido": string;
  "Sit Item OF": string;
  "Notas Fiscais": string;
  Crédido: string;
  "Condições Especiais": string;
  "Obs. Situação": string;
  "Cod.Rota": string;
  Rota: string;

  lat?: number | null;
  lon?: number | null;
  cep?: string | null;
  geocoded?: boolean;
  rota_normalizada?: string;
  customer_short_name?: string;
  id?: string;
}

export interface OrderSupabaseRow {
  id: string;
  customer_short_name: string;
  cliente: string;
  data_entrega: string | null;
  rota: string | null;
  rota_normalizada: string | null;
  cep: string | null;
  lat: number | null;
  lon: number | null;
  geocoded: boolean;
  raw_data: Order;
  created_at: string;
}

export interface OrderInsertPayload {
  customer_short_name: string;
  cliente: string;
  data_entrega: string | null;
  rota: string | null;
  rota_normalizada: string | null;
  cep: string | null;
  lat: number | null;
  lon: number | null;
  geocoded: boolean;
  raw_data: Order;
}