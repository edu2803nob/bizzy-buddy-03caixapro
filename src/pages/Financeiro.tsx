import { useState, useMemo } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, Trash2, ChevronDown, ChevronRight, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore, type Lancamento } from "@/contexts/StoreContext";
import { format, subDays, startOfMonth, startOfYear, isAfter, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Periodo = "hoje" | "7dias" | "30dias" | "mes" | "ano" | "custom";

export default function Financeiro() {
  const { lancamentos, setLancamentos } = useStore();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("30dias");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [form, setForm] = useState({ tipo: "saida" as "entrada" | "saida", descricao: "", valor: "", categoria: "", data: "" });

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getDateRange = (p: Periodo): [Date, Date] => {
    const now = new Date();
    const end = now;
    switch (p) {
      case "hoje": return [startOfDay(now), end];
      case "7dias": return [subDays(now, 7), end];
      case "30dias": return [subDays(now, 30), end];
      case "mes": return [startOfMonth(now), end];
      case "ano": return [startOfYear(now), end];
      case "custom": return [customFrom || subDays(now, 30), customTo || end];
    }
  };

  const filtered = useMemo(() => {
    const [start, end] = getDateRange(periodo);
    return lancamentos.filter(l => {
      const d = new Date(l.data + "T00:00:00");
      return !isBefore(d, startOfDay(start)) && !isAfter(d, end);
    });
  }, [lancamentos, periodo, customFrom, customTo]);

  const entradas = filtered.filter(l => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
  const saidas = filtered.filter(l => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);

  const handleAdd = () => {
    if (!form.descricao || !form.valor) return;
    setLancamentos(prev => [...prev, {
      id: Date.now().toString(),
      tipo: form.tipo,
      descricao: form.descricao,
      valor: Number(form.valor),
      categoria: form.categoria,
      data: form.data || new Date().toISOString().split("T")[0],
    }]);
    setForm({ tipo: "saida", descricao: "", valor: "", categoria: "", data: "" });
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setLancamentos(prev => prev.filter(l => l.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const periodos: { key: Periodo; label: string }[] = [
    { key: "hoje", label: "Hoje" },
    { key: "7dias", label: "7 dias" },
    { key: "30dias", label: "30 dias" },
    { key: "mes", label: "Mês" },
    { key: "ano", label: "Ano" },
    { key: "custom", label: "Personalizado" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Financeiro</h2>
          <p className="text-sm text-muted-foreground mt-1">Entradas e saídas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Lançamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v: "entrada" | "saida") => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Descrição</Label><Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
              <div><Label className="text-xs">Valor</Label><Input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></div>
              <div><Label className="text-xs">Categoria</Label><Input value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} /></div>
              <div><Label className="text-xs">Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
              <Button onClick={handleAdd} className="mt-2">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros de período */}
      <div className="flex flex-wrap items-center gap-2">
        {periodos.map(p => (
          <Button
            key={p.key}
            variant={periodo === p.key ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setPeriodo(p.key)}
          >
            {p.label}
          </Button>
        ))}

        {periodo === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", !customFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customFrom ? format(customFrom, "dd/MM/yyyy") : "De"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", !customTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customTo ? format(customTo, "dd/MM/yyyy") : "Até"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customTo} onSelect={setCustomTo} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card animate-fade-in-up">
          <p className="text-sm text-muted-foreground">Entradas</p>
          <p className="text-2xl font-semibold text-success mt-1">{fmt(entradas)}</p>
          <p className="text-xs text-muted-foreground mt-1">{filtered.filter(l => l.tipo === "entrada").length} registros</p>
        </div>
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <p className="text-sm text-muted-foreground">Saídas</p>
          <p className="text-2xl font-semibold text-destructive mt-1">{fmt(saidas)}</p>
          <p className="text-xs text-muted-foreground mt-1">{filtered.filter(l => l.tipo === "saida").length} registros</p>
        </div>
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <p className="text-sm text-muted-foreground">Saldo</p>
          <p className={`text-2xl font-semibold mt-1 ${entradas - saidas >= 0 ? "text-success" : "text-destructive"}`}>
            {fmt(entradas - saidas)}
          </p>
        </div>
      </div>

      {/* Transações */}
      <div className="stat-card p-0 overflow-hidden animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <div className="divide-y divide-border/60">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum lançamento no período.</p>
          )}
          {filtered.map(l => (
            <div key={l.id} className="group">
              <div
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => setExpandedId(prev => prev === l.id ? null : l.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${l.tipo === "entrada" ? "bg-success/10" : "bg-destructive/10"}`}>
                    {l.tipo === "entrada"
                      ? <ArrowUpRight className="h-4 w-4 text-success" />
                      : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedId === l.id
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <div>
                      <p className="text-sm font-medium">{l.descricao}</p>
                      <p className="text-xs text-muted-foreground">{l.data} · {l.categoria}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-sm font-semibold tabular-nums ${l.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                    {l.tipo === "entrada" ? "+" : "-"}{fmt(l.valor)}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={e => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
                        <AlertDialogDescription>"{l.descricao}" de {fmt(l.valor)} será removido.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(l.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {expandedId === l.id && (
                <div className="px-5 pb-4 pt-1 bg-muted/20 border-t border-border/40 animate-fade-in-up">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div><p className="text-muted-foreground mb-0.5">Tipo</p><p className="font-medium capitalize">{l.tipo}</p></div>
                    <div><p className="text-muted-foreground mb-0.5">Categoria</p><p className="font-medium">{l.categoria || "—"}</p></div>
                    <div><p className="text-muted-foreground mb-0.5">Data</p><p className="font-medium">{l.data}</p></div>
                    <div><p className="text-muted-foreground mb-0.5">Valor</p><p className={`font-medium ${l.tipo === "entrada" ? "text-success" : "text-destructive"}`}>{fmt(l.valor)}</p></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
