import { Button } from "@/components/ui/button";

interface SelectionFooterProps {
  selectedCount: number;
  onBack: () => void;
  onSave: () => void;
}

export const SelectionViewFooter = ({
  selectedCount,
  onBack,
  onSave,
}: SelectionFooterProps) => (
  <div className="flex justify-between items-center p-2 border-t sticky bottom-0 bg-white z-10">
    <div className="text-xs text-muted-foreground">
      {selectedCount} selected
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={onBack}>
        Cancel
      </Button>
      <Button size="sm" onClick={onSave} disabled={selectedCount === 0}>
        Save
      </Button>
    </div>
  </div>
);
