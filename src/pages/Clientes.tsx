import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  origem: string;
  observacao: string;
}

const initialClientes: Cliente[] = [
  { id: "1", nome: "Maria Silva", telefone: "(11) 99876-5432", email: "maria@email.com", cpf: "123.456.789-00", origem: "Indicação", observacao: "" },
  { id: "2", nome: "Carlos Souza", telefone: "(21) 98765-4321", email: "carlos@email.com", cpf: "987.654.321-00", origem: "Instagram", observacao: "Cliente VIP" },
  { id: "3", nome: "Ana Oliveira", telefone: "(31) 97654-3210", email: "ana@email.com", cpf: "456.789.123-00", origem: "Google", observacao: "" },
];

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", cpf: "", origem: "", observacao: "" });

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.nome) return;
    setClientes(prev => [...prev, { ...form, id: Date.now().toString() }]);
    setForm({ nome: "", telefone: "", email: "", cpf: "", origem: "", observacao: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-1">{clientes.length} cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              {(["nome", "telefone", "email", "cpf", "origem", "observacao"] as const).map(field => (
                <div key={field}>
                  <Label className="capitalize text-xs">{field}</Label>
                  <Input
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  />
                </div>
              ))}
              <Button onClick={handleAdd} className="mt-2">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="stat-card p-0 overflow-hidden animate-fade-in-up">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">CPF</TableHead>
              <TableHead className="hidden lg:table-cell">Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.telefone}</TableCell>
                <TableCell className="hidden md:table-cell">{c.email}</TableCell>
                <TableCell className="hidden lg:table-cell">{c.cpf}</TableCell>
                <TableCell className="hidden lg:table-cell">{c.origem}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
