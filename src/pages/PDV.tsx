import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Plus, Minus, Trash2, ShoppingCart, Search, Check, CreditCard, Percent, MessageSquare, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore } from "@/contexts/StoreContext";
import { type Produto } from "@/pages/Produtos";
import { toast } from "sonner";

interface CartItem {
  produto: Produto;
  quantidade: number;
  desconto: number; // in BRL per item
}

export default function PDV() {
  const { produtos, registrarVenda, formasPagamento, clientes, currentUser } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [formaPagamentoId, setFormaPagamentoId] = useState<string>("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteSearch, setClienteSearch] = useState("");
  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState("");
  const [globalDiscountType, setGlobalDiscountType] = useState<"valor" | "pct">("valor");
  const [showDiscount, setShowDiscount] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [showObs, setShowObs] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const canDiscount = currentUser.permissoes.admin || currentUser.tipo === "admin";
  const formasAtivas = formasPagamento.filter(f => f.ativo);

  const disponíveis = useMemo(() =>
    produtos.filter(p => p.ativo && p.estoque > 0 && p.nome.toLowerCase().includes(search.toLowerCase())),
    [produtos, search]
  );

  const subtotal = cart.reduce((acc, item) => acc + (item.produto.preco - item.desconto) * item.quantidade, 0);
  const globalDiscountValue = globalDiscountType === "pct"
    ? subtotal * (Math.min(Number(globalDiscount) || 0, 100) / 100)
    : Math.min(Number(globalDiscount) || 0, subtotal);
  const total = Math.max(0, subtotal - globalDiscountValue);
  const totalItens = cart.reduce((acc, item) => acc + item.quantidade, 0);
  const totalDescontoItens = cart.reduce((acc, item) => acc + item.desconto * item.quantidade, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const selectedCliente = clientes.find(c => c.id === clienteId);
  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    c.telefone.includes(clienteSearch)
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); }
    if (e.key === "F10") { e.preventDefault(); if (cart.length > 0 && formaPagamentoId) finalizeSale(); }
    if (e.key === "Escape") { setSearch(""); searchRef.current?.blur(); }
  }, [cart, formaPagamentoId]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const addToCart = (produto: Produto) => {
    setCart(prev => {
      const existing = prev.find(i => i.produto.id === produto.id);
      const qtyInCart = existing ? existing.quantidade : 0;
      if (qtyInCart >= produto.estoque) {
        toast.error(`Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoque}`);
        return prev;
      }
      setAddedId(produto.id);
      setTimeout(() => setAddedId(null), 600);
      if (existing) {
        return prev.map(i => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { produto, quantidade: 1, desconto: 0 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(i => {
        if (i.produto.id !== id) return i;
        const newQty = i.quantidade + delta;
        const produtoAtual = produtos.find(p => p.id === id);
        if (produtoAtual && newQty > produtoAtual.estoque) {
          toast.error(`Estoque insuficiente para "${produtoAtual.nome}". Disponível: ${produtoAtual.estoque}`);
          return i;
        }
        return { ...i, quantidade: newQty };
      }).filter(i => i.quantidade > 0)
    );
  };

  const setItemDiscount = (id: string, value: string) => {
    if (!canDiscount) return;
    const numVal = Math.max(0, Number(value) || 0);
    setCart(prev => prev.map(i => {
      if (i.produto.id !== id) return i;
      return { ...i, desconto: Math.min(numVal, i.produto.preco) };
    }));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.produto.id !== id));

  const hasStockIssue = cart.some(item => {
    const prod = produtos.find(p => p.id === item.produto.id);
    return prod && item.quantidade > prod.estoque;
  });

  const finalizeSale = () => {
    if (cart.length === 0) return;
    if (!formaPagamentoId) { toast.error("Selecione uma forma de pagamento"); return; }
    if (hasStockIssue) { toast.error("Há itens com estoque insuficiente no carrinho"); return; }

    const formaSelecionada = formasPagamento.find(f => f.id === formaPagamentoId);
    const produtosVendidos = cart.map(i => ({
      id: i.produto.id,
      quantidade: i.quantidade,
      precoUnitario: i.produto.preco,
      desconto: i.desconto,
    }));

    registrarVenda({
      total,
      itens: totalItens,
      produtosVendidos,
      formaPagamentoId,
      formaPagamentoNome: formaSelecionada?.nome || "",
      clienteId: clienteId || undefined,
      clienteNome: selectedCliente?.nome,
      desconto: totalDescontoItens + globalDiscountValue,
      observacao,
    });

    toast.success(`Venda finalizada: ${fmt(total)} via ${formaSelecionada?.nome}`);
    setCart([]); setFormaPagamentoId(""); setClienteId(null); setGlobalDiscount(""); setObservacao(""); setShowObs(false); setShowDiscount(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Ponto de Venda</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Registre vendas rapidamente</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">F2 Busca</Badge>
          <Badge variant="outline" className="text-[10px]">F10 Finalizar</Badge>
          <Badge variant="outline" className="text-[10px]">Esc Limpar</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:h-[calc(100vh-180px)]">
        {/* PRODUTOS */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input ref={searchRef} placeholder="Buscar produto por nome... [F2]" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums">{disponíveis.length} itens</Badge>
          </div>

          <div className="stat-card p-0 overflow-hidden flex-1 min-h-0">
            <ScrollArea className="h-full max-h-[60vh] lg:max-h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disponíveis.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">Nenhum produto encontrado</TableCell></TableRow>
                  )}
                  {disponíveis.map(p => {
                    const inCart = cart.find(i => i.produto.id === p.id);
                    const isAdded = addedId === p.id;
                    const atLimit = inCart && inCart.quantidade >= p.estoque;
                    return (
                      <Tooltip key={p.id}>
                        <TooltipTrigger asChild>
                          <TableRow className={`cursor-pointer transition-colors active:bg-primary/10 ${atLimit ? "opacity-50" : "hover:bg-primary/5"}`} onClick={() => addToCart(p)}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isAdded && <Check className="h-3.5 w-3.5 text-primary animate-scale-in" />}
                                <span className="font-medium text-sm">{p.nome}</span>
                                {inCart && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 tabular-nums">{inCart.quantidade}×</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{p.categoria}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">
                              <span className={
                                p.estoque === 0 ? "text-destructive font-medium" :
                                p.estoque <= (p.estoqueMinimo || 10) ? "text-warning font-medium" :
                                "text-muted-foreground"
                              }>{p.estoque} un.</span>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm tabular-nums">{fmt(p.preco)}</TableCell>
                          </TableRow>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Estoque disponível: {p.estoque} un.</p>
                          {inCart && <p>No carrinho: {inCart.quantidade} un.</p>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        {/* CARRINHO */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="stat-card flex flex-col flex-1 min-h-0 p-0">
            {/* Header with client search */}
            <div className="px-5 py-3.5 border-b border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Carrinho</span>
                </div>
                <Badge variant="secondary" className="tabular-nums">{totalItens} {totalItens === 1 ? "item" : "itens"}</Badge>
              </div>
              {/* Cliente */}
              {selectedCliente ? (
                <div className="flex items-center gap-2 bg-muted/40 rounded-md px-3 py-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium flex-1">{selectedCliente.nome}</span>
                  <button onClick={() => setClienteId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Vincular cliente (opcional)..."
                    className="h-8 text-xs pl-8"
                    value={clienteSearch}
                    onChange={e => { setClienteSearch(e.target.value); setShowClienteSearch(true); }}
                    onFocus={() => setShowClienteSearch(true)}
                    onBlur={() => setTimeout(() => setShowClienteSearch(false), 200)}
                  />
                  {showClienteSearch && clienteSearch && filteredClientes.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-popover border border-border rounded-md shadow-md mt-1 max-h-40 overflow-auto">
                      {filteredClientes.slice(0, 5).map(c => (
                        <button key={c.id} className="w-full text-left px-3 py-2 text-xs hover:bg-muted/60 transition-colors" onClick={() => { setClienteId(c.id); setClienteSearch(""); setShowClienteSearch(false); }}>
                          <p className="font-medium">{c.nome}</p>
                          <p className="text-muted-foreground">{c.telefone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-5 py-2">
                {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Clique em um produto para adicionar</p>}
                {cart.map(item => {
                  const currentProduct = produtos.find(p => p.id === item.produto.id);
                  const stockWarning = currentProduct && item.quantidade >= currentProduct.estoque;
                  const stockError = currentProduct && item.quantidade > currentProduct.estoque;
                  return (
                    <div key={item.produto.id} className={`flex flex-col gap-1 py-3 border-b border-border/40 last:border-0 ${stockError ? "bg-destructive/5 -mx-5 px-5 rounded" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.produto.nome}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {fmt(item.produto.preco)} {item.desconto > 0 && <span className="text-success">(-{fmt(item.desconto)})</span>} × {item.quantidade}
                          </p>
                          {stockWarning && !stockError && <p className="text-[10px] text-warning font-medium">⚠ Limite de estoque atingido</p>}
                          {stockError && <p className="text-[10px] text-destructive font-medium">✖ Estoque insuficiente (disponível: {currentProduct.estoque})</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.produto.id, -1)}><Minus className="h-3 w-3" /></Button>
                          <span className="text-sm font-medium w-7 text-center tabular-nums">{item.quantidade}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" disabled={stockWarning} onClick={() => updateQty(item.produto.id, 1)}><Plus className="h-3 w-3" /></Button>
                          {canDiscount && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    className="h-7 w-16 text-xs text-center px-1"
                                    placeholder="Desc"
                                    value={item.desconto || ""}
                                    onChange={e => setItemDiscount(item.produto.id, e.target.value)}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Desconto (R$) por unidade</TooltipContent>
                            </Tooltip>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.produto.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-right">{fmt((item.produto.preco - item.desconto) * item.quantidade)}</p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t border-border/60 px-5 py-4 space-y-3 mt-auto">
              {/* Observação */}
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={() => setShowObs(!showObs)}>
                <MessageSquare className="h-3 w-3" /> {showObs ? "Fechar observação" : "Adicionar observação"}
              </button>
              {showObs && (
                <Textarea className="text-xs h-16 resize-none" placeholder="Observação da venda..." value={observacao} onChange={e => setObservacao(e.target.value)} />
              )}

              {/* Forma de pagamento */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Forma de Pagamento</label>
                <Select value={formaPagamentoId} onValueChange={setFormaPagamentoId}>
                  <SelectTrigger className="h-9">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Selecione..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {formasAtivas.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desconto global */}
              {canDiscount && (
                <div>
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1" onClick={() => setShowDiscount(!showDiscount)}>
                    <Percent className="h-3 w-3" /> {showDiscount ? "Fechar desconto" : "Desconto global"}
                  </button>
                  {showDiscount && (
                    <div className="flex gap-2">
                      <Select value={globalDiscountType} onValueChange={(v: "valor" | "pct") => setGlobalDiscountType(v)}>
                        <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="valor">R$</SelectItem>
                          <SelectItem value="pct">%</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" className="h-8 text-xs" placeholder="0" value={globalDiscount} onChange={e => setGlobalDiscount(e.target.value)} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal ({totalItens} itens)</span>
                <span className="tabular-nums">{fmt(subtotal)}</span>
              </div>
              {(totalDescontoItens + globalDiscountValue) > 0 && (
                <div className="flex justify-between text-xs text-success">
                  <span>Desconto</span>
                  <span className="tabular-nums">-{fmt(totalDescontoItens + globalDiscountValue)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums text-primary">{fmt(total)}</span>
              </div>
              <Button className="w-full h-11 text-sm font-semibold" onClick={finalizeSale} disabled={cart.length === 0 || !formaPagamentoId || hasStockIssue}>
                Finalizar Venda [F10]
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
