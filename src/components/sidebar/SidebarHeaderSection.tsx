import Link from "next/link";
import {
  MessageSquarePlus,
  Search as SearchIcon,
  X,
  Presentation,
} from "lucide-react";
import {
  SidebarHeader,
  SidebarInput,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type SidebarHeaderSectionProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onClearSearch: () => void;
  onNavigate: () => void;
};

export function SidebarHeaderSection({
  searchQuery,
  onSearchQueryChange,
  onClearSearch,
  onNavigate,
}: SidebarHeaderSectionProps) {
  return (
    <SidebarHeader className="border-b border-sidebar-border/60 p-4 pb-5">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger
            aria-label="Close sidebar"
            className="h-8 w-8 border border-sidebar-border/60 text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
          />
          <div>
            <p className="text-base font-semibold tracking-tight">Kontinue AI</p>
          </div>
        </div>
        <Link
          href="/"
          onClick={onNavigate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <MessageSquarePlus size={18} />
          <span>New Chat</span>
        </Link>
        <Link
          href="/slides"
          onClick={onNavigate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 px-4 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/40"
        >
          <Presentation size={18} />
          <span>Docs to Slides</span>
        </Link>
        <div className="relative">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/60"
          />
          <SidebarInput
            id="sidebar-thread-search"
            placeholder="Search your threads..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="bg-sidebar-accent/30 pl-9 pr-9 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 transition-all focus:bg-sidebar-accent/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground/80"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </SidebarHeader>
  );
}
