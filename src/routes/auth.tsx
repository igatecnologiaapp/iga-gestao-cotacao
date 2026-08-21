import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    ...(typeof search["redirect"] === "string" ? { redirect: search["redirect"] as string } : {}),
  }),

  head: () => ({
    meta: [
      { title: "Entrar — Cotação Rápida" },
      { name: "description", content: "Acesse sua conta para registrar e comparar cotações." },
      { property: "og:title", content: "Entrar — Cotação Rápida" },
      { property: "og:description", content: "Acesse sua conta do app de cotações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const destino = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/inicio";
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: destino, replace: true });
    });
  }, [destino, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || senha.length < 6) {
      toast.error("Informe e-mail válido e senha com ao menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) throw error;
        navigate({ to: destino, replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) navigate({ to: destino, replace: true });
        else toast.success("Conta criada! Confirme o e-mail enviado para entrar.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setCarregando(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: destino, replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {/* Espaço reservado para a logomarca da IGA Tecnologia (substituir por <img src={logo} .../>). */}
          <span
            aria-label="IGA Tecnologia"
            className="brand-gradient mx-auto flex size-16 items-center justify-center rounded-2xl text-xl font-extrabold tracking-tight text-primary-foreground"
          >
            IGA
          </span>
          <h1 className="mt-4 text-2xl font-extrabold">Entre para Cotar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {modo === "entrar"
              ? "IGA Tecnologia — Cotação Rápida"
              : "Crie sua conta em segundos e comece a cotar."}
          </p>
        </div>

        <div className="surface p-5">
          <form onSubmit={enviar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                className="h-12"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                maxLength={72}
              />
            </div>
            <Button type="submit" disabled={carregando} className="h-12 w-full text-base font-bold">
              {modo === "entrar" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="h-12 w-full text-base font-semibold" onClick={google}>
            Continuar com Google
          </Button>

          <button
            type="button"
            className="mt-4 w-full text-center text-sm font-semibold text-primary"
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          >
            {modo === "entrar" ? "Não tenho conta — criar agora" : "Já tenho conta — entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
