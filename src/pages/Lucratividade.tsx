import { useState, useMemo } from "react";
import { Download, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";

type Periodo = "dia" | "semana" | "mes" | "ano" | "todos";
type SortKey = "nome" | "qtd" | "receita" | "custo" | "lucro" | "margem";

const COLORS = ["hsl(152,56%,38%)", "hsl(220,14%,50%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(262,52%,47%)", "hsl(200,60%,45%)", "hsl(330,60%,50%)", "hsl(180,50%,40%)"];

export default function Lucratividade() {
  const { allVendas, produtos } = useStore();
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const [sortKey, setSortKey] = useState<SortKey>("lucro");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const hoje = new Date().toISOString().split("T")[0];
  const getMin = (p: Periodo) => {
    const d = new Date();
    if (p === "dia") return hoje;
    if (p === "semana") { d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; }
    if (p === "mes") { d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0]; }
    if (p === "ano") { d.setFullYear(d.getFullYear() - 1); return d.toISOString().split("T")[0]; }
    return "0000-00-00";
  };

  const filteredVendas = useMemo(() => {
    const min = getMin(periodo);
    return periodo === "dia"
      ? allVendas.filter(v => v.data === hoje)
      : allVendas.filter(v => v.data >= min);
  }, [allVendas, periodo, hoje]);

  const produtosData = useMemo(() => {
    const map = new Map<string, { nome: string; categoria: string; qtd: number; receita: number; custo: number }>();
    filteredVendas.forEach(v => {
      v.produtos.forEach(p => {
        const prod = produtos.find(pr => pr.id === p.produtoId);
        const custo = prod?.custo || 0;
        const entry = map.get(p.produtoId) || { nome: p.nome, categoria: prod?.categoria || "", qtd: 0, receita: 0, custo: 0 };
        entry.qtd += p.quantidade;
        entry.receita += (p.precoUnitario - p.desconto) * p.quantidade;
        entry.custo += custo * p.quantidade;
        map.set(p.produtoId, entry);
      });
    });
    return Array.from(map.values()).map(e => ({
      ...e, lucro: e.receita - e.custo,
      margem: e.receita > 0 ? ((e.receita - e.custo) / e.receita) * 100 : 0,
    }));
  }, [filteredVendas, produtos]);

  const sorted = useMemo(() => {
    return [...produtosData].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "nome") return mul * a.nome.localeCompare(b.nome);
      return mul * ((a[sortKey] as number) - (b[sortKey] as number));
    });
  }, [produtosData, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const totals = produtosData.reduce((acc, p) => ({
    qtd: acc.qtd + p.qtd, receita: acc.receita + p.receita, custo: acc.custo + p.custo, lucro: acc.lucro + p.lucro,
  }), { qtd: 0, receita: 0, custo: 0, lucro: 0 });

  const top10 = [...produtosData].sort((a, b) => b.lucro - a.lucro).slice(0, 10);

  // Category breakdown
  const catMap = new Map<string, number>();
  produtosData.forEach(p => catMap.set(p.categoria, (catMap.get(p.categoria) || 0) + p.receita));
  const catData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

  const exportCSV = () => {
    if (sorted.length === 0) { toast.error("Sem dados para exportar"); return; }
    const header = "Produto,Categoria,Qtd Vendida,Receita,Custo Total,Lucro,Margem %\n";
    const rows = sorted.map(p => `"${p.nome}","${p.categoria}",${p.qtd},${p.receita.toFixed(2)},${p.custo.toFixed(2)},${p.lucro.toFixed(2)},${p.margem.toFixed(1)}%`).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `lucratividade_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    toast.success("CSV exportado");
  };

  const periodos: { key: Periodo; label: string }[] = [
    { key: "dia", label: "Hoje" }, { key: "semana", label: "7 dias" },
    { key: "mes", label: "30 dias" }, { key: "ano", label: "1 ano" }, { key: "todos", label: "Todos" },
  ];

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(k)}>
      <div className="flex items-center gap-1">
        {label} <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
        {sortKey === k && <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Relatório de Lucratividade</h2>
          <p className="text-sm text-muted-foreground mt-1">Análise de lucro por produto</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {periodos.map(p => (
          <Button key={p.key} variant={periodo === p.key ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setPeriodo(p.key)}>{p.label}</Button>
        ))}
      </div>

      {/* Charts */}
      {produtosData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="stat-card animate-fade-in-up">
            <h3 className="text-sm font-medium mb-4">Top 10 Produtos por Lucro</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top10} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={100} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="lucro" fill="hsl(152,56%,38%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="stat-card animate-fade-in-up">
            <h3 className="text-sm font-medium mb-4">Receita por Categoria</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="stat-card p-0 overflow-hidden animate-fade-in-up">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Produto" k="nome" />
              <TableHead>Categoria</TableHead>
              <SortHeader label="Qtd Vendida" k="qtd" />
              <SortHeader label="Receita" k="receita" />
              <SortHeader label="Custo Total" k="custo" />
              <SortHeader label="Lucro" k="lucro" />
              <SortHeader label="Margem %" k="margem" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma venda no período. Realize vendas no PDV para gerar dados.</TableCell></TableRow>
            )}
            {sorted.map(p => (
              <TableRow key={p.nome}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell className="text-muted-foreground">{p.categoria}</TableCell>
                <TableCell className="tabular-nums">{p.qtd}</TableCell>
                <TableCell className="tabular-nums">{fmt(p.receita)}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{fmt(p.custo)}</TableCell>
                <TableCell className={`tabular-nums font-semibold ${p.lucro >= 0 ? "text-success" : "text-destructive"}`}>{fmt(p.lucro)}</TableCell>
                <TableCell className={`tabular-nums ${p.margem >= 30 ? "text-success" : p.margem >= 15 ? "text-warning" : "text-destructive"}`}>{p.margem.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {sorted.length > 0 && (
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell>Total</TableCell>
                <TableCell />
                <TableCell className="tabular-nums">{totals.qtd}</TableCell>
                <TableCell className="tabular-nums">{fmt(totals.receita)}</TableCell>
                <TableCell className="tabular-nums">{fmt(totals.custo)}</TableCell>
                <TableCell className={`tabular-nums ${totals.lucro >= 0 ? "text-success" : "text-destructive"}`}>{fmt(totals.lucro)}</TableCell>
                <TableCell className="tabular-nums">{totals.receita > 0 ? ((totals.lucro / totals.receita) * 100).toFixed(1) : "0.0"}%</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
