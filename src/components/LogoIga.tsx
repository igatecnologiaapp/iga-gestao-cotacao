import { cn } from "@/lib/utils";

/**
 * Logotipo oficial da IGA Tecnologia.
 *
 * Portabilidade: o arquivo é versionado em `public/iga-logo.png` e servido pelo
 * próprio build (Lovable ou Docker/VPS). Não depende de rota de assets externa.
 */
export function LogoIga({ className }: { className?: string }) {
  return (
    <img
      src="/iga-logo.png"
      alt="IGA Tecnologia"
      width={297}
      height={297}
      className={cn("aspect-square object-contain", className)}
    />
  );
}
