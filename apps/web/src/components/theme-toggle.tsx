"use client";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

const noop = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return (
    <div role="radiogroup" aria-label="Colour theme" className={cn("inline-flex rounded-full border border-border p-1", className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button key={value} type="button" role="radio" aria-checked={active} aria-label={label} title={label} onClick={() => setTheme(value)}
            className={cn("grid size-8 place-items-center rounded-full text-muted-foreground transition-colors duration-[120ms]", active && "bg-muted text-foreground")}>
            <Icon className="size-4" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
