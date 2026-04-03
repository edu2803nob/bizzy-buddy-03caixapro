import { useState, useMemo, useRef } from "react";
import { Plus, Search, Pencil, Trash2, PackageMinus, ToggleLeft, ToggleRight, AlertTriangle, Upload, History } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/contexts/StoreContext";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  custo: number;
  categoria: string;
  estoque: number;
  estoqueMinimo: number;
  ativo: boolean;
}

export const initialProdutos: Produto[] = [
  { id: "1", nome: "Camiseta Básica", preco: 59.9, custo: 22, categoria: "Vestuário", estoque: 48, estoqueMinimo: 10, ativo: true },
  { id: "2", nome: "Calça Jeans", preco: 149.9, custo: 65, categoria: "Vestuário", estoque: 23, estoqueMinimo: 10, ativo: true },
  { id: "3", nome: "Tênis Runner", preco: 299.9, custo: 120, categoria: "Calçados", estoque: 12, estoqueMinimo: 5, ativo: true },
  { id: "4", nome: "Boné Snapback", preco: 49.9, custo: 15, categoria: "Acessórios", estoque: 0, estoqueMinimo: 10, ativo: false },
  { id: "5", nome: "Mochila Urban", preco: 189.9, custo: 75, categoria: "Acessórios", estoque: 7, estoqueMinimo: 10, ativo: true },
];

const emptyForm = { nome: "", preco: "", custo: "", categoria: "", estoque: "", estoqueMinimo: "10" };

