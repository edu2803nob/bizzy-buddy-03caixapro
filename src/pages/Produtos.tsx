import { useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  custo: number;
  categoria: string;
  estoque: number;
  ativo: boolean;
}

export const initialProdutos: Produto[] = [
  { id: "1", nome: "Camiseta Básica", preco: 59.9, custo: 22, categoria: "Vestuário", estoque: 48, ativo: true },
  { id: "2", nome: "Calça Jeans", preco: 149.9, custo: 65, categoria: "Vestuário", estoque: 23, ativo: true },
  { id: "3", nome: "Tênis Runner", preco: 299.9, custo: 120, categoria: "Calçados", estoque: 12, ativo: true },
  { id: "4", nome: "Boné Snapback", preco: 49.9, custo: 15, categoria: "Acessórios", estoque: 0, ativo: false },
  { id: "5", nome: "Mochila Urban", preco: 189.9, custo: 75, categoria: "Acessórios", estoque: 7, ativo: true },
];

const emptyForm = { nome: "", preco: "", custo: "", categoria: "", estoque: "" };

export default function Produtos() {
  const { produtos, setProdutos } = useStore();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = produtos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.nome) return;
    if (editId) {
      setProdutos(prev => prev.map(p => p.id === editId ? {
        ...p,
        nome: form.nome,
        preco: Number(form.preco) || 0,
        custo: Number(form.custo) || 0,
        categoria: form.categoria,
        estoque: Number(form.estoque) || 0,
      } : p));
      toast.success("Produto atualizado");
    } else {
      setProdutos(prev => [...prev, {
        id: Date.now().toString(),
        nome: form.nome,
        preco: Number(form.preco) || 0,
        custo: Number(form.custo) || 0,
        categoria: form.categoria,
        estoque: Number(form.estoque) || 0,
        ativo: true,
      }]);
      toast.success("Produto adicionado");
    }
    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
  };

  const openEdit = (p: Produto) => {
    setEditId(p.id);
    setForm({
      nome: p.nome,
      preco: String(p.preco),
      custo: String(p.custo),
      categoria: p.categoria,
      estoque: String(p.estoque),
    });
    setOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setProdutos(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
    toast.success("Produto excluído");
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Produtos</h2>
          <p className="text-sm text-muted-foreground mt-1">{produtos.length} produtos</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              {([
                { key: "nome", label: "Nome", type: "text" },
                { key: "preco", label: "Preço", type: "number" },
                { key: "custo", label: "Custo", type: "number" },
                { key: "categoria", label: "Categoria", type: "text" },
                { key: "estoque", label: "Estoque", type: "number" },
              ] as const).map(f => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    type={f.type}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <Button onClick={handleSave} className="mt-2">{editId ? "Atualizar" : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p, i) => (
          <div
            key={p.id}
            className="stat-card animate-fade-in-up flex flex-col group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-sm">{p.nome}</p>
                <p className="text-xs text-muted-foreground">{p.categoria}</p>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={p.ativo ? "default" : "secondary"} className={p.ativo ? "bg-success text-success-foreground" : ""}>
                  {p.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
            <div className="flex items-end justify-between mt-auto">
              <div>
                <p className="text-lg font-semibold">{fmt(p.preco)}</p>
                <p className="text-xs text-muted-foreground">Custo: {fmt(p.custo)}</p>
              </div>
              <p className={`text-xs font-medium ${p.estoque === 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {p.estoque === 0 ? "Sem estoque" : `${p.estoque} un.`}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(p)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(p.id)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
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
