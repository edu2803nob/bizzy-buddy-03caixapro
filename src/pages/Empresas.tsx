import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
}

const initialEmpresas: Empresa[] = [
  { id: "1", nome: "Loja Centro", cnpj: "12.345.678/0001-90", email: "centro@loja.com", telefone: "(11) 3456-7890" },
  { id: "2", nome: "Filial Norte", cnpj: "98.765.432/0001-10", email: "norte@loja.com", telefone: "(11) 2345-6789" },
];

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>(initialEmpresas);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", cnpj: "", email: "", telefone: "" });

  const handleAdd = () => {
    if (!form.nome) return;
    setEmpresas(prev => [...prev, { ...form, id: Date.now().toString() }]);
    setForm({ nome: "", cnpj: "", email: "", telefone: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Empresas</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerenciamento multi-tenant</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              {(["nome", "cnpj", "email", "telefone"] as const).map(f => (
                <div key={f}>
                  <Label className="text-xs capitalize">{f}</Label>
                  <Input value={form[f]} onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))} />
                </div>
              ))}
              <Button onClick={handleAdd} className="mt-2">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {empresas.map((e, i) => (
          <div key={e.id} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <p className="font-medium text-sm">{e.nome}</p>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>CNPJ: {e.cnpj}</p>
              <p>{e.email}</p>
              <p>{e.telefone}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