export default function Produtos() {
  const { produtos, setProdutos, priceHistory, addPriceHistory, currentUser, addAuditLog } = useStore();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEstoque, setFilterEstoque] = useState(searchParams.get("estoque") || "all");
  const [page, setPage] = useState(0);
  const [historyProdutoId, setHistoryProdutoId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const perPage = 20;

  const categorias = useMemo(() => [...new Set(produtos.map(p => p.categoria))], [produtos]);

  const filtered = useMemo(() => {
    return produtos.filter(p => {
      if (search && !p.nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategoria !== "all" && p.categoria !== filterCategoria) return false;
      if (filterStatus === "ativo" && !p.ativo) return false;
      if (filterStatus === "inativo" && p.ativo) return false;
      if (filterEstoque === "sem" && p.estoque !== 0) return false;
      if (filterEstoque === "baixo" && (p.estoque === 0 || p.estoque > p.estoqueMinimo)) return false;
      if (filterEstoque === "normal" && p.estoque <= p.estoqueMinimo) return false;
      return true;
    });
  }, [produtos, search, filterCategoria, filterStatus, filterEstoque]);

  const paginatedData = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);
  const totalProdutos = produtos.length;
  const semEstoque = produtos.filter(p => p.estoque === 0).length;
  const estoqueBaixo = produtos.filter(p => p.estoque > 0 && p.estoque <= p.estoqueMinimo).length;
  const valorTotalEstoque = produtos.reduce((s, p) => s + p.custo * p.estoque, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;

  const handleSave = () => {
    if (!form.nome) return;
    if (editId) {
      const oldProd = produtos.find(p => p.id === editId);
      const newPreco = Number(form.preco) || 0;
      const newCusto = Number(form.custo) || 0;
      if (oldProd && (oldProd.preco !== newPreco || oldProd.custo !== newCusto)) {
        addPriceHistory({
          produtoId: editId, oldPrice: oldProd.preco, newPrice: newPreco,
          oldCost: oldProd.custo, newCost: newCusto,
          changedAt: new Date().toISOString(), changedByUserId: currentUser.id, changedByUserName: currentUser.nome,
        });
      }
      setProdutos(prev => prev.map(p => p.id === editId ? {
        ...p, nome: form.nome, preco: newPreco, custo: newCusto, categoria: form.categoria,
        estoque: Number(form.estoque) || 0, estoqueMinimo: Number(form.estoqueMinimo) || 10,
      } : p));
      addAuditLog({ userId: currentUser.id, userName: currentUser.nome, action: "editar", entity: "produto", entityId: editId, oldValue: oldProd ? { preco: oldProd.preco, custo: oldProd.custo } : null, newValue: { preco: newPreco, custo: newCusto } });
      toast.success("Produto atualizado");
    } else {
      const newId = Date.now().toString();
      setProdutos(prev => [...prev, { id: newId, nome: form.nome, preco: Number(form.preco) || 0, custo: Number(form.custo) || 0, categoria: form.categoria, estoque: Number(form.estoque) || 0, estoqueMinimo: Number(form.estoqueMinimo) || 10, ativo: true }]);
      addAuditLog({ userId: currentUser.id, userName: currentUser.nome, action: "criar", entity: "produto", entityId: newId, oldValue: null, newValue: { nome: form.nome } });
      toast.success("Produto adicionado");
    }
    setForm(emptyForm); setEditId(null); setOpen(false);
  };

  const openEdit = (p: Produto) => {
    setEditId(p.id);
    setForm({ nome: p.nome, preco: String(p.preco), custo: String(p.custo), categoria: p.categoria, estoque: String(p.estoque), estoqueMinimo: String(p.estoqueMinimo) });
    setOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    addAuditLog({ userId: currentUser.id, userName: currentUser.nome, action: "excluir", entity: "produto", entityId: deleteId, oldValue: produtos.find(p => p.id === deleteId) as unknown as Record<string, unknown>, newValue: null });
    setProdutos(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
    toast.success("Produto excluído");
  };

  const handleToggleStatus = (id: string) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p));
    toast.success("Status atualizado");
  };

  const handleAdjustStock = () => {
    if (!adjustId || !adjustQty) return;
    const qty = Number(adjustQty);
    const prod = produtos.find(p => p.id === adjustId);
    addAuditLog({ userId: currentUser.id, userName: currentUser.nome, action: "ajustar_estoque", entity: "produto", entityId: adjustId, oldValue: { estoque: prod?.estoque }, newValue: { ajuste: qty, novoEstoque: Math.max(0, (prod?.estoque || 0) + qty) } });
    setProdutos(prev => prev.map(p => p.id === adjustId ? { ...p, estoque: Math.max(0, p.estoque + qty) } : p));
    toast.success("Estoque ajustado"); setAdjustId(null); setAdjustQty("");
  };

  // CSV Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map(l => l.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
      if (lines.length < 2) { toast.error("Arquivo vazio"); return; }
      setCsvData(lines);
      const errors: string[] = [];
      lines.slice(1).forEach((row, i) => {
        if (row.length < 2) return;
        if (!row[0]) errors.push(`Linha ${i + 2}: nome vazio`);
        if (row[2] && isNaN(Number(row[2]))) errors.push(`Linha ${i + 2}: preço inválido "${row[2]}"`);
        if (row[3] && isNaN(Number(row[3]))) errors.push(`Linha ${i + 2}: custo inválido "${row[3]}"`);
        if (row[4] && isNaN(Number(row[4]))) errors.push(`Linha ${i + 2}: estoque inválido "${row[4]}"`);
      });
      setCsvErrors(errors);
      setImportOpen(true);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const confirmImport = () => {
    const header = csvData[0];
    let imported = 0;
    csvData.slice(1).forEach(row => {
      if (row.length < 2 || !row[0]) return;
      const preco = Number(row[2]) || 0;
      const custo = Number(row[3]) || 0;
      const estoque = parseInt(row[4]) || 0;
      if (isNaN(preco) || isNaN(custo)) return;
      setProdutos(prev => [...prev, {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 4),
        nome: row[0], categoria: row[1] || "Geral", preco, custo,
        estoque, estoqueMinimo: 10, ativo: true,
      }]);
      imported++;
    });
    toast.success(`${imported} produto(s) importado(s)${csvErrors.length > 0 ? `, ${csvErrors.length} linha(s) com erro` : ""}`);
    setImportOpen(false); setCsvData([]); setCsvErrors([]);
  };

  const getStockBadge = (p: Produto) => {
    if (p.estoque === 0) return <Badge variant="destructive" className="text-xs">Sem estoque</Badge>;
    if (p.estoque <= p.estoqueMinimo) return <Badge className="bg-warning text-warning-foreground text-xs">{p.estoque} un.</Badge>;
    return <span className="text-sm tabular-nums">{p.estoque} un.</span>;
  };

  const produtoHistory = priceHistory.filter(h => h.produtoId === historyProdutoId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Produtos</h2>
          <p className="text-sm text-muted-foreground mt-1">Gestão de catálogo e estoque</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" /> Importar CSV</Button>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                {([
                  { key: "nome", label: "Nome *", type: "text" },
                  { key: "preco", label: "Preço de Venda", type: "number" },
                  { key: "custo", label: "Custo", type: "number" },
                  { key: "categoria", label: "Categoria", type: "text" },
                  { key: "estoque", label: "Estoque", type: "number" },
                  { key: "estoqueMinimo", label: "Estoque Mínimo", type: "number" },
                ] as const).map(f => (
                  <div key={f.key}>
                    <Label className="text-xs">{f.label}</Label>
                    <Input type={f.type} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <Button onClick={handleSave} className="mt-2">{editId ? "Atualizar" : "Salvar"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card animate-fade-in-up"><p className="text-sm text-muted-foreground">Total de Produtos</p><p className="text-2xl font-semibold mt-1">{totalProdutos}</p></div>
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "80ms" }}><p className="text-sm text-muted-foreground">Sem Estoque</p><p className="text-2xl font-semibold text-destructive mt-1">{semEstoque}</p></div>
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "160ms" }}><p className="text-sm text-muted-foreground flex items-center gap-1">Estoque Baixo <AlertTriangle className="h-3.5 w-3.5 text-warning" /></p><p className="text-2xl font-semibold text-warning mt-1">{estoqueBaixo}</p></div>
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: "240ms" }}><p className="text-sm text-muted-foreground">Valor em Estoque</p><p className="text-2xl font-semibold mt-1">{fmt(valorTotalEstoque)}</p></div>
      </div>

      {estoqueBaixo > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-warning/40 bg-warning/5 animate-fade-in-up">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm"><span className="font-medium">{estoqueBaixo} produto(s)</span> com estoque baixo. {semEstoque > 0 && <><span className="font-medium text-destructive">{semEstoque}</span> sem estoque.</>}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={filterCategoria} onValueChange={v => { setFilterCategoria(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas categorias</SelectItem>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}>
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ativo">Ativos</SelectItem><SelectItem value="inativo">Inativos</SelectItem></SelectContent>
        </Select>
        <Select value={filterEstoque} onValueChange={v => { setFilterEstoque(v); setPage(0); }}>
          <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Estoque" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todo estoque</SelectItem><SelectItem value="sem">Sem estoque</SelectItem><SelectItem value="baixo">Estoque baixo</SelectItem><SelectItem value="normal">Normal</SelectItem></SelectContent>
        </Select>
      </div>

      <div className="stat-card p-0 overflow-hidden animate-fade-in-up">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Categoria</TableHead>
              <TableHead className="text-right">Preço</TableHead><TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Lucro</TableHead><TableHead className="text-right">Margem</TableHead>
              <TableHead className="text-center">Estoque</TableHead><TableHead className="text-center">Mín.</TableHead>
              <TableHead className="text-center">Status</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum produto encontrado.</TableCell></TableRow>}
            {paginatedData.map(p => {
              const lucro = p.preco - p.custo;
              const margem = p.preco > 0 ? (lucro / p.preco) * 100 : 0;
              return (
                <TableRow key={p.id} className="group">
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{p.categoria}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(p.preco)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(p.custo)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${lucro >= 0 ? "text-success" : "text-destructive"}`}>{fmt(lucro)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${margem >= 30 ? "text-success" : margem >= 15 ? "text-warning" : "text-destructive"}`}>{fmtPct(margem)}</TableCell>
                  <TableCell className="text-center">{getStockBadge(p)}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{p.estoqueMinimo}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={p.ativo ? "default" : "secondary"} className={p.ativo ? "bg-success text-success-foreground" : ""}>{p.ativo ? "Ativo" : "Inativo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Histórico de preços" onClick={() => setHistoryProdutoId(p.id)}><History className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Ajustar estoque" onClick={() => { setAdjustId(p.id); setAdjustQty(""); }}><PackageMinus className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title={p.ativo ? "Inativar" : "Ativar"} onClick={() => handleToggleStatus(p.id)}>
                        {p.ativo ? <ToggleRight className="h-3.5 w-3.5 text-success" /> : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" title="Excluir" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/60">
            <p className="text-xs text-muted-foreground">{filtered.length} produto(s) · Página {page + 1} de {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir produto?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adjust dialog */}
      <Dialog open={!!adjustId} onOpenChange={(o) => { if (!o) { setAdjustId(null); setAdjustQty(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajustar Estoque</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <p className="text-sm text-muted-foreground">Produto: <span className="font-medium text-foreground">{produtos.find(p => p.id === adjustId)?.nome}</span></p>
            <p className="text-sm text-muted-foreground">Estoque atual: <span className="font-medium text-foreground">{produtos.find(p => p.id === adjustId)?.estoque} un.</span></p>
            <div><Label className="text-xs">Quantidade (+ para adicionar, - para remover)</Label><Input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="Ex: 10 ou -5" /></div>
            <Button onClick={handleAdjustStock} className="mt-2">Confirmar Ajuste</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price History dialog */}
      <Dialog open={!!historyProdutoId} onOpenChange={(o) => !o && setHistoryProdutoId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Histórico de Preços — {produtos.find(p => p.id === historyProdutoId)?.nome}</DialogTitle></DialogHeader>
          {produtoHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma alteração de preço registrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Preço Ant.</TableHead>
                  <TableHead className="text-right">Preço Novo</TableHead>
                  <TableHead className="text-right">Custo Ant.</TableHead>
                  <TableHead className="text-right">Custo Novo</TableHead>
                  <TableHead>Alterado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtoHistory.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs">{new Date(h.changedAt).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{fmt(h.oldPrice)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs font-medium">{fmt(h.newPrice)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{fmt(h.oldCost)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs font-medium">{fmt(h.newCost)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{h.changedByUserName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* CSV Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Importar Produtos via CSV</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Formato esperado: nome, categoria, preco, custo, estoque, unidade</p>
            {csvData.length > 0 && (
              <div className="border rounded-lg overflow-auto max-h-48">
                <Table>
                  <TableHeader><TableRow>{csvData[0].map((h, i) => <TableHead key={i} className="text-xs">{h}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {csvData.slice(1, 6).map((row, i) => (
                      <TableRow key={i}>{row.map((c, j) => <TableCell key={j} className="text-xs py-1">{c}</TableCell>)}</TableRow>
                    ))}
                  </TableBody>
                </Table>
                {csvData.length > 6 && <p className="text-xs text-muted-foreground text-center py-2">... e mais {csvData.length - 6} linhas</p>}
              </div>
            )}
            {csvErrors.length > 0 && (
              <div className="border border-destructive/30 rounded-lg p-3 bg-destructive/5 max-h-32 overflow-auto">
                <p className="text-xs font-medium text-destructive mb-1">{csvErrors.length} erro(s) encontrado(s):</p>
                {csvErrors.map((e, i) => <p key={i} className="text-xs text-destructive">{e}</p>)}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(false)} className="flex-1">Cancelar</Button>
              <Button onClick={confirmImport} className="flex-1">Importar Linhas Válidas</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
