import { useState } from "react";
import { Plus, Search, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
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
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";

const emptyForm = { nome: "", telefone: "", email: "", cpf: "", origem: "", observacao: "" };

export default function Clientes() {
  const { clientes, setClientes } = useStore();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.nome) return;
    if (editId) {
      setClientes(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
      toast.success("Cliente atualizado");
    } else {
      setClientes(prev => [...prev, { ...form, id: Date.now().toString() }]);
      toast.success("Cliente adicionado");
    }
    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
  };

  const openEdit = (c: typeof clientes[0]) => {
    setEditId(c.id);
    setForm({ nome: c.nome, telefone: c.telefone, email: c.email, cpf: c.cpf, origem: c.origem, observacao: c.observacao });
    setOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setClientes(prev => prev.filter(c => c.id !== deleteId));
    if (expandedId === deleteId) setExpandedId(null);
    setDeleteId(null);
    toast.success("Cliente excluído");
  };

  const fieldLabels: Record<string, string> = {
    nome: "Nome *", telefone: "Telefone", email: "Email", cpf: "CPF", origem: "Origem", observacao: "Observação",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-1">{clientes.length} cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              {(["nome", "telefone", "email", "cpf", "origem", "observacao"] as const).map(field => (
                <div key={field}>
                  <Label className="text-xs">{fieldLabels[field]}</Label>
                  <Input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={fieldLabels[field].replace(" *", "")} />
                </div>
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
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente encontrado</p>
          )}
          {filtered.map(c => (
            <div key={c.id} className="group">
              <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                <div className="flex items-center gap-2">
                  {expandedId === c.id ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
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
              {expandedId === c.id && (
                <div className="px-5 pb-4 pt-1 bg-muted/20 border-t border-border/40 animate-fade-in-up">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div><p className="text-muted-foreground text-xs">Telefone</p><p className="font-medium">{c.telefone || "—"}</p></div>
                    <div><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{c.email || "—"}</p></div>
                    <div><p className="text-muted-foreground text-xs">CPF</p><p className="font-medium">{c.cpf || "—"}</p></div>
                    <div><p className="text-muted-foreground text-xs">Origem</p><p className="font-medium">{c.origem || "—"}</p></div>
                    <div className="col-span-2"><p className="text-muted-foreground text-xs">Observação</p><p className="font-medium">{c.observacao || "—"}</p></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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
