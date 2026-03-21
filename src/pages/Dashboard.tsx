import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const revenueData = [
  { mes: "Jan", receita: 12400 },
  { mes: "Fev", receita: 15800 },
  { mes: "Mar", receita: 14200 },
  { mes: "Abr", receita: 18600 },
  { mes: "Mai", receita: 21300 },
  { mes: "Jun", receita: 19700 },
];

const comparisonData = [
  { mes: "Jan", receitas: 12400, despesas: 8200 },
  { mes: "Fev", receitas: 15800, despesas: 9100 },
  { mes: "Mar", receitas: 14200, despesas: 10300 },
  { mes: "Abr", receitas: 18600, despesas: 11400 },
  { mes: "Mai", receitas: 21300, despesas: 12800 },
  { mes: "Jun", receitas: 19700, despesas: 11200 },
];

const categoryData = [
  { name: "Produtos", value: 45 },
  { name: "Serviços", value: 30 },
  { name: "Assinaturas", value: 15 },
  { name: "Outros", value: 10 },
];

const PIE_COLORS = [
  "hsl(152, 56%, 38%)",
  "hsl(220, 14%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Visão geral financeira</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Hoje"
          value="R$ 3.847,00"
          icon={DollarSign}
          trend="+12% vs ontem"
          trendUp
          delay={0}
        />
        <StatCard
          title="Receita Mensal"
          value="R$ 19.700,00"
          icon={TrendingUp}
          trend="+8% vs mês anterior"
          trendUp
          delay={80}
        />
        <StatCard
          title="Despesas Mês"
          value="R$ 11.200,00"
          icon={TrendingDown}
          trend="-3% vs mês anterior"
          trendUp
          delay={160}
        />
        <StatCard
          title="Lucro Mês"
          value="R$ 8.500,00"
          icon={Wallet}
          trend="+22% vs mês anterior"
          trendUp
          delay={240}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <h3 className="text-sm font-medium mb-4">Receita ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,13%,91%)", fontSize: 13 }}
                formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]}
              />
              <Line
                type="monotone"
                dataKey="receita"
                stroke="hsl(152,56%,38%)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(152,56%,38%)" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "380ms" }}>
          <h3 className="text-sm font-medium mb-4">Receitas × Despesas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,13%,91%)", fontSize: 13 }}
                formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
              />
              <Legend />
              <Bar dataKey="receitas" fill="hsl(152,56%,38%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "460ms" }}>
          <h3 className="text-sm font-medium mb-4">Receita por Categoria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
