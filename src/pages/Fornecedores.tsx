import { useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore, type Fornecedor } from "@/contexts/StoreContext";
import { toast } from "sonner";

const emptyForm = { nome: "", cnpj: "", telefone: "", email: "", observacao: "" };

export default function FornecedoresPage() {
  const { fornecedores, setFornecedores, addAuditLog, currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = fornecedores.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    if (editId) {
      setFornecedores(prev => prev.map(f => f.id === editId ? { ...f, ...form } : f));
      toast.success("Fornecedor atualizado");
    } else {
      setFornecedores(prev => [...prev, { ...form, id: Date.now().toString(), ativo: true }]);
      toast.success("Fornecedor criado");
    }
    addAuditLog({ userId: currentUser.id, userName: currentUser.nome, action: editId ? "editar" : "criar", entity: "fornecedor", entityId: editId || Date.now().toString(), oldValue: null, newValue: form });
    setForm(emptyForm); setEditId(null); setOpen(false);
  };

  const openEdit = (f: Fornecedor) => {
    setEditId(f.id);
    setForm({ nome: f.nome, cnpj: f.cnpj, telefone: f.telefone, email: f.email, observacao: f.observacao });
    setOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setFornecedores(prev => prev.filter(f => f.id !== deleteId));
    setDeleteId(null);
    toast.success("Fornecedor excluído");
  };

  const toggleStatus = (id: string) => {
    setFornecedores(prev => prev.map(f => f.id === id ? { ...f, ativo: !f.ativo } : f));
    toast.success("Status atualizado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Fornecedores</h2>
          <p className="text-sm text-muted-foreground mt-1">{fornecedores.length} cadastrado(s)</p>
        </div>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Fornecedor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label className="text-xs">Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div><Label className="text-xs">CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
                <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div><Label className="text-xs">Observação</Label><Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} className="h-16" /></div>
              <Button onClick={handleSave} className="mt-2">{editId ? "Atualizar" : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Buscar fornecedor..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <div className="stat-card p-0 overflow-hidden animate-fade-in-up">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum fornecedor</TableCell></TableRow>}
            {filtered.map(f => (
              <TableRow key={f.id} className="group">
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell className="text-muted-foreground">{f.cnpj || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{f.telefone || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{f.email || "—"}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={f.ativo ? "default" : "secondary"} className={f.ativo ? "bg-success text-success-foreground" : ""}>{f.ativo ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus(f.id)}>
                      {f.ativo ? <ToggleRight className="h-3.5 w-3.5 text-success" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
