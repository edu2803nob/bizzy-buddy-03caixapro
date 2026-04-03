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
  contaBancariaId?: string;
  contaBancariaNome?: string;
}

export interface VendaRegistro {
  id: string;
  data: string;
  total: number;
  itens: number;
  formaPagamentoId?: string;
  formaPagamentoNome?: string;
  clienteId?: string;
  clienteNome?: string;
  desconto: number;
  observacao: string;
  produtos: { produtoId: string; nome: string; quantidade: number; precoUnitario: number; desconto: number }[];
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

export interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  tipo: "corrente" | "poupanca" | "pagamento" | "caixa_fisico" | "carteira";
  agencia: string;
  conta: string;
  chavePix: string;
  saldoInicial: number;
  saldoAtual: number;
  ativo: boolean;
  cor: string;
  createdAt: string;
}

export interface MovimentacaoBancaria {
  id: string;
  contaBancariaId: string;
  tipo: "entrada" | "saida" | "transferencia";
  valor: number;
  descricao: string;
  origem: "venda" | "lancamento_manual" | "conta_pagar" | "conta_receber" | "transferencia";
  origemId: string;
  data: string;
  saldoApos: number;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  origem: string;
  observacao: string;
}

export interface ContaPagarReceber {
  id: string;
  tipo: "pagar" | "receber";
  descricao: string;
  valor: number;
  vencimento: string;
  status: "aberto" | "pago" | "vencido" | "cancelado";
  categoria: string;
  formaPagamentoId?: string;
  contaBancariaId?: string;
  dataPagamento?: string;
  observacao: string;
}

export interface PriceHistory {
  id: string;
  produtoId: string;
  oldPrice: number;
  newPrice: number;
  oldCost: number;
  newCost: number;
  changedAt: string;
  changedByUserId: string;
  changedByUserName: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  observacao: string;
  ativo: boolean;
}

