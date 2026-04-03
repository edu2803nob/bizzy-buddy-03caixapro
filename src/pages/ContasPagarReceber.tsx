import { useState, useMemo } from "react";
import { Plus, DollarSign, ArrowUpRight, ArrowDownRight, Check, X, CalendarIcon } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, type ContaPagarReceber } from "@/contexts/StoreContext";
import { toast } from "sonner";

const categorias = ["Aluguel", "Fornecedores", "Serviços", "Salários", "Impostos", "Clientes", "Vendas", "Outros"];

export default function ContasPagarReceberPage() {
  const { contasPagarReceber, setContasPagarReceber, contasBancarias, registrarMovimentacao, setLancamentos, addAuditLog, currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const [payModal, setPayModal] = useState<string | null>(null);
  const [payContaId, setPayContaId] = useState("");
  const [tab, setTab] = useState("todas");
  const [form, setForm] = useState({
    tipo: "pagar" as "pagar" | "receber",
    descricao: "", valor: "", vencimento: "", categoria: "Outros", observacao: "",
  });

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const hoje = new Date().toISOString().split("T")[0];

  // Auto-update overdue
  const contas = useMemo(() => {
    return contasPagarReceber.map(c => {
      if (c.status === "aberto" && c.vencimento < hoje) return { ...c, status: "vencido" as const };
      return c;
    });
  }, [contasPagarReceber, hoje]);

  const filtered = tab === "todas" ? contas : contas.filter(c => c.tipo === (tab === "pagar" ? "pagar" : "receber"));

  const totalPagar = contas.filter(c => c.tipo === "pagar" && (c.status === "aberto" || c.status === "vencido")).reduce((s, c) => s + c.valor, 0);
  const totalReceber = contas.filter(c => c.tipo === "receber" && (c.status === "aberto" || c.status === "vencido")).reduce((s, c) => s + c.valor, 0);
  const saldoPrevisto = totalReceber - totalPagar;

  const handleSave = () => {
    if (!form.descricao || !form.valor || !form.vencimento) { toast.error("Preencha todos os campos obrigatórios"); return; }
    const newConta: ContaPagarReceber = {
      id: Date.now().toString(), tipo: form.tipo,
      descricao: form.descricao, valor: Number(form.valor) || 0,
      vencimento: form.vencimento, status: "aberto",
      categoria: form.categoria, observacao: form.observacao,
    };
    setContasPagarReceber(prev => [...prev, newConta]);
    toast.success(`Conta a ${form.tipo} criada`);
    setForm({ tipo: "pagar", descricao: "", valor: "", vencimento: "", categoria: "Outros", observacao: "" });
    setOpen(false);
  };

  const handlePay = () => {
    if (!payModal) return;
    const conta = contas.find(c => c.id === payModal);
    if (!conta) return;

    setContasPagarReceber(prev => prev.map(c => c.id === payModal ? {
      ...c, status: "pago" as const, dataPagamento: hoje, contaBancariaId: payContaId || undefined,
    } : c));

    // Register in financeiro
    const tipoLanc = conta.tipo === "pagar" ? "saida" as const : "entrada" as const;
    const lancId = Date.now().toString();
    setLancamentos(prev => [...prev, {
      id: lancId, tipo: tipoLanc,
      descricao: conta.descricao, valor: conta.valor,
      categoria: conta.categoria, data: hoje,
      contaBancariaId: payContaId || undefined,
      contaBancariaNome: contasBancarias.find(c => c.id === payContaId)?.nome,
    }]);

    // Bank movement
    if (payContaId) {
      registrarMovimentacao(
        payContaId, tipoLanc, conta.valor, conta.descricao,
        conta.tipo === "pagar" ? "conta_pagar" : "conta_receber", payModal
      );
    }

    addAuditLog({
      userId: currentUser.id, userName: currentUser.nome,
      action: "pagar", entity: `conta_${conta.tipo}`, entityId: payModal,
      oldValue: { status: conta.status }, newValue: { status: "pago", contaBancariaId: payContaId },
    });

    toast.success(`Conta marcada como paga`);
    setPayModal(null); setPayContaId("");
  };

  const handleCancel = (id: string) => {
    setContasPagarReceber(prev => prev.map(c => c.id === id ? { ...c, status: "cancelado" as const } : c));
    toast.success("Conta cancelada");
  };

  const statusBadge = (s: ContaPagarReceber["status"]) => {
    switch (s) {
      case "aberto": return <Badge variant="outline">Aberto</Badge>;
      case "pago": return <Badge className="bg-success text-success-foreground">Pago</Badge>;
      case "vencido": return <Badge variant="destructive">Vencido</Badge>;
      case "cancelado": return <Badge variant="secondary">Cancelado</Badge>;
    }
  };

  const contasAtivas = contasBancarias.filter(c => c.ativo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Contas a Pagar e Receber</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas obrigações financeiras</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Conta</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <Label className="text-xs">Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v: "pagar" | "receber") => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pagar">A Pagar</SelectItem>
                    <SelectItem value="receber">A Receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Descrição *</Label><Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
              <div><Label className="text-xs">Valor *</Label><Input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></div>
              <div><Label className="text-xs">Vencimento *</Label><Input type="date" value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Observação</Label><Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} className="h-16" /></div>
              <Button onClick={handleSave} className="mt-2">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card animate-fade-in-up">
          <p className="text-sm text-muted-foreground">Total a Pagar</p>
          <p className="text-2xl font-semibold text-destructive mt-1">{fmt(totalPagar)}</p>
        </div>
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <p className="text-sm text-muted-foreground">Total a Receber</p>
          <p className="text-2xl font-semibold text-success mt-1">{fmt(totalReceber)}</p>
        </div>
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <p className="text-sm text-muted-foreground">Saldo Previsto</p>
          <p className={`text-2xl font-semibold mt-1 ${saldoPrevisto >= 0 ? "text-success" : "text-destructive"}`}>{fmt(saldoPrevisto)}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pagar">A Pagar</TabsTrigger>
          <TabsTrigger value="receber">A Receber</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="stat-card p-0 overflow-hidden animate-fade-in-up">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma conta encontrada</TableCell></TableRow>
            )}
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className={`p-1.5 rounded-md inline-flex ${c.tipo === "receber" ? "bg-success/10" : "bg-destructive/10"}`}>
                    {c.tipo === "receber" ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{c.descricao}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.categoria}</TableCell>
                <TableCell className={c.status === "vencido" ? "text-destructive font-medium" : ""}>{c.vencimento}</TableCell>
                <TableCell className={`text-right tabular-nums font-semibold ${c.tipo === "receber" ? "text-success" : "text-destructive"}`}>{fmt(c.valor)}</TableCell>
                <TableCell className="text-center">{statusBadge(c.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {(c.status === "aberto" || c.status === "vencido") && (
                      <>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setPayModal(c.id); setPayContaId(""); }}>
                          <Check className="h-3 w-3" /> Pagar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleCancel(c.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pay modal */}
      <Dialog open={!!payModal} onOpenChange={(o) => !o && setPayModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Marcar como Pago</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              Conta: <span className="font-medium text-foreground">{contas.find(c => c.id === payModal)?.descricao}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Valor: <span className="font-semibold text-foreground">{fmt(contas.find(c => c.id === payModal)?.valor || 0)}</span>
            </p>
            <div>
              <Label className="text-xs">Conta Bancária (opcional)</Label>
              <Select value={payContaId} onValueChange={setPayContaId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {contasAtivas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome} — {fmt(c.saldoAtual)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handlePay} className="mt-2">Confirmar Pagamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
