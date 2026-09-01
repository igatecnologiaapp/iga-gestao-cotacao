import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Smartphone, Scale, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIga } from "@/components/LogoIga";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cotação Rápida — registre preços de fornecedores em campo" },
      {
        name: "description",
        content:
          "App mobile para registrar cotações de fornecedores e produtos em segundos, comparar preços e identificar oportunidades.",
      },
      { property: "og:title", content: "Cotação Rápida" },
      {
        property: "og:description",
        content: "Abrir, cotar, registrar, comparar e decidir — direto do celular.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const RECURSOS = [
  { icon: Zap, titulo: "Cotação em segundos", texto: "Fornecedor, produto, preço e pronto." },
  { icon: Smartphone, titulo: "Feito para o celular", texto: "Botões grandes e poucos toques." },
  { icon: Scale, titulo: "Comparação de preços", texto: "Veja todos os fornecedores do item." },
  { icon: Star, titulo: "Oportunidades", texto: "Marque boas condições para decidir depois." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="brand-gradient px-5 pb-16 pt-14 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <LogoIga className="mx-auto mb-6 w-24 max-w-full rounded-2xl sm:w-28" />
          <span className="inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-widest">
            Pesquisa de mercado em campo
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
            Cotação Rápida
          </h1>
          <p className="mt-4 max-w-xl text-base opacity-90">
            O caderno digital inteligente de cotações. Abrir → cotar → registrar → comparar →
            decidir, tudo pelo celular.
          </p>
          <Button asChild size="lg" className="mt-8 h-14 rounded-xl bg-card px-8 text-base font-bold text-foreground hover:bg-card/90">
            <Link to="/auth">Entrar e começar</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-3xl px-5 pb-16">
        <div className="grid gap-3 sm:grid-cols-2">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="surface p-5">
              <r.icon className="size-6 text-primary" />
              <h2 className="mt-3 text-base font-bold">{r.titulo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{r.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
