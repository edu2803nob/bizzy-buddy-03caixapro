import { useState, useMemo } from "react";
import { Download, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";

export default function AuditoriaPage() {
  const { auditLogs, usuarios } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [page, setPage] = useState(0);
  const perPage = 20;

  const actions = useMemo(() => [...new Set(auditLogs.map(l => l.action))], [auditLogs]);
  const entities = useMemo(() => [...new Set(auditLogs.map(l => l.entity))], [auditLogs]);

  const filtered = useMemo(() => {
    return auditLogs.filter(l => {
      if (filterUser !== "all" && l.userId !== filterUser) return false;
      if (filterAction !== "all" && l.action !== filterAction) return false;
      if (filterEntity !== "all" && l.entity !== filterEntity) return false;
      return true;
    });
  }, [auditLogs, filterUser, filterAction, filterEntity]);

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("Sem dados"); return; }
    const header = "Data/Hora,Usuário,Ação,Entidade,ID Entidade\n";
    const rows = filtered.map(l => `"${l.timestamp}","${l.userName}","${l.action}","${l.entity}","${l.entityId}"`).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `auditoria_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    toast.success("CSV exportado");
  };

  const actionColor = (a: string) => {
    if (a.includes("criar") || a.includes("receber")) return "bg-success/10 text-success";
    if (a.includes("excluir") || a.includes("cancelar")) return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Auditoria</h2>
            <p className="text-sm text-muted-foreground mt-1">Registro de todas as ações do sistema</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterUser} onValueChange={v => { setFilterUser(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Usuário" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos usuários</SelectItem>
            {usuarios.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={v => { setFilterAction(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas ações</SelectItem>
            {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterEntity} onValueChange={v => { setFilterEntity(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Entidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas entidades</SelectItem>
            {entities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs">{filtered.length} registros</Badge>
      </div>

      <div className="stat-card p-0 overflow-hidden animate-fade-in-up">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro de auditoria</TableCell></TableRow>}
            {paginated.map(l => (
              <>
                <TableRow key={l.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setExpandedId(prev => prev === l.id ? null : l.id)}>
                  <TableCell>
                    {expandedId === l.id ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{new Date(l.timestamp).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="font-medium text-sm">{l.userName}</TableCell>
                  <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${actionColor(l.action)}`}>{l.action}</span></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{l.entity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{l.entityId.slice(-6)}</TableCell>
                </TableRow>
                {expandedId === l.id && (
                  <TableRow key={l.id + "-detail"}>
                    <TableCell colSpan={6} className="bg-muted/20 p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Valor Anterior</p>
                          <pre className="text-xs bg-muted/40 rounded p-2 overflow-auto max-h-32">{l.oldValue ? JSON.stringify(l.oldValue, null, 2) : "—"}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Novo Valor</p>
                          <pre className="text-xs bg-muted/40 rounded p-2 overflow-auto max-h-32">{l.newValue ? JSON.stringify(l.newValue, null, 2) : "—"}</pre>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/60">
            <p className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
