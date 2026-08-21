import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  ClipboardList,
  Scale,
  Package,
  Store,
  Star,
  Plus,
  Search,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/cotacoes", label: "Cotações", icon: ClipboardList },
  { to: "/comparar", label: "Comparar", icon: Scale },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/fornecedores", label: "Fornecedores", icon: Store },
  { to: "/oportunidades", label: "Oportun.", icon: Star },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [termo, setTermo] = useState("");

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!termo.trim()) return;
    navigate({ to: "/busca", search: { q: termo.trim() } });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
          <Link to="/inicio" className="flex shrink-0 items-center gap-2">
            <LogoIga className="size-9 rounded-xl" />
            <span className="hidden text-base font-extrabold tracking-tight sm:block">
              Cotação Rápida
            </span>
          </Link>
          <form onSubmit={buscar} className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Buscar fornecedor, produto, código..."
              className="h-11 rounded-xl pl-9 text-sm"
              aria-label="Pesquisa global"
            />
          </form>
          <Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={sair} aria-label="Sair">
            <LogOut className="size-5" />
          </Button>
        </div>
        <nav className="mx-auto hidden max-w-4xl gap-1 px-4 pb-2 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary",
                pathname.startsWith(item.to) && "bg-secondary text-foreground",
              )}
            >
              {item.label === "Oportun." ? "Oportunidades" : item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-4">{children}</main>

      <Link
        to="/nova"
        className="brand-gradient fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full px-5 py-4 text-sm font-bold text-primary-foreground shadow-[var(--shadow-float)] md:bottom-8"
      >
        <Plus className="size-5" /> Nova Cotação
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-4xl grid-cols-6">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
