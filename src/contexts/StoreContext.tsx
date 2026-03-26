import { createContext, useContext, useState, type ReactNode } from "react";
import { type Produto, initialProdutos } from "@/pages/Produtos";
import { type FormaPagamento, initialFormasPagamento } from "@/pages/FormasPagamento";

export interface Lancamento {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  formaPagamentoId?: string;
  formaPagamentoNome?: string;
}

export interface VendaRegistro {
  id: string;
  data: string;
  total: number;
  itens: number;
  formaPagamentoId?: string;
  formaPagamentoNome?: string;
}

export interface ProdutoVendido {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorTotal: number;
}

export type UserRole = "admin" | "operador" | "financeiro";

export interface UserPermissions {
  pdv: boolean;
  financeiro: boolean;
  admin: boolean;
}

export interface AppUser {
  id: string;
  nome: string;
  email: string;
  tipo: UserRole;
  status: "ativo" | "inativo";
  permissoes: UserPermissions;
}

const defaultPermissions: Record<UserRole, UserPermissions> = {
  admin: { pdv: true, financeiro: true, admin: true },
  operador: { pdv: true, financeiro: false, admin: false },
  financeiro: { pdv: false, financeiro: true, admin: false },
};

const initialUsers: AppUser[] = [
  { id: "1", nome: "Rafael Costa", email: "rafael@loja.com", tipo: "admin", status: "ativo", permissoes: defaultPermissions.admin },
  { id: "2", nome: "Juliana Mendes", email: "juliana@loja.com", tipo: "operador", status: "ativo", permissoes: defaultPermissions.operador },
  { id: "3", nome: "Pedro Lima", email: "pedro@loja.com", tipo: "operador", status: "ativo", permissoes: defaultPermissions.operador },
  { id: "4", nome: "Ana Souza", email: "ana@loja.com", tipo: "financeiro", status: "inativo", permissoes: defaultPermissions.financeiro },
];

const initialLancamentos: Lancamento[] = [
  { id: "1", tipo: "entrada", descricao: "Venda PDV #1042", valor: 547.8, categoria: "Vendas", data: "2024-03-20", formaPagamentoId: "fp1", formaPagamentoNome: "Dinheiro" },
  { id: "2", tipo: "entrada", descricao: "Venda PDV #1043", valor: 329.7, categoria: "Vendas", data: "2024-03-20", formaPagamentoId: "fp2", formaPagamentoNome: "Pix" },
  { id: "3", tipo: "saida", descricao: "Aluguel", valor: 2800, categoria: "Fixas", data: "2024-03-15" },
  { id: "4", tipo: "saida", descricao: "Fornecedor tecidos", valor: 1450, categoria: "Fornecedores", data: "2024-03-18" },
  { id: "5", tipo: "entrada", descricao: "Receita manual - consultoria", valor: 1200, categoria: "Serviços", data: "2024-03-19", formaPagamentoId: "fp3", formaPagamentoNome: "Cartão de Crédito" },
];

interface StoreContextType {
  produtos: Produto[];
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
  lancamentos: Lancamento[];
  setLancamentos: React.Dispatch<React.SetStateAction<Lancamento[]>>;
  vendasDoDia: VendaRegistro[];
  registrarVenda: (total: number, itens: number, produtosVendidos: { id: string; quantidade: number }[], formaPagamentoId: string, formaPagamentoNome: string) => void;
  fecharCaixa: () => { total: number; vendas: number } | null;
  historicoProdutosVendidos: ProdutoVendido[];
  formasPagamento: FormaPagamento[];
  setFormasPagamento: React.Dispatch<React.SetStateAction<FormaPagamento[]>>;
  usuarios: AppUser[];
  setUsuarios: React.Dispatch<React.SetStateAction<AppUser[]>>;
  currentUser: AppUser;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser>>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export { defaultPermissions };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>(initialProdutos);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(initialLancamentos);
  const [vendasDoDia, setVendasDoDia] = useState<VendaRegistro[]>([]);
  const [historicoProdutosVendidos, setHistoricoProdutosVendidos] = useState<ProdutoVendido[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>(initialFormasPagamento);
  const [usuarios, setUsuarios] = useState<AppUser[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<AppUser>(initialUsers[0]); // Admin by default

  const registrarVenda = (total: number, itens: number, produtosVendidos: { id: string; quantidade: number }[], formaPagamentoId: string, formaPagamentoNome: string) => {
    setProdutos(prev => prev.map(p => {
      const vendido = produtosVendidos.find(v => v.id === p.id);
      if (!vendido) return p;
      return { ...p, estoque: Math.max(0, p.estoque - vendido.quantidade) };
    }));

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
          next.push({ produtoId: v.id, nome: produto.nome, quantidade: v.quantidade, valorTotal: produto.preco * v.quantidade });
        }
      });
      return next;
    });

    const hoje = new Date().toISOString().split("T")[0];
    const vendaId = Date.now().toString();

    setLancamentos(prev => [...prev, {
      id: vendaId,
      tipo: "entrada",
      descricao: `Venda PDV #${vendaId.slice(-4)}`,
      valor: total,
      categoria: "Vendas",
      data: hoje,
      formaPagamentoId,
      formaPagamentoNome,
    }]);

    setVendasDoDia(prev => [...prev, { id: vendaId, data: hoje, total, itens, formaPagamentoId, formaPagamentoNome }]);
  };

  const fecharCaixa = () => {
    if (vendasDoDia.length === 0) return null;
    const total = vendasDoDia.reduce((s, v) => s + v.total, 0);
    const vendas = vendasDoDia.length;
    setVendasDoDia([]);
    return { total, vendas };
  };

  return (
    <StoreContext.Provider value={{
      produtos, setProdutos, lancamentos, setLancamentos, vendasDoDia,
      registrarVenda, fecharCaixa, historicoProdutosVendidos,
      formasPagamento, setFormasPagamento,
      usuarios, setUsuarios, currentUser, setCurrentUser,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
