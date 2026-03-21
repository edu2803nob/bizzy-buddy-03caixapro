import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useStore } from "@/contexts/StoreContext";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function Dashboard() {
  const { lancamentos } = useStore();

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const hoje = new Date().toISOString().split("T")[0];
  const mesAtual = hoje.slice(0, 7);

  const entradas = lancamentos.filter(l => l.tipo === "entrada");
  const saidas = lancamentos.filter(l => l.tipo === "saida");

  const receitaHoje = entradas.filter(l => l.data === hoje).reduce((s, l) => s + l.valor, 0);
  const receitaMes = entradas.filter(l => l.data.startsWith(mesAtual)).reduce((s, l) => s + l.valor, 0);
  const despesasMes = saidas.filter(l => l.data.startsWith(mesAtual)).reduce((s, l) => s + l.valor, 0);
  const lucroMes = receitaMes - despesasMes;

  const totalEntradas = entradas.reduce((s, l) => s + l.valor, 0);
  const totalSaidas = saidas.reduce((s, l) => s + l.valor, 0);

  // Group by month for charts
  const monthMap = new Map<string, { receitas: number; despesas: number }>();
  lancamentos.forEach(l => {
    const m = l.data.slice(0, 7);
    const entry = monthMap.get(m) || { receitas: 0, despesas: 0 };
    if (l.tipo === "entrada") entry.receitas += l.valor;
    else entry.despesas += l.valor;
    monthMap.set(m, entry);
  });
  const monthData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, vals]) => ({ mes: mes.slice(5) + "/" + mes.slice(2, 4), ...vals }));

  // Group by category for pie
  const catMap = new Map<string, number>();
  entradas.forEach(l => {
    catMap.set(l.categoria, (catMap.get(l.categoria) || 0) + l.valor);
  });
  const categoryData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

  const PIE_COLORS = [
    "hsl(152, 56%, 38%)",
    "hsl(220, 14%, 50%)",
    "hsl(38, 92%, 50%)",
    "hsl(0, 72%, 51%)",
    "hsl(262, 52%, 47%)",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Visão geral financeira</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Receita Hoje" value={fmt(receitaHoje)} icon={DollarSign} delay={0} />
        <StatCard title="Receita Mensal" value={fmt(receitaMes)} icon={TrendingUp} delay={80} />
        <StatCard title="Despesas Mês" value={fmt(despesasMes)} icon={TrendingDown} delay={160} />
        <StatCard title="Lucro Mês" value={fmt(lucroMes)} icon={Wallet} delay={240} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <h3 className="text-sm font-medium mb-4">Receita ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,13%,91%)", fontSize: 13 }}
                formatter={(v: number) => [fmt(v), "Receita"]}
              />
              <Line type="monotone" dataKey="receitas" stroke="hsl(152,56%,38%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(152,56%,38%)" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "380ms" }}>
          <h3 className="text-sm font-medium mb-4">Receitas × Despesas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,13%,91%)", fontSize: 13 }}
                formatter={(v: number) => fmt(v)}
              />
              <Legend />
              <Bar dataKey="receitas" fill="hsl(152,56%,38%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: "460ms" }}>
            <h3 className="text-sm font-medium mb-4">Receita por Categoria</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
