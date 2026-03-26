import { useState, useMemo } from "react";
import { Plus, Minus, Trash2, ShoppingCart, Search, Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useStore } from "@/contexts/StoreContext";
import { type Produto } from "@/pages/Produtos";
import { toast } from "sonner";

interface CartItem {
  produto: Produto;
  quantidade: number;
}

export default function PDV() {
  const { produtos, registrarVenda, formasPagamento } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [formaPagamentoId, setFormaPagamentoId] = useState<string>("");

  const formasAtivas = formasPagamento.filter(f => f.ativo);

  const disponíveis = useMemo(() =>
    produtos.filter(p => p.ativo && p.estoque > 0 && p.nome.toLowerCase().includes(search.toLowerCase())),
    [produtos, search]
  );

  const total = cart.reduce((acc, item) => acc + item.produto.preco * item.quantidade, 0);
  const totalItens = cart.reduce((acc, item) => acc + item.quantidade, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const addToCart = (produto: Produto) => {
    setCart(prev => {
      const existing = prev.find(i => i.produto.id === produto.id);
      const qtyInCart = existing ? existing.quantidade : 0;
      if (qtyInCart >= produto.estoque) {
        toast.error("Estoque insuficiente");
        return prev;
      }
      setAddedId(produto.id);
      setTimeout(() => setAddedId(null), 600);
      if (existing) {
        return prev.map(i => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(i => {
        if (i.produto.id !== id) return i;
        const newQty = i.quantidade + delta;
        const produtoAtual = produtos.find(p => p.id === id);
        if (produtoAtual && newQty > produtoAtual.estoque) {
          toast.error("Estoque insuficiente");
          return i;
        }
        return { ...i, quantidade: newQty };
      }).filter(i => i.quantidade > 0)
    );
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.produto.id !== id));

  const finalizeSale = () => {
    if (cart.length === 0) return;
    if (!formaPagamentoId) {
      toast.error("Selecione uma forma de pagamento");
      return;
    }
    const formaSelecionada = formasPagamento.find(f => f.id === formaPagamentoId);
    const produtosVendidos = cart.map(i => ({ id: i.produto.id, quantidade: i.quantidade }));
    registrarVenda(total, totalItens, produtosVendidos, formaPagamentoId, formaSelecionada?.nome || "");
    toast.success(`Venda finalizada: ${fmt(total)} via ${formaSelecionada?.nome}`);
    setCart([]);
    setFormaPagamentoId("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Ponto de Venda</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Registre vendas rapidamente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:h-[calc(100vh-180px)]">
        {/* PRODUTOS */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar produto por nome..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                    return (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-primary/5 transition-colors active:bg-primary/10" onClick={() => addToCart(p)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isAdded && <Check className="h-3.5 w-3.5 text-primary animate-scale-in" />}
                            <span className="font-medium text-sm">{p.nome}</span>
                            {inCart && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 tabular-nums">{inCart.quantidade}×</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{p.categoria}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          <span className={p.estoque <= 5 ? "text-destructive font-medium" : "text-muted-foreground"}>{p.estoque} un.</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums">{fmt(p.preco)}</TableCell>
                      </TableRow>
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
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Carrinho</span>
              </div>
              <Badge variant="secondary" className="tabular-nums">{totalItens} {totalItens === 1 ? "item" : "itens"}</Badge>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-5 py-2">
                {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Clique em um produto para adicionar</p>}
                {cart.map(item => (
                  <div key={item.produto.id} className="flex items-center justify-between gap-2 py-3 border-b border-border/40 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.produto.nome}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{fmt(item.produto.preco)} × {item.quantidade}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.produto.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="text-sm font-medium w-7 text-center tabular-nums">{item.quantidade}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.produto.id, 1)}><Plus className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.produto.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <p className="text-sm font-semibold tabular-nums w-20 text-right">{fmt(item.produto.preco * item.quantidade)}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-border/60 px-5 py-4 space-y-3 mt-auto">
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

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal ({totalItens} itens)</span>
                <span className="tabular-nums">{fmt(total)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums text-primary">{fmt(total)}</span>
              </div>
              <Button className="w-full h-11 text-sm font-semibold" onClick={finalizeSale} disabled={cart.length === 0 || !formaPagamentoId}>
                Finalizar Venda
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
