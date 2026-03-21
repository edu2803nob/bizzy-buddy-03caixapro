import { useState } from "react";
import { Wallet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CashClose {
  id: string;
  data: string;
  total: number;
  vendas: number;
}

export default function Fechamento() {
  const [todaySales] = useState(7);
  const [todayTotal] = useState(3847);
  const [history, setHistory] = useState<CashClose[]>([
    { id: "1", data: "2024-03-19", total: 4250, vendas: 9 },
    { id: "2", data: "2024-03-18", total: 3120, vendas: 6 },
    { id: "3", data: "2024-03-17", total: 5670, vendas: 12 },
  ]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleClose = () => {
    const today = new Date().toISOString().split("T")[0];
    setHistory(prev => [{ id: Date.now().toString(), data: today, total: todayTotal, vendas: todaySales }, ...prev]);
    toast.success("Caixa fechado com sucesso!");
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
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">{h.data}</p>
                  <p className="text-xs text-muted-foreground">{h.vendas} vendas</p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-success">{fmt(h.total)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
