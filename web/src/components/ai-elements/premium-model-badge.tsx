"use client";

import { IoDiamondOutline } from "react-icons/io5";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../../lib/utils";

export function PremiumModelBadge({
  className,
  tooltip = "Pro model",
}: {
  className?: string;
  tooltip?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center text-muted-foreground/80",
            className
          )}
        >
          <IoDiamondOutline className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
