"use client";

import { Button } from "@/components/ui/button";
import type { DriveSort, DriveViewMode } from "@/lib/types";

interface DriveToolbarProps {
  searchInput: string;
  sort: DriveSort;
  viewMode: DriveViewMode;
  onSearchInputChange: (val: string) => void;
  onSortChange: () => void;
  onViewModeChange: (mode: DriveViewMode) => void;
}

export default function DriveToolbar({
  searchInput,
  sort,
  viewMode,
  onSearchInputChange,
  onSortChange,
  onViewModeChange,
}: DriveToolbarProps) {
  return (
    <div className="mt-5 flex items-center gap-3" suppressHydrationWarning>
      <div className="flex h-[42px] flex-1 items-center gap-3 rounded-pill border border-border bg-sidebar px-3">
        <span className="text-[15px] text-text-secondary">⌕</span>
        <input value={searchInput} onChange={(e) => onSearchInputChange(e.target.value)}
          placeholder="Search files, folders or people"
          className="h-full flex-1 bg-transparent text-[12px] text-text-primary outline-none placeholder:text-text-placeholder" />
      </div>
      <Button variant="outline" onClick={onSortChange}
        className="h-[42px] w-[112px] text-[11px] font-medium">
        Sort: {sort === "recent" ? "Recent" : sort === "name" ? "Name" : "Size"}
      </Button>
      <Button variant={viewMode === "grid" ? "secondary" : "outline"} size="icon"
        onClick={() => onViewModeChange("grid")}
        className="h-[42px] w-[42px] rounded-pill text-[15px] font-semibold">
        ▦
      </Button>
      <Button variant={viewMode === "list" ? "secondary" : "outline"} size="icon"
        onClick={() => onViewModeChange("list")}
        className="h-[42px] w-[42px] rounded-pill text-[15px] font-semibold">
        ☷
      </Button>
    </div>
  );
}
