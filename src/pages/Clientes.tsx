import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/contexts/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const emptyForm = { nome: "", telefone: "", email: "", cpf: "", origem: "", observacao: "" };

export default function Clientes() {
  const { clientes, setClientes, allVendas } = useStore();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = clientes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSave = () => {
    if (!form.nome) return;
    if (editId) {
      setClientes(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
      toast.success("Cliente atualizado");
    } else {
      setClientes(prev => [...prev, { ...form, id: Date.now().toString() }]);
      toast.success("Cliente adicionado");
    }
    setForm(emptyForm); setEditId(null); setOpen(false);
  };

  const openEdit = (c: typeof clientes[0]) => {
    setEditId(c.id); setForm({ nome: c.nome, telefone: c.telefone, email: c.email, cpf: c.cpf, origem: c.origem, observacao: c.observacao }); setOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setClientes(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null); toast.success("Cliente excluído");
  };

  const drawerCliente = clientes.find(c => c.id === drawerId);
  const clienteVendas = useMemo(() => allVendas.filter(v => v.clienteId === drawerId), [allVendas, drawerId]);
  const totalGasto = clienteVendas.reduce((s, v) => s + v.total, 0);
  const ticketMedio = clienteVendas.length > 0 ? totalGasto / clienteVendas.length : 0;
  const ultimaCompra = clienteVendas.length > 0 ? clienteVendas[clienteVendas.length - 1]?.data : null;

  const fieldLabels: Record<string, string> = { nome: "Nome *", telefone: "Telefone", email: "Email", cpf: "CPF", origem: "Origem", observacao: "Observação" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-1">{clientes.length} cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              {(["nome", "telefone", "email", "cpf", "origem", "observacao"] as const).map(field => (
                <div key={field}><Label className="text-xs">{fieldLabels[field]}</Label><Input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={fieldLabels[field].replace(" *", "")} /></div>
              ))}
              <Button onClick={handleSave} className="mt-2">{editId ? "Atualizar" : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="stat-card p-0 overflow-hidden animate-fade-in-up">
        <div className="divide-y divide-border/60">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente encontrado</p>}
          {filtered.map(c => (
            <div key={c.id} className="group">
              <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setDrawerId(c.id)}>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground hidden sm:inline mr-2">{c.telefone}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); openEdit(c); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Drawer */}
      <Sheet open={!!drawerId} onOpenChange={(o) => !o && setDrawerId(null)}>
        <SheetContent className="sm:max-w-lg overflow-auto">
          {drawerCliente && (
            <>
              <SheetHeader>
                <SheetTitle>{drawerCliente.nome}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{drawerCliente.telefone || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{drawerCliente.email || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">CPF</p><p className="font-medium">{drawerCliente.cpf || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Origem</p><p className="font-medium">{drawerCliente.origem || "—"}</p></div>
                  {drawerCliente.observacao && <div className="col-span-2"><p className="text-xs text-muted-foreground">Observação</p><p className="font-medium">{drawerCliente.observacao}</p></div>}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { openEdit(drawerCliente); setDrawerId(null); }}><Pencil className="h-3.5 w-3.5 mr-1" /> Editar</Button>
                  <Button size="sm" onClick={() => { setDrawerId(null); navigate("/pdv"); }}><ShoppingCart className="h-3.5 w-3.5 mr-1" /> Nova Venda</Button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="stat-card"><p className="text-xs text-muted-foreground">Total Gasto</p><p className="text-lg font-semibold text-success">{fmt(totalGasto)}</p></div>
                  <div className="stat-card"><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="text-lg font-semibold">{fmt(ticketMedio)}</p></div>
                  <div className="stat-card"><p className="text-xs text-muted-foreground">Total de Compras</p><p className="text-lg font-semibold">{clienteVendas.length}</p></div>
                  <div className="stat-card"><p className="text-xs text-muted-foreground">Última Compra</p><p className="text-lg font-semibold">{ultimaCompra || "—"}</p></div>
                </div>

                {/* Purchase History */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Histórico de Compras</h3>
                  {clienteVendas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma compra registrada</p>
                  ) : (
                    <div className="space-y-2">
                      {clienteVendas.map(v => (
                        <div key={v.id} className="rounded-lg bg-muted/30 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{v.data}</p>
                            <p className="text-sm font-semibold text-success">{fmt(v.total)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{v.itens} ite(ns) · {v.formaPagamentoNome}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {v.produtos.map(p => <Badge key={p.produtoId} variant="secondary" className="text-[10px]">{p.nome} ×{p.quantidade}</Badge>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir cliente?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
