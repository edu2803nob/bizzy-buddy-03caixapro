import { useState, useMemo } from "react";
import { Plus, Trash2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useStore, type OrdemCompra } from "@/contexts/StoreContext";
import { toast } from "sonner";

interface ItemForm { produtoId: string; quantidade: string; custoUnitario: string }

export default function OrdensCompraPage() {
  const { ordensCompra, setOrdensCompra, fornecedores, produtos, receberOrdemCompra } = useStore();
  const [open, setOpen] = useState(false);
  const [fornecedorId, setFornecedorId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([{ produtoId: "", quantidade: "", custoUnitario: "" }]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fornecedoresAtivos = fornecedores.filter(f => f.ativo);

  const addItem = () => setItens(prev => [...prev, { produtoId: "", quantidade: "", custoUnitario: "" }]);
  const removeItem = (i: number) => setItens(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof ItemForm, value: string) => {
    setItens(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const handleSave = () => {
    if (!fornecedorId) { toast.error("Selecione um fornecedor"); return; }
    const validItens = itens.filter(i => i.produtoId && Number(i.quantidade) > 0);
    if (validItens.length === 0) { toast.error("Adicione pelo menos um item"); return; }

    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    const ordemItens = validItens.map(i => {
      const prod = produtos.find(p => p.id === i.produtoId);
      return { produtoId: i.produtoId, produtoNome: prod?.nome || "", quantidade: Number(i.quantidade), custoUnitario: Number(i.custoUnitario) || prod?.custo || 0 };
    });
    const total = ordemItens.reduce((s, i) => s + i.custoUnitario * i.quantidade, 0);

    const ordem: OrdemCompra = {
      id: Date.now().toString(), fornecedorId, fornecedorNome: fornecedor?.nome || "",
      status: "rascunho", itens: ordemItens, total,
      data: new Date().toISOString().split("T")[0], observacao,
    };

    setOrdensCompra(prev => [...prev, ordem]);
    toast.success("Ordem de compra criada");
    setFornecedorId(""); setObservacao(""); setItens([{ produtoId: "", quantidade: "", custoUnitario: "" }]); setOpen(false);
  };

  const enviar = (id: string) => {
    setOrdensCompra(prev => prev.map(o => o.id === id ? { ...o, status: "enviada" as const } : o));
    toast.success("Ordem enviada");
  };

  const receber = (id: string) => {
    receberOrdemCompra(id);
    toast.success("Ordem recebida — estoque atualizado e conta a pagar criada");
  };

  const cancelar = (id: string) => {
    setOrdensCompra(prev => prev.map(o => o.id === id ? { ...o, status: "cancelada" as const } : o));
    toast.success("Ordem cancelada");
  };

  const statusBadge = (s: OrdemCompra["status"]) => {
    const map = { rascunho: "secondary", enviada: "default", recebida: "default", cancelada: "destructive" } as const;
    const labels = { rascunho: "Rascunho", enviada: "Enviada", recebida: "Recebida", cancelada: "Cancelada" };
    return <Badge variant={map[s]} className={s === "recebida" ? "bg-success text-success-foreground" : ""}>{labels[s]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Ordens de Compra</h2>
          <p className="text-sm text-muted-foreground mt-1">{ordensCompra.length} ordem(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Ordem</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader><DialogTitle>Nova Ordem de Compra</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div>
                <Label className="text-xs">Fornecedor *</Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{fornecedoresAtivos.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-2 block">Itens</Label>
                {itens.map((item, i) => (
                  <div key={i} className="flex items-end gap-2 mb-2">
                    <div className="flex-1">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Produto</Label>}
                      <Select value={item.produtoId} onValueChange={v => updateItem(i, "produtoId", v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{produtos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Qtd</Label>}
                      <Input type="number" className="h-9 text-xs" value={item.quantidade} onChange={e => updateItem(i, "quantidade", e.target.value)} />
                    </div>
                    <div className="w-24">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Custo Un.</Label>}
                      <Input type="number" className="h-9 text-xs" value={item.custoUnitario} onChange={e => updateItem(i, "custoUnitario", e.target.value)} />
                    </div>
                    {itens.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeItem(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="text-xs" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Adicionar Item</Button>
              </div>

              <div><Label className="text-xs">Observação</Label><Textarea value={observacao} onChange={e => setObservacao(e.target.value)} className="h-16" /></div>
              <Button onClick={handleSave}>Criar Ordem</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="stat-card p-0 overflow-hidden animate-fade-in-up">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordensCompra.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma ordem de compra</TableCell></TableRow>}
            {ordensCompra.map(o => (
              <TableRow key={o.id}>
                <TableCell>{o.data}</TableCell>
                <TableCell className="font-medium">{o.fornecedorNome}</TableCell>
                <TableCell className="text-muted-foreground">{o.itens.length} produto(s)</TableCell>
                <TableCell className="text-right tabular-nums font-semibold">{fmt(o.total)}</TableCell>
                <TableCell className="text-center">{statusBadge(o.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {o.status === "rascunho" && (
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => enviar(o.id)}>Enviar</Button>
                    )}
                    {o.status === "enviada" && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => receber(o.id)}>
                        <PackageCheck className="h-3 w-3" /> Receber
                      </Button>
                    )}
                    {(o.status === "rascunho" || o.status === "enviada") && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => cancelar(o.id)}>Cancelar</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
