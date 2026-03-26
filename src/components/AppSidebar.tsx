import {
  LayoutDashboard, Users, UserCircle, ShoppingCart, Package,
  DollarSign, Wallet, Building2, CreditCard,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useStore } from "@/contexts/StoreContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const allItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, section: "principal", requires: null },
  { title: "Clientes", url: "/clientes", icon: Users, section: "principal", requires: null },
  { title: "Produtos", url: "/produtos", icon: Package, section: "principal", requires: null },
  { title: "PDV", url: "/pdv", icon: ShoppingCart, section: "principal", requires: "pdv" as const },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, section: "financeiro", requires: "financeiro" as const },
  { title: "Fechamento", url: "/fechamento", icon: Wallet, section: "financeiro", requires: "financeiro" as const },
  { title: "Pagamentos", url: "/formas-pagamento", icon: CreditCard, section: "financeiro", requires: "admin" as const },
  { title: "Empresas", url: "/empresas", icon: Building2, section: "admin", requires: "admin" as const },
  { title: "Usuários", url: "/usuarios", icon: UserCircle, section: "admin", requires: "admin" as const },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { currentUser } = useStore();
  const perms = currentUser.permissoes;

  const visibleItems = allItems.filter(item => {
    if (!item.requires) return true;
    if (perms.admin) return true;
    return perms[item.requires];
  });

  const sections = [
    { key: "principal", label: "Principal" },
    { key: "financeiro", label: "Financeiro" },
    { key: "admin", label: "Administração" },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-5">
          {!collapsed ? (
            <h1 className="text-lg font-semibold text-sidebar-accent-foreground tracking-tight">
              ERP<span className="text-sidebar-primary">.</span>sys
            </h1>
          ) : (
            <span className="text-sidebar-primary font-bold text-lg">E</span>
          )}
        </div>

        {sections.map(section => {
          const items = visibleItems.filter(i => i.section === section.key);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={section.key}>
              <SidebarGroupLabel className="text-sidebar-muted text-[11px] uppercase tracking-wider">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end={item.url === "/"} className="hover:bg-sidebar-accent/60" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                          <item.icon className="mr-2 h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
