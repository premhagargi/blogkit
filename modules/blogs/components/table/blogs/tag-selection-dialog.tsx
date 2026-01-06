"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { SelectionViewHeader } from "./selection-view-header";
import { SelectionViewFooter } from "./selection-footer-props";

interface Tag {
  id: string;
  name: string;
}

interface TagSelectionViewProps {
  options: Tag[];
  loading: boolean;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: () => void;
  onBack: () => void;
}

export function TagSelectionView({
  options,
  loading,
  selectedIds,
  setSelectedIds,
  onSave,
  onBack,
}: TagSelectionViewProps) {
  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col">
      <SelectionViewHeader title="Change Tag" onBack={onBack} />
      <div className="h-48 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {options.map((tag) => (
              <div key={tag.id} className="flex items-center gap-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={selectedIds.includes(tag.id)}
                  onCheckedChange={() => handleToggle(tag.id)}
                />
                <label
                  htmlFor={`tag-${tag.id}`}
                  className="text-normal cursor-pointer"
                >
                  {tag.name}
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
