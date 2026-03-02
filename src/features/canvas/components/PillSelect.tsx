import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PillSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  icon?: React.ReactNode;
  tooltip: string;
  label?: string;
  header?: string;
}

export function PillSelect({
  value,
  onChange,
  options,
  icon,
  tooltip,
  label,
  header,
}: PillSelectProps) {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="inline-flex shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/40 bg-secondary/20 px-3.5 text-xs font-bold uppercase tracking-tight text-foreground/70 shadow-none transition-all hover:bg-secondary/40 hover:text-foreground focus:outline-none"
            title={tooltip}
          >
            {icon || selectedOption?.icon}
            <span className="max-w-[100px] truncate">
              {label || selectedOption?.label || value}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[160px] border-border/40 bg-background/80 p-2 text-popover-foreground backdrop-blur-xl"
        >
          {header && (
            <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground/40">
              {header}
            </div>
          )}
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold uppercase tracking-tight hover:bg-secondary/60 focus:bg-secondary/60"
            >
              {opt.icon}
              <span className="flex-1">{opt.label}</span>
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
