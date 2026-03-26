import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore, type UserRole, type UserPermissions, defaultPermissions } from "@/contexts/StoreContext";
import { toast } from "sonner";

const roleLabels: Record<UserRole, string> = { admin: "Admin", operador: "Operador", financeiro: "Financeiro" };
const roleColors: Record<UserRole, string> = {
  admin: "bg-primary text-primary-foreground",
  operador: "bg-secondary text-secondary-foreground",
  financeiro: "bg-accent text-accent-foreground",
};

const emptyForm = {
  nome: "", email: "", tipo: "operador" as UserRole, status: "ativo" as "ativo" | "inativo",
  permissoes: { ...defaultPermissions.operador },
};

export default function Usuarios() {
  const { usuarios, setUsuarios } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = () => {
    if (!form.nome || !form.email) return;
    if (editId) {
      setUsuarios(prev => prev.map(u => u.id === editId ? { ...u, ...form } : u));
      toast.success("Usuário atualizado");
    } else {
      setUsuarios(prev => [...prev, { ...form, id: Date.now().toString() }]);
      toast.success("Usuário adicionado");
    }
    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
  };

  const openEdit = (u: typeof usuarios[0]) => {
    setEditId(u.id);
    setForm({ nome: u.nome, email: u.email, tipo: u.tipo, status: u.status, permissoes: { ...u.permissoes } });
    setOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setUsuarios(prev => prev.filter(u => u.id !== deleteId));
    setDeleteId(null);
    toast.success("Usuário excluído");
  };

  const toggleStatus = (id: string) => {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "ativo" ? "inativo" : "ativo" } : u));
  };

  const handleRoleChange = (role: UserRole) => {
    setForm(f => ({ ...f, tipo: role, permissoes: { ...defaultPermissions[role] } }));
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setForm(f => ({ ...f, permissoes: { ...f.permissoes, [key]: !f.permissoes[key] } }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Usuários</h2>
          <p className="text-sm text-muted-foreground mt-1">{usuarios.length} usuários cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Usuário" : "Novo Usuário"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label className="text-xs">Nome</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Perfil</Label>
                <Select value={form.tipo} onValueChange={(v: UserRole) => handleRoleChange(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador (acesso total)</SelectItem>
                    <SelectItem value="operador">Operador (apenas PDV)</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v: "ativo" | "inativo") => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions toggles */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <Label className="text-xs font-semibold">Permissões</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Acesso ao PDV</span>
                  <Switch checked={form.permissoes.pdv} onCheckedChange={() => togglePermission("pdv")} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Acesso ao Financeiro</span>
                  <Switch checked={form.permissoes.financeiro} onCheckedChange={() => togglePermission("financeiro")} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Administrador (acesso total)</span>
                  <Switch checked={form.permissoes.admin} onCheckedChange={() => togglePermission("admin")} />
                </div>
              </div>

              <Button onClick={handleSave} className="mt-2">{editId ? "Atualizar" : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="stat-card p-0 overflow-hidden animate-fade-in-up">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map(u => (
              <TableRow key={u.id} className="group">
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                <TableCell><Badge className={roleColors[u.tipo]}>{roleLabels[u.tipo]}</Badge></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.permissoes.pdv && <Badge variant="outline" className="text-[10px] px-1.5 py-0">PDV</Badge>}
                    {u.permissoes.financeiro && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Fin.</Badge>}
                    {u.permissoes.admin && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Admin</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleStatus(u.id)} className="cursor-pointer">
                    <Badge variant={u.status === "ativo" ? "default" : "secondary"}
                      className={u.status === "ativo" ? "bg-success text-success-foreground" : ""}>
                      {u.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
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
