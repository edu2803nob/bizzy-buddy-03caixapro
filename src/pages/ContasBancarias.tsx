import { useState } from "react";
import { Plus, Pencil, Trash2, Building2, Wallet, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore, type ContaBancaria } from "@/contexts/StoreContext";
import { toast } from "sonner";

const bancos = [
  "Nubank", "Itaú", "Bradesco", "Banco do Brasil", "Caixa Econômica Federal",
  "Santander", "Inter", "C6 Bank", "Sicoob", "Sicredi", "BTG Pactual",
  "XP Investimentos", "PagBank", "Mercado Pago", "Outros",
];

const tipoLabels: Record<ContaBancaria["tipo"], string> = {
  corrente: "Corrente", poupanca: "Poupança", pagamento: "Pagamento",
  caixa_fisico: "Caixa Físico", carteira: "Carteira",
};

const defaultColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"];

const emptyForm = { nome: "", banco: "", tipo: "corrente" as ContaBancaria["tipo"], agencia: "", conta: "", chavePix: "", saldoInicial: "", cor: "#10B981" };

export default function ContasBancarias() {
  const { contasBancarias, setContasBancarias, movimentacoes } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [extratoId, setExtratoId] = useState<string | null>(null);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const saldoTotal = contasBancarias.filter(c => c.ativo).reduce((s, c) => s + c.saldoAtual, 0);

  const handleSave = () => {
    if (!form.nome || !form.tipo) { toast.error("Nome e tipo são obrigatórios"); return; }
    if (editId) {
      setContasBancarias(prev => prev.map(c => c.id === editId ? {
        ...c, nome: form.nome, banco: form.banco, tipo: form.tipo,
        agencia: form.agencia, conta: form.conta, chavePix: form.chavePix, cor: form.cor,
      } : c));
      toast.success("Conta atualizada");
    } else {
      const saldo = Number(form.saldoInicial) || 0;
      setContasBancarias(prev => [...prev, {
        id: Date.now().toString(), nome: form.nome, banco: form.banco, tipo: form.tipo,
        agencia: form.agencia, conta: form.conta, chavePix: form.chavePix,
        saldoInicial: saldo, saldoAtual: saldo, ativo: true, cor: form.cor,
        createdAt: new Date().toISOString(),
      }]);
      toast.success("Conta criada");
    }
    setForm(emptyForm); setEditId(null); setOpen(false);
  };

  const openEdit = (c: ContaBancaria) => {
    setEditId(c.id);
    setForm({ nome: c.nome, banco: c.banco, tipo: c.tipo, agencia: c.agencia, conta: c.conta, chavePix: c.chavePix, saldoInicial: String(c.saldoInicial), cor: c.cor });
    setOpen(true);
  };

  const hasMovements = (id: string) => movimentacoes.some(m => m.contaBancariaId === id);

  const handleDelete = () => {
    if (!deleteId) return;
    if (hasMovements(deleteId)) { toast.error("Conta com movimentações não pode ser excluída"); setDeleteId(null); return; }
    setContasBancarias(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
    toast.success("Conta excluída");
  };

  const toggleStatus = (id: string) => {
    setContasBancarias(prev => prev.map(c => c.id === id ? { ...c, ativo: !c.ativo } : c));
    toast.success("Status atualizado");
  };

  const contaExtrato = contasBancarias.find(c => c.id === extratoId);
  const extratoMovs = movimentacoes.filter(m => m.contaBancariaId === extratoId).sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Contas Bancárias</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas contas e saldos</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Conta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Editar Conta" : "Nova Conta Bancária"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label className="text-xs">Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Conta Principal" /></div>
              <div>
                <Label className="text-xs">Banco</Label>
                <Select value={form.banco} onValueChange={v => setForm(f => ({ ...f, banco: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{bancos.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v: ContaBancaria["tipo"]) => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(tipoLabels) as ContaBancaria["tipo"][]).map(t => <SelectItem key={t} value={t}>{tipoLabels[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Agência</Label><Input value={form.agencia} onChange={e => setForm(f => ({ ...f, agencia: e.target.value }))} /></div>
                <div><Label className="text-xs">Conta</Label><Input value={form.conta} onChange={e => setForm(f => ({ ...f, conta: e.target.value }))} /></div>
              </div>
              <div><Label className="text-xs">Chave Pix</Label><Input value={form.chavePix} onChange={e => setForm(f => ({ ...f, chavePix: e.target.value }))} /></div>
              {!editId && <div><Label className="text-xs">Saldo Inicial</Label><Input type="number" value={form.saldoInicial} onChange={e => setForm(f => ({ ...f, saldoInicial: e.target.value }))} /></div>}
              <div>
                <Label className="text-xs">Cor</Label>
                <div className="flex gap-2 mt-1">
                  {defaultColors.map(c => (
                    <button key={c} className={`w-7 h-7 rounded-full border-2 transition-all ${form.cor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setForm(f => ({ ...f, cor: c }))} />
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} className="mt-2">{editId ? "Atualizar" : "Criar Conta"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saldo consolidado */}
      <div className="stat-card animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10"><Wallet className="h-5 w-5 text-primary" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Saldo Total Consolidado</p>
            <p className={`text-2xl font-bold tracking-tight ${saldoTotal >= 0 ? "text-success" : "text-destructive"}`}>{fmt(saldoTotal)}</p>
          </div>
        </div>
      </div>

      {/* Cards */}
      {contasBancarias.length === 0 ? (
        <div className="stat-card text-center py-12">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Conta" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contasBancarias.map(c => (
            <div key={c.id} className={`stat-card animate-fade-in-up relative overflow-hidden ${!c.ativo ? "opacity-60" : ""}`}>
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: c.cor }} />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.banco || "Sem banco"}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{tipoLabels[c.tipo]}</Badge>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${c.saldoAtual >= 0 ? "text-success" : "text-destructive"}`}>{fmt(c.saldoAtual)}</p>
              {c.chavePix && <p className="text-xs text-muted-foreground mt-1">Pix: {c.chavePix}</p>}
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/40">
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Extrato" onClick={() => setExtratoId(c.id)}><Eye className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                <button onClick={() => toggleStatus(c.id)} className="ml-auto">
                  <Badge variant={c.ativo ? "default" : "secondary"} className={`text-[10px] cursor-pointer ${c.ativo ? "bg-success text-success-foreground" : ""}`}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Excluir" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extrato dialog */}
      <Dialog open={!!extratoId} onOpenChange={(o) => !o && setExtratoId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Extrato — {contaExtrato?.nome}</DialogTitle></DialogHeader>
          {contaExtrato && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Saldo atual: <span className={`font-semibold ${contaExtrato.saldoAtual >= 0 ? "text-success" : "text-destructive"}`}>{fmt(contaExtrato.saldoAtual)}</span></p>
              <ScrollArea className="max-h-[400px]">
                {extratoMovs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação</p>
                ) : (
                  <div className="space-y-2">
                    {extratoMovs.map(m => (
                      <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm font-medium">{m.descricao}</p>
                          <p className="text-xs text-muted-foreground">{m.data} · {m.origem}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold tabular-nums ${m.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                            {m.tipo === "entrada" ? "+" : "-"}{fmt(m.valor)}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">Saldo: {fmt(m.saldoApos)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta bancária?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteId && hasMovements(deleteId) ? "Esta conta possui movimentações e não pode ser excluída." : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
