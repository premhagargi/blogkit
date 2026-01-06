"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlogPostSort } from "@/modules/blogs/actions/blog-table-actions";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";

interface BlogTableSortButtonProps {
  sortConfig: BlogPostSort;
  onSort: (field: BlogPostSort["field"]) => void;
}

const sortLabels: Record<BlogPostSort["field"], string> = {
  createdAt: "Recent on top",
  updatedAt: "Modified on top",
  publishedAt: "Published on top",
  title: "Title A-Z",
  status: "Status",
  views: "Most viewed",
};

export function BlogTableSortButton({
  sortConfig,
  onSort,
}: BlogTableSortButtonProps) {
  const currentLabel = sortLabels[sortConfig.field] || "Sort";
  const DirectionIcon = sortConfig.direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <DropdownMenu>
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg gap-2 px-3 border"
        >
          <span>{currentLabel}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(sortLabels).map(([field, label]) => (
          <DropdownMenuItem
            key={field}
            onClick={() => onSort(field as BlogPostSort["field"])}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{label}</span>
            {sortConfig.field === field &&
              (sortConfig.direction === "asc" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              ))}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
