import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { StoreProvider } from "@/contexts/StoreContext";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import PDV from "./pages/PDV";
import Financeiro from "./pages/Financeiro";
import Fechamento from "./pages/Fechamento";
import Empresas from "./pages/Empresas";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LayoutPage({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LayoutPage><Dashboard /></LayoutPage>} />
            <Route path="/clientes" element={<LayoutPage><Clientes /></LayoutPage>} />
            <Route path="/produtos" element={<LayoutPage><Produtos /></LayoutPage>} />
            <Route path="/pdv" element={<LayoutPage><PDV /></LayoutPage>} />
            <Route path="/financeiro" element={<LayoutPage><Financeiro /></LayoutPage>} />
            <Route path="/fechamento" element={<LayoutPage><Fechamento /></LayoutPage>} />
            <Route path="/empresas" element={<LayoutPage><Empresas /></LayoutPage>} />
            <Route path="/usuarios" element={<LayoutPage><Usuarios /></LayoutPage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
export default App;
