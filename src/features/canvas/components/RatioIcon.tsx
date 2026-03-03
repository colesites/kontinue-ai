import { cn } from "@/lib/utils";

interface RatioIconProps {
  ratio: string;
  className?: string;
}

export function RatioIcon({ ratio, className }: RatioIconProps) {
  return (
    <div className="flex h-5 w-5 items-center justify-center">
      <div
        className={cn(
          "rounded-[2px] border border-current opacity-60",
          ratio === "1:1" && "h-3 w-3",
          ratio === "16:9" && "h-2 w-[14px]",
          ratio === "9:16" && "h-[14px] w-2",
          ratio === "3:2" && "h-[10px] w-[15px]",
          ratio === "4:3" && "h-[11px] w-[14px]",
          className,
        )}
      />
    </div>
  );
}
