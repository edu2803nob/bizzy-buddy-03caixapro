import { useState } from "react";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";
import { type Produto } from "@/pages/Produtos";
import { toast } from "sonner";

interface CartItem {
  produto: Produto;
  quantidade: number;
}

export default function PDV() {
  const { produtos, registrarVenda } = useStore();
  const disponíveis = produtos.filter(p => p.ativo && p.estoque > 0);
  const [cart, setCart] = useState<CartItem[]>([]);

  const total = cart.reduce((acc, item) => acc + item.produto.preco * item.quantidade, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const addToCart = (produto: Produto) => {
    setCart(prev => {
      const existing = prev.find(i => i.produto.id === produto.id);
      const qtyInCart = existing ? existing.quantidade : 0;
      if (qtyInCart >= produto.estoque) {
        toast.error("Estoque insuficiente");
        return prev;
      }
      if (existing) {
        return prev.map(i =>
          i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.produto.id !== id) return i;
          const newQty = i.quantidade + delta;
          const produtoAtual = produtos.find(p => p.id === id);
          if (produtoAtual && newQty > produtoAtual.estoque) {
            toast.error("Estoque insuficiente");
            return i;
          }
          return { ...i, quantidade: newQty };
        })
        .filter(i => i.quantidade > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.produto.id !== id));
  };

  const finalizeSale = () => {
    if (cart.length === 0) return;
    const produtosVendidos = cart.map(i => ({ id: i.produto.id, quantidade: i.quantidade }));
    registrarVenda(total, cart.reduce((s, i) => s + i.quantidade, 0), produtosVendidos);
    toast.success(`Venda finalizada: ${fmt(total)}`);
    setCart([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Ponto de Venda</h2>
          <p className="text-sm text-muted-foreground mt-1">Registrar venda</p>
        </div>
        <div className="stat-card flex items-center gap-3 py-3 px-5">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold tracking-tight">{fmt(total)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Produtos Disponíveis</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {disponíveis.map((p, i) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="stat-card text-left hover:border-primary/40 transition-colors animate-fade-in-up active:scale-[0.97]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <p className="font-medium text-sm truncate">{p.nome}</p>
                <p className="text-xs text-muted-foreground">{p.estoque} un.</p>
                <p className="text-base font-semibold mt-2">{fmt(p.preco)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Carrinho ({cart.length})</h3>
          <div className="stat-card space-y-3 animate-fade-in">
            {cart.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Carrinho vazio</p>
            )}
            {cart.map(item => (
              <div key={item.produto.id} className="flex items-center justify-between gap-2 py-2 border-b border-border/60 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.produto.nome}</p>
                  <p className="text-xs text-muted-foreground">{fmt(item.produto.preco)} un.</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.produto.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center tabular-nums">{item.quantidade}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.produto.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.produto.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {cart.length > 0 && (
              <div className="pt-3 space-y-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
                <Button className="w-full" onClick={finalizeSale}>
                  Finalizar Venda
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
