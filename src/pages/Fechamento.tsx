import { useState } from "react";
import { Wallet, Check, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore } from "@/contexts/StoreContext";
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

interface CashClose {
  id: string;
  data: string;
  total: number;
  vendas: number;
}

export default function Fechamento() {
  const { vendasDoDia, fecharCaixa } = useStore();
  const [history, setHistory] = useState<CashClose[]>([
    { id: "1", data: "2024-03-19", total: 4250, vendas: 9 },
    { id: "2", data: "2024-03-18", total: 3120, vendas: 6 },
    { id: "3", data: "2024-03-17", total: 5670, vendas: 12 },
  ]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const todayTotal = vendasDoDia.reduce((s, v) => s + v.total, 0);
  const todaySales = vendasDoDia.length;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleClose = () => {
    const result = fecharCaixa();
    if (!result) {
      toast.error("Nenhuma venda para fechar");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    setHistory(prev => [{ id: Date.now().toString(), data: today, total: result.total, vendas: result.vendas }, ...prev]);
    toast.success("Caixa fechado com sucesso!");
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setHistory(prev => prev.filter(h => h.id !== deleteId));
    if (expandedId === deleteId) setExpandedId(null);
    setDeleteId(null);
    toast.success("Fechamento excluído");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Fechamento de Caixa</h2>
        <p className="text-sm text-muted-foreground mt-1">Resumo diário e histórico</p>
      </div>

      <div className="stat-card max-w-md animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Caixa de Hoje</p>
            <p className="text-2xl font-bold tracking-tight">{fmt(todayTotal)}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{todaySales} vendas realizadas</p>
        <Button onClick={handleClose} className="w-full">
          <Check className="h-4 w-4 mr-1" /> Fechar Caixa
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Histórico</h3>
        <div className="stat-card p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="divide-y divide-border/60">
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum fechamento registrado</p>
            )}
            {history.map(h => (
              <div key={h.id} className="group">
                <div
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedId === h.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{h.data}</p>
                      <p className="text-xs text-muted-foreground">{h.vendas} vendas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums text-success">{fmt(h.total)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(h.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedId === h.id && (
                  <div className="px-5 pb-4 pt-1 bg-muted/20 border-t border-border/40 animate-fade-in-up">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Data</p>
                        <p className="font-medium">{h.data}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total de Vendas</p>
                        <p className="font-medium">{h.vendas}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total Faturado</p>
                        <p className="font-semibold text-success">{fmt(h.total)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Média por Venda</p>
                        <p className="font-medium">{fmt(h.vendas > 0 ? h.total / h.vendas : 0)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fechamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
