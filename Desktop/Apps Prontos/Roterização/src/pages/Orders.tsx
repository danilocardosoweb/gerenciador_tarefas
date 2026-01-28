import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  FileText,
  Loader2,
  MapPin,
  PackageCheck,
  PanelLeftClose,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { DualImportDialog } from "@/components/DualImportDialog";
import { OrderTable } from "@/components/OrderTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppNavigation } from "@/components/AppNavigation";
import { cn, formatNumber } from "@/lib/utils";
import { normalizeCep, normalizeString } from "@/lib/normalization";
import { fetchCustomers, fetchOrders, clearSupabaseData, updateCustomerTransportadora } from "@/services/supabaseData";
import { geocodePendingOrders, GeocodeProgressUpdate, geocodeTransportadora } from "@/services/geocoding";
import { Order } from "@/types/order";
import { OrderSupabaseRow } from "@/types/order";
import { CustomerRecord } from "@/types/customer";
import { format } from "date-fns";

type GroupByOption = "Rota" | "Cliente" | "Nr Pedido";

type FiltersState = {
  cliente: string;
  nrPedido: string;
  dataEntrega: string;
  rota: string;
  produzidoPositivo: boolean;
  embaladoPositivo: boolean;
};

type EnrichedOrder = Order & {
  id: string;
  customer_short_name?: string;
  cep?: string | null;
  rota_normalizada?: string;
  geocoded?: boolean | null;
};

type TransportadoraFormState = {
  useTransportadora: boolean;
  address: string;
  city: string;
  state: string;
  cep: string;
};

const createDefaultTransportadoraForm = (): TransportadoraFormState => ({
  useTransportadora: false,
  address: "",
  city: "",
  state: "",
  cep: "",
});

type TransportadoraFieldName = "address" | "city" | "state" | "cep";

type TransportadoraFormErrors = Partial<Record<TransportadoraFieldName | "general", string>>;

const getOrderValue = (order: EnrichedOrder, key: GroupByOption) => {
  const record = order as unknown as Record<string, unknown>;
  return record[key];
};

