import { createContext, useContext, useState, type ReactNode } from "react";
import { type Produto, initialProdutos } from "@/pages/Produtos";

export interface Lancamento {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
}

export interface VendaRegistro {
  id: string;
  data: string;
  total: number;
  itens: number;
}

const initialLancamentos: Lancamento[] = [
  { id: "1", tipo: "entrada", descricao: "Venda PDV #1042", valor: 547.8, categoria: "Vendas", data: "2024-03-20" },
  { id: "2", tipo: "entrada", descricao: "Venda PDV #1043", valor: 329.7, categoria: "Vendas", data: "2024-03-20" },
  { id: "3", tipo: "saida", descricao: "Aluguel", valor: 2800, categoria: "Fixas", data: "2024-03-15" },
  { id: "4", tipo: "saida", descricao: "Fornecedor tecidos", valor: 1450, categoria: "Fornecedores", data: "2024-03-18" },
  { id: "5", tipo: "entrada", descricao: "Receita manual - consultoria", valor: 1200, categoria: "Serviços", data: "2024-03-19" },
];

interface StoreContextType {
  produtos: Produto[];
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
  lancamentos: Lancamento[];
  setLancamentos: React.Dispatch<React.SetStateAction<Lancamento[]>>;
  vendasDoDia: VendaRegistro[];
  registrarVenda: (total: number, itens: number, produtosVendidos: { id: string; quantidade: number }[]) => void;
  fecharCaixa: () => { total: number; vendas: number } | null;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>(initialProdutos);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(initialLancamentos);
  const [vendasDoDia, setVendasDoDia] = useState<VendaRegistro[]>([]);

  const registrarVenda = (total: number, itens: number, produtosVendidos: { id: string; quantidade: number }[]) => {
    // Descontar estoque
    setProdutos(prev =>
      prev.map(p => {
        const vendido = produtosVendidos.find(v => v.id === p.id);
        if (!vendido) return p;
        return { ...p, estoque: Math.max(0, p.estoque - vendido.quantidade) };
      })
    );

    const hoje = new Date().toISOString().split("T")[0];
    const vendaId = Date.now().toString();

    // Registrar no financeiro
    setLancamentos(prev => [
      ...prev,
      {
        id: vendaId,
        tipo: "entrada",
        descricao: `Venda PDV #${vendaId.slice(-4)}`,
        valor: total,
        categoria: "Vendas",
        data: hoje,
      },
    ]);

    // Registrar venda do dia
    setVendasDoDia(prev => [...prev, { id: vendaId, data: hoje, total, itens }]);
  };

  const fecharCaixa = () => {
    if (vendasDoDia.length === 0) return null;
    const total = vendasDoDia.reduce((s, v) => s + v.total, 0);
    const vendas = vendasDoDia.length;
    setVendasDoDia([]);
    return { total, vendas };
  };

  return (
    <StoreContext.Provider value={{ produtos, setProdutos, lancamentos, setLancamentos, vendasDoDia, registrarVenda, fecharCaixa }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
