import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Trophy, Package, CalendarDays, AlertTriangle, PackageX, Clock } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

type DashTab = "receitas" | "despesas" | "comparativo" | "produtos";
type Periodo = "dia" | "semana" | "mes" | "ano" | "todos";

function getDateRange(periodo: Periodo): string {
  const now = new Date();
  switch (periodo) {
    case "dia": return now.toISOString().split("T")[0];
    case "semana": { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; }
    case "mes": { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0]; }
    case "ano": { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split("T")[0]; }
    case "todos": return "0000-00-00";
  }
}

export default function Dashboard() {
  const { lancamentos, historicoProdutosVendidos, produtos, contasPagarReceber } = useStore();
  const [tab, setTab] = useState<DashTab>("receitas");
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const navigate = useNavigate();

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const hoje = new Date().toISOString().split("T")[0];

  const filteredLancamentos = useMemo(() => {
    if (periodo === "todos") return lancamentos;
    if (periodo === "dia") return lancamentos.filter(l => l.data === hoje);
    const minDate = getDateRange(periodo);
    return lancamentos.filter(l => l.data >= minDate);
  }, [lancamentos, periodo, hoje]);

  const entradas = filteredLancamentos.filter(l => l.tipo === "entrada");
  const saidas = filteredLancamentos.filter(l => l.tipo === "saida");
  const receitaHoje = lancamentos.filter(l => l.tipo === "entrada" && l.data === hoje).reduce((s, l) => s + l.valor, 0);
  const receitaPeriodo = entradas.reduce((s, l) => s + l.valor, 0);
  const despesasPeriodo = saidas.reduce((s, l) => s + l.valor, 0);
  const lucroPeriodo = receitaPeriodo - despesasPeriodo;
  const periodoLabel = periodo === "dia" ? "Hoje" : periodo === "semana" ? "Semana" : periodo === "mes" ? "Mês" : periodo === "ano" ? "Ano" : "Total";

  // Alerts
  const semEstoque = produtos.filter(p => p.estoque === 0 && p.ativo).length;
  const estoqueBaixo = produtos.filter(p => p.estoque > 0 && p.estoque <= p.estoqueMinimo && p.ativo).length;
  const contasVencidas = contasPagarReceber.filter(c => (c.status === "aberto" || c.status === "vencido") && c.vencimento < hoje).length;
  const contasHojeAmanha = contasPagarReceber.filter(c => {
    if (c.status !== "aberto") return false;
    const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
    return c.vencimento === hoje || c.vencimento === amanha.toISOString().split("T")[0];
  }).length;
  const hasAlerts = semEstoque > 0 || estoqueBaixo > 0 || contasVencidas > 0 || contasHojeAmanha > 0;

  // Charts
  const monthMap = new Map<string, { receitas: number; despesas: number }>();
  filteredLancamentos.forEach(l => {
    const m = l.data.slice(0, 7);
    const entry = monthMap.get(m) || { receitas: 0, despesas: 0 };
    if (l.tipo === "entrada") entry.receitas += l.valor; else entry.despesas += l.valor;
    monthMap.set(m, entry);
  });
  const monthData = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([mes, vals]) => ({ mes: mes.slice(5) + "/" + mes.slice(2, 4), ...vals }));

  const catReceitas = new Map<string, number>();
  entradas.forEach(l => catReceitas.set(l.categoria, (catReceitas.get(l.categoria) || 0) + l.valor));
  const catReceitasData = Array.from(catReceitas.entries()).map(([name, value]) => ({ name, value }));

  const catDespesas = new Map<string, number>();
  saidas.forEach(l => catDespesas.set(l.categoria, (catDespesas.get(l.categoria) || 0) + l.valor));
  const catDespesasData = Array.from(catDespesas.entries()).map(([name, value]) => ({ name, value }));

  const ranking = [...historicoProdutosVendidos].sort((a, b) => b.quantidade - a.quantidade);

  const COLORS = ["hsl(152,56%,38%)", "hsl(220,14%,50%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(262,52%,47%)", "hsl(200,60%,45%)"];

  const dashTabs: { key: DashTab; label: string; icon: React.ReactNode }[] = [
    { key: "receitas", label: "Receitas", icon: <TrendingUp className="h-4 w-4" /> },
    { key: "despesas", label: "Despesas", icon: <TrendingDown className="h-4 w-4" /> },
    { key: "comparativo", label: "Receitas × Despesas", icon: <Wallet className="h-4 w-4" /> },
    { key: "produtos", label: "Produtos", icon: <Package className="h-4 w-4" /> },
  ];

  const periodos: { key: Periodo; label: string }[] = [
    { key: "dia", label: "Hoje" }, { key: "semana", label: "7 dias" }, { key: "mes", label: "30 dias" },
    { key: "ano", label: "1 ano" }, { key: "todos", label: "Todos" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Visão geral financeira</p>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1">
          <CalendarDays className="h-4 w-4 text-muted-foreground ml-2" />
          {periodos.map(p => (
            <Button key={p.key} variant={periodo === p.key ? "default" : "ghost"} size="sm" onClick={() => setPeriodo(p.key)} className="h-7 px-3 text-xs">{p.label}</Button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up">
          {semEstoque > 0 && (
            <button onClick={() => navigate("/produtos?estoque=sem")} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors text-left">
              <PackageX className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium">{semEstoque} produto(s) sem estoque</p>
                <p className="text-xs text-muted-foreground">Clique para ver</p>
              </div>
            </button>
          )}
          {estoqueBaixo > 0 && (
            <button onClick={() => navigate("/produtos?estoque=baixo")} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-warning/30 bg-warning/5 hover:bg-warning/10 transition-colors text-left">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="text-sm font-medium">{estoqueBaixo} com estoque baixo</p>
                <p className="text-xs text-muted-foreground">Clique para ver</p>
              </div>
            </button>
          )}
          {contasVencidas > 0 && (
            <button onClick={() => navigate("/financeiro/contas")} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors text-left">
              <Clock className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium">{contasVencidas} conta(s) vencida(s)</p>
                <p className="text-xs text-muted-foreground">Clique para ver</p>
              </div>
            </button>
          )}
          {contasHojeAmanha > 0 && (
            <button onClick={() => navigate("/financeiro/contas")} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-warning/30 bg-warning/5 hover:bg-warning/10 transition-colors text-left">
              <Clock className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="text-sm font-medium">{contasHojeAmanha} vence(m) hoje/amanhã</p>
                <p className="text-xs text-muted-foreground">Clique para ver</p>
              </div>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Receita Hoje" value={fmt(receitaHoje)} icon={DollarSign} delay={0} />
        <StatCard title={`Receita ${periodoLabel}`} value={fmt(receitaPeriodo)} icon={TrendingUp} delay={80} />
        <StatCard title={`Despesas ${periodoLabel}`} value={fmt(despesasPeriodo)} icon={TrendingDown} delay={160} />
        <StatCard title={`Lucro ${periodoLabel}`} value={fmt(lucroPeriodo)} icon={Wallet} delay={240} />
      </div>

      <div className="flex flex-wrap gap-2">
        {dashTabs.map(t => (
          <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)} className="gap-1.5">{t.icon} {t.label}</Button>
        ))}
      </div>

      {tab === "receitas" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up">
          <div className="stat-card"><h3 className="text-sm font-medium mb-4">Receita ao Longo do Tempo</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" /><XAxis dataKey="mes" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => [fmt(v), "Receita"]} /><Line type="monotone" dataKey="receitas" stroke="hsl(152,56%,38%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(152,56%,38%)" }} /></LineChart>
            </ResponsiveContainer>
          </div>
          <div className="stat-card"><h3 className="text-sm font-medium mb-4">Receita por Categoria</h3>
            {catReceitasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={catReceitasData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">{catReceitasData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => fmt(v)} /><Legend /></PieChart></ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-16">Sem dados de receita</p>}
          </div>
        </div>
      )}

      {tab === "despesas" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up">
          <div className="stat-card"><h3 className="text-sm font-medium mb-4">Despesas ao Longo do Tempo</h3>
            <ResponsiveContainer width="100%" height={260}><LineChart data={monthData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" /><XAxis dataKey="mes" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => [fmt(v), "Despesa"]} /><Line type="monotone" dataKey="despesas" stroke="hsl(0,72%,51%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(0,72%,51%)" }} /></LineChart></ResponsiveContainer>
          </div>
          <div className="stat-card"><h3 className="text-sm font-medium mb-4">Despesas por Categoria</h3>
            {catDespesasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={catDespesasData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">{catDespesasData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => fmt(v)} /><Legend /></PieChart></ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-16">Sem dados de despesas</p>}
          </div>
        </div>
      )}

      {tab === "comparativo" && (
        <div className="stat-card animate-fade-in-up"><h3 className="text-sm font-medium mb-4">Receitas × Despesas por Mês</h3>
          <ResponsiveContainer width="100%" height={300}><BarChart data={monthData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" /><XAxis dataKey="mes" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => fmt(v)} /><Legend /><Bar dataKey="receitas" fill="hsl(152,56%,38%)" radius={[4, 4, 0, 0]} name="Receitas" /><Bar dataKey="despesas" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} name="Despesas" /></BarChart></ResponsiveContainer>
        </div>
      )}

      {tab === "produtos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up">
          <div className="stat-card"><h3 className="text-sm font-medium mb-4 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Ranking de Produtos Mais Vendidos</h3>
            {ranking.length > 0 ? (
              <div className="space-y-3">{ranking.slice(0, 10).map((p, i) => (
                <div key={p.produtoId} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.nome}</p><p className="text-xs text-muted-foreground">{p.quantidade} vendido(s)</p></div>
                  <p className="text-sm font-semibold tabular-nums text-success">{fmt(p.valorTotal)}</p>
                </div>
              ))}</div>
            ) : <p className="text-sm text-muted-foreground text-center py-16">Nenhuma venda registrada ainda.</p>}
          </div>
          <div className="stat-card"><h3 className="text-sm font-medium mb-4">Vendas por Produto</h3>
            {ranking.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}><BarChart data={ranking.slice(0, 8)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" /><XAxis type="number" tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={100} /><Tooltip formatter={(v: number, name: string) => name === "quantidade" ? [v, "Qtd"] : [fmt(v), "Valor"]} /><Bar dataKey="quantidade" fill="hsl(220,14%,50%)" radius={[0, 4, 4, 0]} name="quantidade" /></BarChart></ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-16">Sem dados de vendas</p>}
          </div>
        </div>
      )}
    </div>
  );
}
