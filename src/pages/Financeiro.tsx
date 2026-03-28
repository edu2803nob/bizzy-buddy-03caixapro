import { useState, useMemo } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, Trash2, ChevronDown, ChevronRight, CalendarIcon, CreditCard, Download, FileText } from "lucide-react";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore, type Lancamento } from "@/contexts/StoreContext";
import { format, subDays, startOfMonth, startOfYear, isAfter, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "sonner";

type Periodo = "hoje" | "7dias" | "30dias" | "mes" | "ano" | "custom";

const COLORS = [
  "hsl(152, 56%, 38%)", "hsl(220, 14%, 50%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 52%, 47%)", "hsl(200, 60%, 45%)",
];

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
    switch (p) {
      case "hoje": return [startOfDay(now), now];
      case "7dias": return [subDays(now, 7), now];
      case "30dias": return [subDays(now, 30), now];
      case "mes": return [startOfMonth(now), now];
      case "ano": return [startOfYear(now), now];
      case "custom": return [customFrom || subDays(now, 30), customTo || now];
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
  const vendasCount = filtered.filter(l => l.tipo === "entrada").length;
  const ticketMedio = vendasCount > 0 ? entradas / vendasCount : 0;

  const pagamentoMap = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; count: number }>();
    filtered.filter(l => l.tipo === "entrada" && l.formaPagamentoNome).forEach(l => {
      const key = l.formaPagamentoNome!;
      const entry = map.get(key) || { nome: key, total: 0, count: 0 };
      entry.total += l.valor;
      entry.count += 1;
      map.set(key, entry);
    });
    return Array.from(map.values());
  }, [filtered]);

  const handleAdd = () => {
    if (!form.descricao || !form.valor) return;
    setLancamentos(prev => [...prev, {
      id: Date.now().toString(), tipo: form.tipo, descricao: form.descricao,
      valor: Number(form.valor), categoria: form.categoria,
      data: form.data || new Date().toISOString().split("T")[0],
    }]);
    setForm({ tipo: "saida", descricao: "", valor: "", categoria: "", data: "" });
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setLancamentos(prev => prev.filter(l => l.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  // CSV export
  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("Nenhum dado para exportar"); return; }
    const header = "Tipo,Descrição,Categoria,Data,Valor,Forma de Pagamento\n";
    const rows = filtered.map(l =>
      `${l.tipo === "entrada" ? "Entrada" : "Saída"},"${l.descricao}","${l.categoria}",${l.data},${l.valor.toFixed(2)},"${l.formaPagamentoNome || ""}"`
    ).join("\n");
    const summary = `\n\nResumo\nEntradas,${entradas.toFixed(2)}\nSaídas,${saidas.toFixed(2)}\nSaldo,${(entradas - saidas).toFixed(2)}\nTicket Médio,${ticketMedio.toFixed(2)}`;
    const blob = new Blob(["\uFEFF" + header + rows + summary], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financeiro_${periodo}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso");
  };

  // PDF export
  const exportPDF = () => {
    if (filtered.length === 0) { toast.error("Nenhum dado para exportar"); return; }
    const periodoLabel = { hoje: "Hoje", "7dias": "Últimos 7 dias", "30dias": "Últimos 30 dias", mes: "Mês atual", ano: "Ano atual", custom: "Personalizado" }[periodo];
    
    const html = `
      <html><head><meta charset="utf-8"><title>Relatório Financeiro</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#222;font-size:12px}
        h1{font-size:20px;margin-bottom:4px}
        .subtitle{color:#666;margin-bottom:24px}
        .cards{display:flex;gap:16px;margin-bottom:24px}
        .card{border:1px solid #ddd;border-radius:8px;padding:12px 16px;flex:1}
        .card-label{color:#666;font-size:11px}
        .card-value{font-size:18px;font-weight:600;margin-top:4px}
        .green{color:#2d8a56}
        .red{color:#c0392b}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #eee;font-size:11px}
        th{background:#f5f5f5;font-weight:600}
        .right{text-align:right}
        @media print{body{padding:20px}}
      </style></head><body>
      <h1>Relatório Financeiro</h1>
      <p class="subtitle">Período: ${periodoLabel} — Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
      <div class="cards">
        <div class="card"><div class="card-label">Entradas</div><div class="card-value green">${fmt(entradas)}</div></div>
        <div class="card"><div class="card-label">Saídas</div><div class="card-value red">${fmt(saidas)}</div></div>
        <div class="card"><div class="card-label">Saldo</div><div class="card-value ${entradas - saidas >= 0 ? 'green' : 'red'}">${fmt(entradas - saidas)}</div></div>
        <div class="card"><div class="card-label">Ticket Médio</div><div class="card-value">${fmt(ticketMedio)}</div></div>
      </div>
      <table><thead><tr><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Data</th><th>Pagamento</th><th class="right">Valor</th></tr></thead><tbody>
      ${filtered.map(l => `<tr>
        <td>${l.tipo === "entrada" ? "Entrada" : "Saída"}</td>
        <td>${l.descricao}</td><td>${l.categoria}</td><td>${l.data}</td>
        <td>${l.formaPagamentoNome || "—"}</td>
        <td class="right ${l.tipo === "entrada" ? "green" : "red"}">${l.tipo === "entrada" ? "+" : "-"}${fmt(l.valor)}</td>
      </tr>`).join("")}
      </tbody></table>
      </body></html>`;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => { printWindow.print(); };
    }
    toast.success("Relatório PDF aberto para impressão");
  };

  const periodos: { key: Periodo; label: string }[] = [
    { key: "hoje", label: "Hoje" }, { key: "7dias", label: "7 dias" },
    { key: "30dias", label: "30 dias" }, { key: "mes", label: "Mês" },
    { key: "ano", label: "Ano" }, { key: "custom", label: "Personalizado" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Financeiro</h2>
          <p className="text-sm text-muted-foreground mt-1">Entradas, saídas e análise por pagamento</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Exportar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportCSV}>
                <FileText className="h-4 w-4 mr-2" /> Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF}>
                <FileText className="h-4 w-4 mr-2" /> Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Lançamento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v: "entrada" | "saida") => setForm(f => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
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
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {periodos.map(p => (
          <Button key={p.key} variant={periodo === p.key ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setPeriodo(p.key)}>{p.label}</Button>
        ))}
        {periodo === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", !customFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5" />{customFrom ? format(customFrom, "dd/MM/yyyy") : "De"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} locale={ptBR} className="p-3 pointer-events-auto" /></PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", !customTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5" />{customTo ? format(customTo, "dd/MM/yyyy") : "Até"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={customTo} onSelect={setCustomTo} locale={ptBR} className="p-3 pointer-events-auto" /></PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card animate-fade-in-up">
          <p className="text-sm text-muted-foreground">Entradas</p>
          <p className="text-2xl font-semibold text-success mt-1">{fmt(entradas)}</p>
        </div>
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <p className="text-sm text-muted-foreground">Saídas</p>
          <p className="text-2xl font-semibold text-destructive mt-1">{fmt(saidas)}</p>
        </div>
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <p className="text-sm text-muted-foreground">Saldo</p>
          <p className={`text-2xl font-semibold mt-1 ${entradas - saidas >= 0 ? "text-success" : "text-destructive"}`}>{fmt(entradas - saidas)}</p>
        </div>
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <p className="text-sm text-muted-foreground">Ticket Médio</p>
          <p className="text-2xl font-semibold mt-1">{fmt(ticketMedio)}</p>
        </div>
      </div>

      {/* Charts */}
      {pagamentoMap.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="stat-card animate-fade-in-up">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" />Vendas por Forma de Pagamento</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pagamentoMap}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,13%,91%)", fontSize: 13 }} formatter={(v: number, name: string) => name === "count" ? [v, "Vendas"] : [fmt(v), "Valor"]} />
                <Legend />
                <Bar dataKey="count" fill="hsl(220, 14%, 50%)" radius={[4, 4, 0, 0]} name="Qtd Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="stat-card animate-fade-in-up">
            <h3 className="text-sm font-medium mb-4">Distribuição por Valor</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pagamentoMap} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="total" nameKey="nome">
                  {pagamentoMap.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Payment indicators */}
      {pagamentoMap.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pagamentoMap.map(p => (
            <div key={p.nome} className="stat-card">
              <p className="text-xs text-muted-foreground">{p.nome}</p>
              <p className="text-lg font-semibold mt-1">{fmt(p.total)}</p>
              <p className="text-xs text-muted-foreground">{p.count} venda(s)</p>
            </div>
          ))}
        </div>
      )}

      {/* Transactions */}
      <div className="stat-card p-0 overflow-hidden animate-fade-in-up">
        <div className="divide-y divide-border/60">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum lançamento no período.</p>}
          {filtered.map(l => (
            <div key={l.id} className="group">
              <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setExpandedId(prev => prev === l.id ? null : l.id)}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${l.tipo === "entrada" ? "bg-success/10" : "bg-destructive/10"}`}>
                    {l.tipo === "entrada" ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedId === l.id ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <div>
                      <p className="text-sm font-medium">{l.descricao}</p>
                      <p className="text-xs text-muted-foreground">{l.data} · {l.categoria}{l.formaPagamentoNome ? ` · ${l.formaPagamentoNome}` : ""}</p>
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
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                    <div><p className="text-muted-foreground mb-0.5">Tipo</p><p className="font-medium capitalize">{l.tipo}</p></div>
                    <div><p className="text-muted-foreground mb-0.5">Categoria</p><p className="font-medium">{l.categoria || "—"}</p></div>
                    <div><p className="text-muted-foreground mb-0.5">Data</p><p className="font-medium">{l.data}</p></div>
                    <div><p className="text-muted-foreground mb-0.5">Pagamento</p><p className="font-medium">{l.formaPagamentoNome || "—"}</p></div>
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
