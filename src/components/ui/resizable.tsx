"use client"

import * as React from "react"
import { GripVerticalIcon } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/utils/cn"

const ResizablePanelGroup = ({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group> & {
  orientation?: "horizontal" | "vertical"
}) => (
  <ResizablePrimitive.Group
    orientation={orientation}
    className={cn(
      "flex h-full w-full",
      orientation === "vertical" ? "flex-col" : "flex-row",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) => (
  <ResizablePrimitive.Panel {...props} />
)

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.Separator
    className={cn(
      "relative flex items-center justify-center bg-border/40 transition-all hover:bg-primary/30 active:bg-primary/50 z-50",
      // In version 4.7.2, orientation horizontal means it moves horizontally (vertical bar).
      "aria-[orientation=vertical]:w-px hover:aria-[orientation=vertical]:w-2 aria-[orientation=vertical]:h-full aria-[orientation=vertical]:cursor-col-resize",
      // orientation vertical means it moves vertically (horizontal bar).
      "aria-[orientation=horizontal]:h-px hover:aria-[orientation=horizontal]:h-2 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border shadow-sm">
        <GripVerticalIcon className="size-2.5 opacity-50" />
      </div>
    )}
  </ResizablePrimitive.Separator>
)

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
