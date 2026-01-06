"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { SelectionViewHeader } from "./selection-view-header";

interface StatusSelectionViewProps {
  onPublish: () => void;
  onUnpublish: () => void;
  onBack: () => void;
}

export function StatusSelectionView({
  onPublish,
  onUnpublish,
  onBack,
}: StatusSelectionViewProps) {
  return (
    <div className="flex flex-col">
      <SelectionViewHeader title="Change Status" onBack={onBack} />
      <div className="p-1">
        <Button
          variant="ghost"
          className="w-full text-normal font-normal justify-start h-8 px-2"
          onClick={onPublish}
        >
          <Eye className="mr-2 h-4 w-4" />
          Publish
        </Button>
        <Button
          variant="ghost"
          className="w-full text-normal font-normal justify-start h-8 px-2"
          onClick={onUnpublish}
        >
          <EyeOff className="mr-2 h-4 w-4" />
          Unpublish
        </Button>
      </div>
    </div>
  );
}
