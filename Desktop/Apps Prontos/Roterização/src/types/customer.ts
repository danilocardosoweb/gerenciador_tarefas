export interface CustomerImportRow {
  Codigo?: string;
  "Nome": string;
  "Nome Abreviado": string;
  "Logradouro": string;
  "Número"?: string;
  "Complemento"?: string;
  "Bairro"?: string;
  "Cidade": string;
  "Estado": string;
  "CEP"?: string;
  "Telefone"?: string;
  [key: string]: unknown;
}

export interface CustomerRecord {
  id: string;
  short_name: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  lat: number | null;
  lon: number | null;
  geocoded: boolean;
  transportadora_address?: string | null;
  transportadora_city?: string | null;
  transportadora_state?: string | null;
  transportadora_cep?: string | null;
  transportadora_lat?: number | null;
  transportadora_lon?: number | null;
  transportadora_geocoded?: boolean;
  use_transportadora?: boolean;
  raw_data: Record<string, unknown>;
  created_at: string;
}