export interface OrdemCompra {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  status: "rascunho" | "enviada" | "recebida" | "cancelada";
  itens: { produtoId: string; produtoNome: string; quantidade: number; custoUnitario: number }[];
  total: number;
  data: string;
  observacao: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  timestamp: string;
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

const initialClientes: Cliente[] = [
  { id: "1", nome: "Maria Silva", telefone: "(11) 99876-5432", email: "maria@email.com", cpf: "123.456.789-00", origem: "Indicação", observacao: "" },
  { id: "2", nome: "Carlos Souza", telefone: "(21) 98765-4321", email: "carlos@email.com", cpf: "987.654.321-00", origem: "Instagram", observacao: "Cliente VIP" },
  { id: "3", nome: "Ana Oliveira", telefone: "(31) 97654-3210", email: "ana@email.com", cpf: "456.789.123-00", origem: "Google", observacao: "" },
];

const initialLancamentos: Lancamento[] = [
  { id: "1", tipo: "entrada", descricao: "Venda PDV #1042", valor: 547.8, categoria: "Vendas", data: "2024-03-20", formaPagamentoId: "fp1", formaPagamentoNome: "Dinheiro" },
  { id: "2", tipo: "entrada", descricao: "Venda PDV #1043", valor: 329.7, categoria: "Vendas", data: "2024-03-20", formaPagamentoId: "fp2", formaPagamentoNome: "Pix" },
  { id: "3", tipo: "saida", descricao: "Aluguel", valor: 2800, categoria: "Fixas", data: "2024-03-15" },
  { id: "4", tipo: "saida", descricao: "Fornecedor tecidos", valor: 1450, categoria: "Fornecedores", data: "2024-03-18" },
  { id: "5", tipo: "entrada", descricao: "Receita manual - consultoria", valor: 1200, categoria: "Serviços", data: "2024-03-19", formaPagamentoId: "fp3", formaPagamentoNome: "Cartão de Crédito" },
];

interface RegistrarVendaParams {
  total: number;
  itens: number;
  produtosVendidos: { id: string; quantidade: number; precoUnitario: number; desconto: number }[];
  formaPagamentoId: string;
  formaPagamentoNome: string;
  clienteId?: string;
  clienteNome?: string;
  desconto: number;
  observacao: string;
}

interface StoreContextType {
  produtos: Produto[];
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
  lancamentos: Lancamento[];
  setLancamentos: React.Dispatch<React.SetStateAction<Lancamento[]>>;
  vendasDoDia: VendaRegistro[];
  allVendas: VendaRegistro[];
  registrarVenda: (params: RegistrarVendaParams) => void;
  fecharCaixa: () => { total: number; vendas: number } | null;
  historicoProdutosVendidos: ProdutoVendido[];
  formasPagamento: FormaPagamento[];
  setFormasPagamento: React.Dispatch<React.SetStateAction<FormaPagamento[]>>;
  usuarios: AppUser[];
  setUsuarios: React.Dispatch<React.SetStateAction<AppUser[]>>;
  currentUser: AppUser;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser>>;
  contasBancarias: ContaBancaria[];
  setContasBancarias: React.Dispatch<React.SetStateAction<ContaBancaria[]>>;
  movimentacoes: MovimentacaoBancaria[];
  registrarMovimentacao: (contaId: string, tipo: "entrada" | "saida", valor: number, descricao: string, origem: MovimentacaoBancaria["origem"], origemId: string) => void;
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  contasPagarReceber: ContaPagarReceber[];
  setContasPagarReceber: React.Dispatch<React.SetStateAction<ContaPagarReceber[]>>;
  priceHistory: PriceHistory[];
  addPriceHistory: (entry: Omit<PriceHistory, "id">) => void;
  fornecedores: Fornecedor[];
  setFornecedores: React.Dispatch<React.SetStateAction<Fornecedor[]>>;
  ordensCompra: OrdemCompra[];
  setOrdensCompra: React.Dispatch<React.SetStateAction<OrdemCompra[]>>;
  receberOrdemCompra: (ordemId: string) => void;
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export { defaultPermissions };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>(initialProdutos);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(initialLancamentos);
  const [vendasDoDia, setVendasDoDia] = useState<VendaRegistro[]>([]);
  const [allVendas, setAllVendas] = useState<VendaRegistro[]>([]);
  const [historicoProdutosVendidos, setHistoricoProdutosVendidos] = useState<ProdutoVendido[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>(initialFormasPagamento);
  const [usuarios, setUsuarios] = useState<AppUser[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<AppUser>(initialUsers[0]);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoBancaria[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [contasPagarReceber, setContasPagarReceber] = useState<ContaPagarReceber[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [ordensCompra, setOrdensCompra] = useState<OrdemCompra[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const addAuditLog = (log: Omit<AuditLog, "id" | "timestamp">) => {
    setAuditLogs(prev => [{
      ...log,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
    }, ...prev]);
  };

  const addPriceHistory = (entry: Omit<PriceHistory, "id">) => {
    setPriceHistory(prev => [...prev, { ...entry, id: Date.now().toString() }]);
  };

  const registrarMovimentacao = (contaId: string, tipo: "entrada" | "saida", valor: number, descricao: string, origem: MovimentacaoBancaria["origem"], origemId: string) => {
    setContasBancarias(prev => {
      const conta = prev.find(c => c.id === contaId);
      if (!conta) return prev;
      const novoSaldo = tipo === "entrada" ? conta.saldoAtual + valor : conta.saldoAtual - valor;
      const mov: MovimentacaoBancaria = {
        id: Date.now().toString(),
        contaBancariaId: contaId,
        tipo, valor, descricao, origem, origemId,
        data: new Date().toISOString().split("T")[0],
        saldoApos: novoSaldo,
      };
      setMovimentacoes(p => [...p, mov]);
      return prev.map(c => c.id === contaId ? { ...c, saldoAtual: novoSaldo } : c);
    });
  };

  const registrarVenda = (params: RegistrarVendaParams) => {
    const { total, itens, produtosVendidos, formaPagamentoId, formaPagamentoNome, clienteId, clienteNome, desconto, observacao } = params;

    for (const item of produtosVendidos) {
      const produto = produtos.find(p => p.id === item.id);
      if (!produto || produto.estoque < item.quantidade) return;
    }

    setProdutos(prev => prev.map(p => {
      const vendido = produtosVendidos.find(v => v.id === p.id);
      if (!vendido) return p;
      return { ...p, estoque: p.estoque - vendido.quantidade };
    }));

    setHistoricoProdutosVendidos(prev => {
      const next = [...prev];
      produtosVendidos.forEach(v => {
        const produto = produtos.find(p => p.id === v.id);
        if (!produto) return;
        const existing = next.find(h => h.produtoId === v.id);
        if (existing) {
          existing.quantidade += v.quantidade;
          existing.valorTotal += v.precoUnitario * v.quantidade;
        } else {
          next.push({ produtoId: v.id, nome: produto.nome, quantidade: v.quantidade, valorTotal: v.precoUnitario * v.quantidade });
        }
      });
      return next;
    });

    const hoje = new Date().toISOString().split("T")[0];
    const vendaId = Date.now().toString();

    const forma = formasPagamento.find(f => f.id === formaPagamentoId);
    const contaBancariaId = forma?.contaBancariaId;
    const contaBancaria = contasBancarias.find(c => c.id === contaBancariaId);

    setLancamentos(prev => [...prev, {
      id: vendaId, tipo: "entrada",
      descricao: `Venda PDV #${vendaId.slice(-4)}${clienteNome ? ` — ${clienteNome}` : ""}`,
      valor: total, categoria: "Vendas", data: hoje,
      formaPagamentoId, formaPagamentoNome,
      contaBancariaId, contaBancariaNome: contaBancaria?.nome,
    }]);

    if (contaBancariaId) {
      registrarMovimentacao(contaBancariaId, "entrada", total, `Venda PDV #${vendaId.slice(-4)}`, "venda", vendaId);
    }

    const vendaRecord: VendaRegistro = {
      id: vendaId, data: hoje, total, itens,
      formaPagamentoId, formaPagamentoNome,
      clienteId, clienteNome, desconto, observacao,
      produtos: produtosVendidos.map(v => {
        const produto = produtos.find(p => p.id === v.id);
        return { produtoId: v.id, nome: produto?.nome || "", quantidade: v.quantidade, precoUnitario: v.precoUnitario, desconto: v.desconto };
      }),
    };

    setVendasDoDia(prev => [...prev, vendaRecord]);
    setAllVendas(prev => [...prev, vendaRecord]);

    addAuditLog({
      userId: currentUser.id, userName: currentUser.nome,
      action: "criar", entity: "venda", entityId: vendaId,
      oldValue: null,
      newValue: { total, itens, formaPagamentoNome, clienteNome },
    });
  };

  const receberOrdemCompra = (ordemId: string) => {
    const ordem = ordensCompra.find(o => o.id === ordemId);
    if (!ordem || ordem.status !== "enviada") return;

    setOrdensCompra(prev => prev.map(o => o.id === ordemId ? { ...o, status: "recebida" as const } : o));

    setProdutos(prev => prev.map(p => {
      const item = ordem.itens.find(i => i.produtoId === p.id);
      if (!item) return p;
      return { ...p, estoque: p.estoque + item.quantidade };
    }));

    const contaId = Date.now().toString();
    setContasPagarReceber(prev => [...prev, {
      id: contaId, tipo: "pagar",
      descricao: `Ordem de Compra #${ordemId.slice(-4)} — ${ordem.fornecedorNome}`,
      valor: ordem.total,
      vencimento: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "aberto", categoria: "Fornecedores",
      observacao: `Ordem de compra recebida de ${ordem.fornecedorNome}`,
    }]);

    addAuditLog({
      userId: currentUser.id, userName: currentUser.nome,
      action: "receber", entity: "ordem_compra", entityId: ordemId,
      oldValue: { status: "enviada" },
      newValue: { status: "recebida", estoqueIncrementado: true },
    });
  };

  const fecharCaixa = () => {
    if (vendasDoDia.length === 0) return null;
    const total = vendasDoDia.reduce((s, v) => s + v.total, 0);
    const vendas = vendasDoDia.length;
    setVendasDoDia([]);

    addAuditLog({
      userId: currentUser.id, userName: currentUser.nome,
      action: "fechar_caixa", entity: "caixa", entityId: Date.now().toString(),
      oldValue: null, newValue: { total, vendas },
    });

    return { total, vendas };
  };

  return (
    <StoreContext.Provider value={{
      produtos, setProdutos, lancamentos, setLancamentos, vendasDoDia, allVendas,
      registrarVenda, fecharCaixa, historicoProdutosVendidos,
      formasPagamento, setFormasPagamento,
      usuarios, setUsuarios, currentUser, setCurrentUser,
      contasBancarias, setContasBancarias, movimentacoes, registrarMovimentacao,
      clientes, setClientes,
      contasPagarReceber, setContasPagarReceber,
      priceHistory, addPriceHistory,
      fornecedores, setFornecedores,
      ordensCompra, setOrdensCompra, receberOrdemCompra,
      auditLogs, addAuditLog,
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
