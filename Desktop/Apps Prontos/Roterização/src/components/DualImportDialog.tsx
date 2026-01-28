import { useMemo, useState } from "react";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { importCustomersAndOrders } from "@/services/importWorkflow";

interface DualImportDialogProps {
  onImported: () => Promise<void> | void;
}

export function DualImportDialog({ onImported }: DualImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customerFile, setCustomerFile] = useState<File | null>(null);
  const [orderFile, setOrderFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importCustomers, setImportCustomers] = useState(true);
  const [importOrders, setImportOrders] = useState(true);

  const selectionsValid = useMemo(() => {
    const wantsCustomers = importCustomers;
    const wantsOrders = importOrders;
    if (!wantsCustomers && !wantsOrders) return false;
    if (wantsCustomers && !customerFile) return false;
    if (wantsOrders && !orderFile) return false;
    return true;
  }, [importCustomers, importOrders, customerFile, orderFile]);

  const handleFileChange = (setter: (file: File | null) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setter(file);
  };

  const resetState = () => {
    setCustomerFile(null);
    setOrderFile(null);
    setImportCustomers(true);
    setImportOrders(true);
  };

  const handleImport = async () => {
    if (!selectionsValid) {
      toast.error("Selecione pelo menos um arquivo válido para importar.");
      return;
    }

    setIsImporting(true);
    try {
      const result = await importCustomersAndOrders({
        customerFile: importCustomers ? customerFile ?? undefined : undefined,
        orderFile: importOrders ? orderFile ?? undefined : undefined,
      });

      const partes: string[] = [];
      if (result.customers !== undefined) {
        partes.push(`${result.customers} clientes`);
      }
      if (result.orders !== undefined) {
        partes.push(`${result.orders} pedidos`);
      }

      toast.success("Importação concluída com sucesso!", {
        description: partes.length > 0 ? `${partes.join(" e ")} foram atualizados no Supabase.` : undefined,
      });
      await onImported();
      setIsOpen(false);
      resetState();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido ao importar arquivos.";
      toast.error("Falha na importação.", { description: message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isImporting) { resetState(); } setIsOpen(open); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UploadCloud className="h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar dados</DialogTitle>
          <DialogDescription>
            Selecione quais planilhas deseja atualizar e envie os respectivos arquivos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-file" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Cadastro de Clientes (Excel)
            </Label>
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="customer-toggle"
                checked={importCustomers}
                disabled={isImporting}
                onCheckedChange={(checked) => setImportCustomers(Boolean(checked))}
              />
              <p className="text-xs text-muted-foreground">
                Importe sempre que houver novos pedidos. As coordenadas serão copiadas do cadastro de clientes já geocodificado.
              </p>
              <Label htmlFor="customer-toggle" className="cursor-pointer">Importar clientes</Label>
            </div>
            <Input
              id="customer-file"
              type="file"
              accept=".xlsx,.xls"
              disabled={isImporting || !importCustomers}
              onChange={handleFileChange(setCustomerFile)}
            />
            {customerFile && <p className="text-xs text-muted-foreground">Selecionado: {customerFile.name}</p>}
            <p className="text-xs text-muted-foreground">
              Use esta planilha apenas quando houver alterações cadastradas. Após o upload, os clientes serão geocodificados e os pedidos reutilizarão as coordenadas automaticamente.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-file" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Carteira de Encomendas (Excel)
            </Label>
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="order-toggle"
                checked={importOrders}
                disabled={isImporting}
                onCheckedChange={(checked) => setImportOrders(Boolean(checked))}
              />
              <Label htmlFor="order-toggle" className="cursor-pointer">Importar pedidos</Label>
            </div>
            <Input
              id="order-file"
              type="file"
              accept=".xlsx,.xls"
              disabled={isImporting || !importOrders}
              onChange={handleFileChange(setOrderFile)}
            />
            {orderFile && <p className="text-xs text-muted-foreground">Selecionado: {orderFile.name}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isImporting}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !selectionsValid}>
            {isImporting ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
