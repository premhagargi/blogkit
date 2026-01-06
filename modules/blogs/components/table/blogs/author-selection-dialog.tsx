"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface AuthorSelectionViewProps {
  options: Author[];
  loading: boolean;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: () => void;
  onBack: () => void;
}

import { Skeleton } from "@/components/ui/skeleton";
import { SelectionViewHeader } from "./selection-view-header";
import { SelectionViewFooter } from "./selection-footer-props";

export function AuthorSelectionView({
  options,
  loading,
  selectedIds,
  setSelectedIds,
  onSave,
  onBack,
}: AuthorSelectionViewProps) {
  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col">
      <SelectionViewHeader title="Change Author" onBack={onBack} />
      <div className="h-48 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {options.map((author) => (
              <div key={author.id} className="flex items-center gap-2">
                <Checkbox
                  id={`author-${author.id}`}
                  checked={selectedIds.includes(author.id)}
                  onCheckedChange={() => handleToggle(author.id)}
                />
                <label
                  htmlFor={`author-${author.id}`}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={author.image || ""} />
                    <AvatarFallback className="text-xs">
                      {author.name?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{author.name}</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      <SelectionViewFooter
        selectedCount={selectedIds.length}
        onBack={onBack}
        onSave={onSave}
      />
    </div>
  );
}
