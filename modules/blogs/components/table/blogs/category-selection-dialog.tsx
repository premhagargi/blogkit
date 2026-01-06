"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { SelectionViewHeader } from "./selection-view-header";
import { SelectionViewFooter } from "./selection-footer-props";

interface Category {
  id: string;
  name: string;
}

interface CategorySelectionViewProps {
  options: Category[];
  loading: boolean;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: () => void;
  onBack: () => void;
}

export function CategorySelectionView({
  options,
  loading,
  selectedIds,
  setSelectedIds,
  onSave,
  onBack,
}: CategorySelectionViewProps) {
  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col">
      <SelectionViewHeader title="Change Category" onBack={onBack} />
      <div className="h-48 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {options.map((category) => (
              <div key={category.id} className="flex items-center gap-1.5">
                <Checkbox
                  id={`cat-${category.id}`}
                  checked={selectedIds.includes(category.id)}
                  onCheckedChange={() => handleToggle(category.id)}
                />
                <label
                  htmlFor={`cat-${category.id}`}
                  className="text-sm cursor-pointer"
                >
                  {category.name}
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
