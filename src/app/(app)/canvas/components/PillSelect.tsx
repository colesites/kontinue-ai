"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PillSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
  tooltip: string;
  label?: string;
}

export function PillSelect({
  value,
  onChange,
  options,
  icon,
  tooltip,
  label,
}: PillSelectProps) {
  return (
    <div className="inline-flex shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-auto items-center gap-1.5 rounded-full border border-border/40 bg-secondary/40 px-3.5 py-2 text-xs font-bold uppercase tracking-tight text-foreground/70 shadow-none transition-all hover:bg-secondary hover:text-foreground focus:outline-none"
            title={tooltip}
          >
            {icon}
            <span className="max-w-[100px] truncate">
              {label || options.find((o) => o.value === value)?.label || value}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[140px] border-border/40 bg-popover p-1 text-popover-foreground"
        >
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-foreground"
            >
              {opt.label}
              {value === opt.value && (
                <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
