import { useState } from "react";
import { Plus, Pencil, Trash2, CreditCard, Banknote, QrCode, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";

export type TipoPagamento = "dinheiro" | "pix" | "credito" | "debito" | "boleto";

export interface FormaPagamento {
  id: string;
  nome: string;
  tipo: TipoPagamento;
  ativo: boolean;
}

export const initialFormasPagamento: FormaPagamento[] = [
  { id: "fp1", nome: "Dinheiro", tipo: "dinheiro", ativo: true },
  { id: "fp2", nome: "Pix", tipo: "pix", ativo: true },
  { id: "fp3", nome: "Cartão de Crédito", tipo: "credito", ativo: true },
  { id: "fp4", nome: "Cartão de Débito", tipo: "debito", ativo: true },
  { id: "fp5", nome: "Boleto", tipo: "boleto", ativo: false },
];

const tipoLabels: Record<TipoPagamento, string> = {
  dinheiro: "Dinheiro", pix: "Pix", credito: "Crédito", debito: "Débito", boleto: "Boleto",
};

const tipoIcons: Record<TipoPagamento, React.ReactNode> = {
  dinheiro: <Banknote className="h-4 w-4" />,
  pix: <QrCode className="h-4 w-4" />,
  credito: <CreditCard className="h-4 w-4" />,
  debito: <CreditCard className="h-4 w-4" />,
  boleto: <FileText className="h-4 w-4" />,
};

const emptyForm = { nome: "", tipo: "dinheiro" as TipoPagamento };

export default function FormasPagamento() {
  const { formasPagamento, setFormasPagamento, lancamentos } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = () => {
    if (!form.nome) return;
    if (editId) {
      setFormasPagamento(prev => prev.map(f => f.id === editId ? { ...f, nome: form.nome, tipo: form.tipo } : f));
      toast.success("Forma de pagamento atualizada");
    } else {
      setFormasPagamento(prev => [...prev, { id: Date.now().toString(), nome: form.nome, tipo: form.tipo, ativo: true }]);
      toast.success("Forma de pagamento criada");
    }
    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
  };

  const openEdit = (fp: FormaPagamento) => {
    setEditId(fp.id);
    setForm({ nome: fp.nome, tipo: fp.tipo });
    setOpen(true);
  };

  const isInUse = (id: string) => {
    return lancamentos.some(l => l.formaPagamentoId === id);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    if (isInUse(deleteId)) {
      toast.error("Não é possível excluir: forma de pagamento em uso");
      setDeleteId(null);
      return;
    }
    setFormasPagamento(prev => prev.filter(f => f.id !== deleteId));
    setDeleteId(null);
    toast.success("Forma de pagamento excluída");
  };

  const toggleStatus = (id: string) => {
    setFormasPagamento(prev => prev.map(f => f.id === id ? { ...f, ativo: !f.ativo } : f));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Formas de Pagamento</h2>
          <p className="text-sm text-muted-foreground mt-1">{formasPagamento.length} formas cadastradas</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Forma</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label className="text-xs">Nome</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Pix Banco X" /></div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v: TipoPagamento) => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
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
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formasPagamento.map(fp => (
              <TableRow key={fp.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{tipoIcons[fp.tipo]}</span>
                    <span className="font-medium">{fp.nome}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{tipoLabels[fp.tipo]}</Badge>
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleStatus(fp.id)} className="cursor-pointer">
                    <Badge variant={fp.ativo ? "default" : "secondary"}
                      className={fp.ativo ? "bg-success text-success-foreground" : ""}>
                      {fp.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(fp)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(fp.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
            <AlertDialogTitle>Excluir forma de pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteId && isInUse(deleteId)
                ? "Esta forma de pagamento está em uso e não pode ser excluída."
                : "Esta ação não pode ser desfeita."}
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
