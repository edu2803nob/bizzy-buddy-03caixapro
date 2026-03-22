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

export interface ProdutoVendido {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorTotal: number;
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
  historicoProdutosVendidos: ProdutoVendido[];
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>(initialProdutos);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(initialLancamentos);
  const [vendasDoDia, setVendasDoDia] = useState<VendaRegistro[]>([]);
  const [historicoProdutosVendidos, setHistoricoProdutosVendidos] = useState<ProdutoVendido[]>([]);

  const registrarVenda = (total: number, itens: number, produtosVendidos: { id: string; quantidade: number }[]) => {
    // Descontar estoque e rastrear vendas por produto
    setProdutos(prev => {
      const updated = prev.map(p => {
        const vendido = produtosVendidos.find(v => v.id === p.id);
        if (!vendido) return p;
        return { ...p, estoque: Math.max(0, p.estoque - vendido.quantidade) };
      });
      return updated;
    });

    // Registrar histórico de produtos vendidos
    setHistoricoProdutosVendidos(prev => {
      const next = [...prev];
      produtosVendidos.forEach(v => {
        const produto = produtos.find(p => p.id === v.id);
        if (!produto) return;
        const existing = next.find(h => h.produtoId === v.id);
        if (existing) {
          existing.quantidade += v.quantidade;
          existing.valorTotal += produto.preco * v.quantidade;
        } else {
          next.push({
            produtoId: v.id,
            nome: produto.nome,
            quantidade: v.quantidade,
            valorTotal: produto.preco * v.quantidade,
          });
        }
      });
      return next;
    });

    const hoje = new Date().toISOString().split("T")[0];
    const vendaId = Date.now().toString();

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
    <StoreContext.Provider value={{ produtos, setProdutos, lancamentos, setLancamentos, vendasDoDia, registrarVenda, fecharCaixa, historicoProdutosVendidos }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
