import { Star } from "lucide-react";
import { interesseLabel } from "@/lib/cotacao";
import { cn } from "@/lib/utils";

export function InteresseSelect({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Interesse ${interesseLabel(n)}`}
            onClick={() => onChange(n)}
            className="p-1"
          >
            <Star
              className={cn(
                "size-7 transition-colors",
                n <= value ? "fill-accent text-accent" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-semibold text-muted-foreground">{interesseLabel(value)}</span>
    </div>
  );
}

export function InteresseBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
      <Star className="size-3 fill-accent text-accent" />
      {interesseLabel(value)}
    </span>
  );
}