const Orders = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FiltersState>({
    cliente: "",
    nrPedido: "",
    dataEntrega: "",
    rota: "",
    produzidoPositivo: false,
    embaladoPositivo: false,
  });
  const [groupBy, setGroupBy] = useState<GroupByOption>("Rota");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [geocodeProgress, setGeocodeProgress] = useState<GeocodeProgressUpdate | null>(null);
  const [excludedOrderIds, setExcludedOrderIds] = useState<Set<string>>(new Set());
  const [transportadoraDialogOpen, setTransportadoraDialogOpen] = useState(false);
  const [selectedTransportadoraCustomer, setSelectedTransportadoraCustomer] = useState<CustomerRecord | null>(null);
  const [transportadoraForm, setTransportadoraForm] = useState<TransportadoraFormState>(createDefaultTransportadoraForm());
  const [transportadoraErrors, setTransportadoraErrors] = useState<TransportadoraFormErrors>({});
  const [transportadoraAction, setTransportadoraAction] = useState<"save" | "geocode" | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearSelection, setClearSelection] = useState<{ customers: boolean; orders: boolean }>({ customers: true, orders: true });

  const ordersQuery = useQuery<OrderSupabaseRow[], Error>({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    staleTime: 60_000,
    retry: false,
  });

  const customersQuery = useQuery<CustomerRecord[], Error>({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
    staleTime: 120_000,
    retry: false,
  });

  useEffect(() => {
    if (ordersQuery.error) {
      toast.error("Falha ao carregar pedidos.", { description: ordersQuery.error.message });
    }
  }, [ordersQuery.error]);

  useEffect(() => {
    if (customersQuery.error) {
      toast.error("Falha ao carregar clientes.", { description: customersQuery.error.message });
    }
  }, [customersQuery.error]);

  const ordersData: OrderSupabaseRow[] = ordersQuery.data ?? [];
  const customersData: CustomerRecord[] = customersQuery.data ?? [];

  const customerLookup = useMemo(() => {
    const map = new Map<string, CustomerRecord>();
    customersData.forEach((customer) => {
      map.set(normalizeString(customer.short_name), customer);
    });
    return map;
  }, [customersData]);

  const resetTransportadoraDialog = () => {
    setTransportadoraDialogOpen(false);
    setSelectedTransportadoraCustomer(null);
    setTransportadoraForm(createDefaultTransportadoraForm());
    setTransportadoraErrors({});
    setTransportadoraAction(null);
  };

  const populateTransportadoraForm = (customer: CustomerRecord) => {
    setTransportadoraForm({
      useTransportadora: Boolean(customer.use_transportadora),
      address: customer.transportadora_address ?? "",
      city: customer.transportadora_city ?? "",
      state: (customer.transportadora_state ?? "").toString().toUpperCase(),
      cep: customer.transportadora_cep ?? "",
    });
    setTransportadoraErrors({});
  };

  const handleManageTransportadora = (customer: CustomerRecord) => {
    setSelectedTransportadoraCustomer(customer);
    populateTransportadoraForm(customer);
    setTransportadoraDialogOpen(true);
  };

  const handleTransportadoraFieldChange = (field: TransportadoraFieldName) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTransportadoraForm((prev) => ({ ...prev, [field]: value }));
    setTransportadoraErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleTransportadoraStateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const onlyLetters = event.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
    setTransportadoraForm((prev) => ({ ...prev, state: onlyLetters }));
    setTransportadoraErrors((prev) => {
      if (!prev.state) return prev;
      const next = { ...prev };
      delete next.state;
      return next;
    });
  };

  const handleTransportadoraCepChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setTransportadoraForm((prev) => ({ ...prev, cep: formatted }));
    setTransportadoraErrors((prev) => {
      if (!prev.cep) return prev;
      const next = { ...prev };
      delete next.cep;
      return next;
    });
  };

  const handleTransportadoraUseChange = (checked: boolean) => {
    setTransportadoraForm((prev) => ({ ...prev, useTransportadora: checked }));
    if (!checked) {
      setTransportadoraErrors({});
    }
  };

  const validateTransportadoraForm = (form: TransportadoraFormState): TransportadoraFormErrors => {
    const errors: TransportadoraFormErrors = {};

    if (!form.useTransportadora) {
      return errors;
    }

    const address = form.address.trim();
    const city = form.city.trim();
    const state = form.state.trim().toUpperCase();
    const cepDigits = form.cep.replace(/[^0-9]/g, "");

    if (!address) {
      errors.address = "Informe o endereço da transportadora.";
    }

    if (!city) {
      errors.city = "Informe a cidade da transportadora.";
    }

    if (state.length !== 2) {
      errors.state = "Informe o estado com duas letras.";
    }

    if (form.cep.trim() && cepDigits.length !== 8) {
      errors.cep = "CEP deve conter 8 dígitos.";
    }

    if (cepDigits.length === 0 && (!address || !city || state.length !== 2)) {
      errors.general = "Informe CEP válido ou endereço completo.";
    }

    return errors;
  };

  const refetchData = async () => {
    await Promise.all([ordersQuery.refetch(), customersQuery.refetch()]);
  };

  const toggleOrderInclusion = (orderId: string, included: boolean) => {
    setExcludedOrderIds((prev) => {
      const next = new Set(prev);
      if (included) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const orders: EnrichedOrder[] = useMemo(() => {
    if (!ordersQuery.data) return [];
    return ordersQuery.data.map((row) => ({
      ...row.raw_data,
      id: row.id,
      customer_short_name: row.customer_short_name,
      cep: row.cep,
      rota_normalizada: row.rota_normalizada ?? undefined,
      lat: row.lat ?? null,
      lon: row.lon ?? null,
      geocoded: row.geocoded,
    }));
  }, [ordersQuery.data]);

  useEffect(() => {
    setSelectedGroups([]);
    setExcludedOrderIds(new Set());
  }, [ordersQuery.data]);

  const handleTextFilterChange = (filterName: keyof Pick<FiltersState, "cliente" | "nrPedido" | "dataEntrega" | "rota">, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleBooleanFilterChange = (
    filterName: keyof Pick<FiltersState, "produzidoPositivo" | "embaladoPositivo">,
    value: boolean,
  ) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleGroupSelectionChange = (groupKey: string, isSelected: boolean) => {
    setSelectedGroups((prev) => (isSelected ? [...prev, groupKey] : prev.filter((key) => key !== groupKey)));
  };

  const parseNumericField = (value: unknown): number => {
    if (value === null || value === undefined || value === "") {
      return 0;
    }
    if (typeof value === "number") {
      return value;
    }
    const normalized = value
      .toString()
      .trim()
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const clienteMatch =
        !filters.cliente || order.Cliente?.toString().toLowerCase().includes(filters.cliente.toLowerCase());
      const nrPedidoMatch =
        !filters.nrPedido || order["Nr Pedido"]?.toString().toLowerCase().includes(filters.nrPedido.toLowerCase());

      let dataEntregaMatch = true;
      if (filters.dataEntrega) {
        const dateValue = order["Data Entrega"];
        if (dateValue) {
          try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              const formattedDate = format(date, "dd/MM/yyyy");
              dataEntregaMatch = formattedDate.includes(filters.dataEntrega);
            } else {
              dataEntregaMatch = false;
            }
          } catch {
            dataEntregaMatch = order["Data Entrega"]
              ?.toString()
              .toLowerCase()
              .includes(filters.dataEntrega.toLowerCase());
          }
        } else {
          dataEntregaMatch = false;
        }
      }

      const rotaMatch = !filters.rota || order.Rota?.toString().toLowerCase().includes(filters.rota.toLowerCase());
      const produzidoValor = parseNumericField(order["Produzido Kg"]);
      const embaladoValor = parseNumericField(order["Embalado Kg"]);
      const produzidoMatch = !filters.produzidoPositivo || produzidoValor > 0;
      const embaladoMatch = !filters.embaladoPositivo || embaladoValor > 0;

      return clienteMatch && nrPedidoMatch && dataEntregaMatch && rotaMatch && produzidoMatch && embaladoMatch;
    });
  }, [filters, orders]);

  const groupedOrders = useMemo(() => {
    const encodePart = (value: string) => encodeURIComponent(value);

    return filteredOrders.reduce((acc, order) => {
      const cliente = order.Cliente?.toString().trim() || "Cliente não informado";
      const rota = order.Rota?.toString().trim() || "Rota não informada";
      const nrPedido = order["Nr Pedido"]?.toString().trim() || "Pedido sem número";

      let keyType: GroupByOption | "RotaCliente" = groupBy;
      if (groupBy === "Rota") {
        keyType = "Rota";
      }

      let key: string;
      switch (keyType) {
        case "Cliente":
          key = ["cliente", encodePart(cliente)].join("::");
          break;
        case "Nr Pedido":
          key = ["pedido", encodePart(nrPedido)].join("::");
          break;
        case "Rota":
        default:
          key = ["rota", encodePart(cliente), encodePart(rota)].join("::");
          break;
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
      return acc;
    }, {} as Record<string, EnrichedOrder[]>);
  }, [filteredOrders, groupBy]);

  const selectedTotals = useMemo(() => {
    return selectedGroups.reduce(
      (acc, groupKey) => {
        const ordersInGroup = groupedOrders[groupKey] || [];
        ordersInGroup.forEach((order) => {
          if (order.id && excludedOrderIds.has(order.id)) {
            return;
          }
          acc.produzidoKg += Number(order["Produzido Kg"]) || 0;
          acc.embaladoKg += Number(order["Embalado Kg"]) || 0;
        });
        return acc;
      },
      { produzidoKg: 0, embaladoKg: 0 },
    );
  }, [groupedOrders, selectedGroups, excludedOrderIds]);

  const handleSelectAllGroups = () => {
    const allGroupKeys = Object.keys(groupedOrders);
    if (allGroupKeys.length === 0) {
      return;
    }
    if (selectedGroups.length === allGroupKeys.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(allGroupKeys);
    }
  };

  const handleAddToRoute = () => {
    const selectedOrders = selectedGroups.flatMap((groupKey) => groupedOrders[groupKey] || []);
    const activeOrders = selectedOrders.filter((order) => !order.id || !excludedOrderIds.has(order.id));
    const geocodedOrders = activeOrders.filter((order) => order.lat && order.lon);

    if (geocodedOrders.length === 0) {
      toast.error("Nenhum pedido selecionado possui coordenadas.", {
        description: "Geocodifique os pedidos antes de adicioná-los à rota.",
      });
      return;
    }

    const waypointsByCoord = new Map<
      string,
      { lat: number; lon: number; address: string; orders: Order[]; produzidoTotal: number; embaladoTotal: number }
    >();

    geocodedOrders.forEach((order) => {
      const key = `${order.lat!.toFixed(6)},${order.lon!.toFixed(6)}`;
      const address = order["Cidade Entrega"] || order.Cliente || "Endereço desconhecido";
      const produzidoValor = parseNumericField(order["Produzido Kg"]);
      const embaladoValor = parseNumericField(order["Embalado Kg"]);

      if (waypointsByCoord.has(key)) {
        const stored = waypointsByCoord.get(key)!;
        stored.orders.push(order);
        stored.produzidoTotal += produzidoValor;
        stored.embaladoTotal += embaladoValor;
      } else {
        waypointsByCoord.set(key, {
          lat: order.lat!,
          lon: order.lon!,
          address,
          orders: [order],
          produzidoTotal: produzidoValor,
          embaladoTotal: embaladoValor,
        });
      }
    });

    const waypointsForRoute = Array.from(waypointsByCoord.values());
    toast.success(`${waypointsForRoute.length} pontos de entrega adicionados à rota!`);
    navigate("/", { state: { newWaypoints: waypointsForRoute } });
  };

  const geocodeMutation = useMutation({
    mutationFn: async () => {
      const ordersData = ordersQuery.data ?? [];
      if (ordersData.length === 0) {
        throw new Error("Não há pedidos para geocodificar.");
      }

      const customersData = customersQuery.data ?? [];

      return geocodePendingOrders({
        orders: ordersData,
        customers: customersData,
        onProgress: (update) => setGeocodeProgress(update),
      });
    },
    onSuccess: async (summary) => {
      toast.success("Geocodificação concluída!", {
        description: `${summary.customers.geocoded} clientes e ${summary.orders.geocoded} pedidos com sucesso (${summary.orders.reusedFromCustomer} reaproveitados de clientes).`,
      });
      await refetchData();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erro inesperado na geocodificação.";
      toast.error("Falha ao geocodificar.", { description: message });
    },
    onSettled: () => {
      setTimeout(() => setGeocodeProgress(null), 1500);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async (options: { customers: boolean; orders: boolean }) => {
      if (!options.customers && !options.orders) {
        throw new Error("Selecione ao menos um tipo de dado para limpar.");
      }
      await clearSupabaseData(options);
    },
    onSuccess: async (_, variables) => {
      const partes: string[] = [];
      if (variables.customers) partes.push("clientes");
      if (variables.orders) partes.push("pedidos");
      const descricao = partes.length > 0 ? `${partes.join(" e ")} foram removidos do Supabase.` : undefined;
      toast.info("Limpeza concluída.", { description: descricao });
      await refetchData();
      setSelectedGroups([]);
      setClearDialogOpen(false);
      setClearSelection({ customers: true, orders: true });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erro ao limpar dados.";
      toast.error("Falha ao limpar dados.", { description: message });
      setClearDialogOpen(true);
    },
  });

  const handleClearSelectionToggle = (field: "customers" | "orders") => (checked: boolean | string) => {
    const value = Boolean(checked);
    setClearSelection((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmClear = async () => {
    if (!clearSelection.customers && !clearSelection.orders) {
      toast.error("Selecione pelo menos um item para limpar.");
      return;
    }

    try {
      await clearMutation.mutateAsync({ ...clearSelection });
    } catch {
      // Erro tratado no onError da mutação
    }
  };

  const transportadoraMutation = useMutation<
    { geocoded: boolean; cep: string | null },
    Error,
    { customer: CustomerRecord; form: TransportadoraFormState; geocodeAfterSave: boolean }
  >({
    mutationFn: async ({ customer, form, geocodeAfterSave }) => {
      const useTransportadora = form.useTransportadora;
      const sanitizedCep = useTransportadora ? normalizeCep(form.cep || null) : "";
      const normalizedState = useTransportadora ? form.state.trim().toUpperCase() : "";
      const payload = {
        address: useTransportadora ? form.address.trim() || null : null,
        city: useTransportadora ? form.city.trim() || null : null,
        state: useTransportadora && normalizedState ? normalizedState : null,
        cep: useTransportadora ? sanitizedCep || null : null,
        useTransportadora,
      };

      await updateCustomerTransportadora(customer.id, payload);

      const updatedCustomer: CustomerRecord = {
        ...customer,
        transportadora_address: payload.address,
        transportadora_city: payload.city,
        transportadora_state: payload.state,
        transportadora_cep: payload.cep,
        transportadora_geocoded: false,
        transportadora_lat: null,
        transportadora_lon: null,
        use_transportadora: payload.useTransportadora,
      };

      if (geocodeAfterSave && useTransportadora) {
        try {
          const result = await geocodeTransportadora(updatedCustomer);
          return { geocoded: true, cep: result.cep ?? payload.cep ?? null };
        } catch (error) {
          throw new Error(`Dados salvos, mas geocodificação falhou: ${(error as Error).message}`);
        }
      }

      return { geocoded: false, cep: payload.cep ?? null };
    },
    onSuccess: async (data, variables) => {
      const { geocodeAfterSave, form } = variables;
      const successMessage = geocodeAfterSave && form.useTransportadora
        ? "Transportadora salva e geocodificada com sucesso!"
        : "Transportadora salva com sucesso.";

      toast.success(successMessage, {
        description: data.geocoded && data.cep ? `CEP utilizado: ${data.cep}` : undefined,
      });

      await refetchData();
      resetTransportadoraDialog();
    },
    onError: (error) => {
      toast.error("Falha ao atualizar transportadora.", {
        description: error.message,
      });
      void refetchData();
    },
  });

  const handleTransportadoraSubmit = async (mode: "save" | "geocode") => {
    if (!selectedTransportadoraCustomer) return;

    if (mode === "geocode" && !transportadoraForm.useTransportadora) {
      toast.info("Ative o uso de transportadora para geocodificar.");
      return;
    }

    const errors = validateTransportadoraForm(transportadoraForm);
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      setTransportadoraErrors(errors);
      toast.error("Corrija os campos da transportadora antes de salvar.");
      return;
    }

    setTransportadoraAction(mode);
    try {
      await transportadoraMutation.mutateAsync({
        customer: selectedTransportadoraCustomer,
        form: transportadoraForm,
        geocodeAfterSave: mode === "geocode",
      });
    } finally {
      setTransportadoraAction(null);
    }
  };

  const isLoadingData = ordersQuery.isLoading || customersQuery.isLoading;
  const totalOrders = orders.length;
  const totalCustomers = customersData.length;
  const hasDataToClear = totalOrders > 0 || totalCustomers > 0;
  const geocodeTotal = geocodeProgress?.total ?? 0;
  const progressValue = geocodeProgress && geocodeTotal > 0 ? (geocodeProgress.processed / geocodeTotal) * 100 : 0;

  return (
    <>
      <div className="flex h-full w-full">
        <aside
          className={cn(
            "border-r bg-card shadow-lg flex flex-col transition-all duration-300 ease-in-out",
            isSidebarOpen ? "w-72" : "w-[80px]",
          )}
        >
        <div className="flex h-16 items-center justify-between border-b px-4">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-xl font-bold truncate">Roterização</h1>
                <p className="text-xs text-muted-foreground truncate">TecnoPerfil</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("transition-all", !isSidebarOpen && "mx-auto rotate-180")}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Recolher menu" : "Expandir menu"}
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        </div>
        <AppNavigation isCollapsed={!isSidebarOpen} />
      </aside>
      <main className="flex-1 flex h-full flex-col space-y-4 p-4 overflow-y-auto relative">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-2xl font-bold">
            <FileText className="h-6 w-6 text-primary" />
            Carteira de Pedidos
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DualImportDialog onImported={refetchData} />
            <Button
              onClick={() => geocodeMutation.mutate()}
              disabled={totalOrders === 0 || geocodeMutation.isPending || isLoadingData}
              className="gap-2"
            >
              {geocodeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Geocodificar pendentes
            </Button>
            <Button
              variant="destructive"
              onClick={() => setClearDialogOpen(true)}
              disabled={clearMutation.isPending || !hasDataToClear}
              className="gap-2"
            >
              {clearMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Limpar Supabase
            </Button>
          </div>
        </header>

        {(geocodeMutation.isPending || geocodeProgress) && (
          <div className="space-y-2 rounded-lg border p-4">
            <Progress value={progressValue} />
            <div className="flex flex-col text-sm text-muted-foreground">
              <span>
                Fase: {geocodeProgress?.stage === "clientes" ? "Clientes" : "Pedidos"}
                {geocodeProgress?.total ? ` (${geocodeProgress.processed} de ${geocodeProgress.total})` : ""}
              </span>
              {geocodeProgress?.label && <span>Processando: {geocodeProgress.label}</span>}
            </div>
          </div>
        )}

        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Filtrar por Cliente..."
              value={filters.cliente}
              onChange={(e) => handleTextFilterChange("cliente", e.target.value)}
            />
            <Input
              placeholder="Filtrar por Nr Pedido..."
              value={filters.nrPedido}
              onChange={(e) => handleTextFilterChange("nrPedido", e.target.value)}
            />
            <Input
              placeholder="Filtrar por Data Entrega..."
              value={filters.dataEntrega}
              onChange={(e) => handleTextFilterChange("dataEntrega", e.target.value)}
            />
            <Input
              placeholder="Filtrar por Rota..."
              value={filters.rota}
              onChange={(e) => handleTextFilterChange("rota", e.target.value)}
            />
            <Select value={groupBy} onValueChange={(value: GroupByOption) => setGroupBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Agrupar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rota">Agrupar por Rota</SelectItem>
                <SelectItem value="Cliente">Agrupar por Cliente</SelectItem>
                <SelectItem value="Nr Pedido">Agrupar por Nr Pedido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Label htmlFor="filtro-produzido" className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="filtro-produzido"
                  checked={filters.produzidoPositivo}
                  onCheckedChange={(checked) => handleBooleanFilterChange("produzidoPositivo", !!checked)}
                />
                Produzido Kg &gt; 0
              </Label>
              <Label htmlFor="filtro-embalado" className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="filtro-embalado"
                  checked={filters.embaladoPositivo}
                  onCheckedChange={(checked) => handleBooleanFilterChange("embaladoPositivo", !!checked)}
                />
                Embalado Kg &gt; 0
              </Label>
            </div>
            <Button variant="secondary" size="sm" onClick={handleSelectAllGroups} disabled={Object.keys(groupedOrders).length === 0}>
              {selectedGroups.length === Object.keys(groupedOrders).length && selectedGroups.length > 0
                ? "Limpar seleção"
                : "Selecionar todos"}
            </Button>
          </div>
          {selectedGroups.length > 0 && (
            <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{selectedGroups.length} grupos selecionados.</p>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Boxes className="h-3.5 w-3.5" />
                    <span>
                      Total Produzido: <strong>{formatNumber(selectedTotals.produzidoKg)} Kg</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PackageCheck className="h-3.5 w-3.5" />
                    <span>
                      Total Embalado: <strong>{formatNumber(selectedTotals.embaladoKg)} Kg</strong>
                    </span>
                  </div>
                </div>
              </div>
              <Button onClick={handleAddToRoute} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Adicionar à Rota
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden rounded-lg border">
          <OrderTable
            groupedOrders={groupedOrders}
            groupBy={groupBy}
            selectedGroups={selectedGroups}
            onGroupSelectionChange={handleGroupSelectionChange}
            totalOrders={totalOrders}
            isLoading={isLoadingData}
            excludedOrderIds={excludedOrderIds}
            onOrderIncludeChange={toggleOrderInclusion}
            customerLookup={customerLookup}
            onManageTransportadora={handleManageTransportadora}
          />
        </div>
      </main>
    </div>

      <Dialog
        open={transportadoraDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetTransportadoraDialog();
          }
        }}
      >
        <DialogContent aria-describedby="transportadora-dialog-description">
          <DialogHeader>
            <DialogTitle>Definir transportadora</DialogTitle>
            <DialogDescription id="transportadora-dialog-description">
              Preencha os dados da transportadora para atualizar o cliente e, se desejar, geocodificar automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="transportadora-switch" className="text-sm font-medium">
                  Utilizar transportadora
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ative para informar endereço e coordenadas específicas da transportadora.
                </p>
              </div>
              <Switch
                id="transportadora-switch"
                checked={transportadoraForm.useTransportadora}
                onCheckedChange={handleTransportadoraUseChange}
                aria-checked={transportadoraForm.useTransportadora}
                aria-label="Utilizar transportadora"
              />
            </div>

            {transportadoraErrors.general && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {transportadoraErrors.general}
              </div>
            )}

            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="transportadora-address">Endereço</Label>
                <Input
                  id="transportadora-address"
                  placeholder="Rua, número, complemento"
                  value={transportadoraForm.address}
                  onChange={handleTransportadoraFieldChange("address")}
                  disabled={!transportadoraForm.useTransportadora || transportadoraMutation.isPending}
                  aria-invalid={Boolean(transportadoraErrors.address)}
                />
                {transportadoraErrors.address && (
                  <p className="text-xs text-destructive">{transportadoraErrors.address}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="transportadora-city">Cidade</Label>
                <Input
                  id="transportadora-city"
                  placeholder="Cidade"
                  value={transportadoraForm.city}
                  onChange={handleTransportadoraFieldChange("city")}
                  disabled={!transportadoraForm.useTransportadora || transportadoraMutation.isPending}
                  aria-invalid={Boolean(transportadoraErrors.city)}
                />
                {transportadoraErrors.city && <p className="text-xs text-destructive">{transportadoraErrors.city}</p>}
              </div>

              <div className="grid gap-2 md:grid-cols-2 md:items-end md:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="transportadora-state">Estado (UF)</Label>
                  <Input
                    id="transportadora-state"
                    placeholder="UF"
                    value={transportadoraForm.state}
                    onChange={handleTransportadoraStateChange}
                    disabled={!transportadoraForm.useTransportadora || transportadoraMutation.isPending}
                    aria-invalid={Boolean(transportadoraErrors.state)}
                    maxLength={2}
                  />
                  {transportadoraErrors.state && <p className="text-xs text-destructive">{transportadoraErrors.state}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="transportadora-cep">CEP</Label>
                  <Input
                    id="transportadora-cep"
                    placeholder="00000-000"
                    value={transportadoraForm.cep}
                    onChange={handleTransportadoraCepChange}
                    disabled={!transportadoraForm.useTransportadora || transportadoraMutation.isPending}
                    aria-invalid={Boolean(transportadoraErrors.cep)}
                  />
                  {transportadoraErrors.cep && <p className="text-xs text-destructive">{transportadoraErrors.cep}</p>}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={resetTransportadoraDialog}
              disabled={transportadoraMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleTransportadoraSubmit("save")}
              disabled={transportadoraMutation.isPending}
              aria-live="polite"
            >
              {transportadoraAction === "save" && transportadoraMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar
            </Button>
            <Button
              type="button"
              onClick={() => void handleTransportadoraSubmit("geocode")}
              disabled={transportadoraMutation.isPending}
              className="gap-2"
              aria-live="polite"
            >
              {transportadoraAction === "geocode" && transportadoraMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {transportadoraAction === "geocode" && transportadoraMutation.isPending ? "Geocodificando" : "Salvar e geocodificar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={clearDialogOpen} onOpenChange={(open) => {
        if (!open && !clearMutation.isPending) {
          setClearDialogOpen(false);
        } else {
          setClearDialogOpen(open);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escolha o que deseja limpar</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione as tabelas que serão limpas no Supabase. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <Label htmlFor="clear-customers" className="flex items-center gap-2">
              <Checkbox
                id="clear-customers"
                checked={clearSelection.customers}
                onCheckedChange={handleClearSelectionToggle("customers")}
                disabled={clearMutation.isPending}
              />
              Limpar clientes
            </Label>
            <Label htmlFor="clear-orders" className="flex items-center gap-2">
              <Checkbox
                id="clear-orders"
                checked={clearSelection.orders}
                onCheckedChange={handleClearSelectionToggle("orders")}
                disabled={clearMutation.isPending}
              />
              Limpar pedidos
            </Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleConfirmClear}
                disabled={clearMutation.isPending}
                className="gap-2"
              >
                {clearMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar limpeza
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Orders;