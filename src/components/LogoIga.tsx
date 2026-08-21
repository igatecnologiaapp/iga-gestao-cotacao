import logoIga from "@/assets/iga-logo.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Logotipo oficial da IGA Tecnologia.
 * Sempre em contêiner quadrado com object-contain — proporção original preservada.
 */
export function LogoIga({ className }: { className?: string }) {
  return (
    <img
      src={logoIga.url}
      alt="IGA Tecnologia"
      width={512}
      height={512}
      className={cn("aspect-square object-contain", className)}
    />
  );
}
