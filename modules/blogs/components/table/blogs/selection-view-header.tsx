import { Button } from "@/components/ui/button";
import { ArrowLeftFromLine, ArrowLeftIcon } from "lucide-react";

interface SelectionViewProps {
  title: string;
  onBack: () => void;
}

export const SelectionViewHeader = ({ title, onBack }: SelectionViewProps) => (
  <div className="flex items-center gap-2 p-1 border-b sticky top-0 bg-white z-10">
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
      <ArrowLeftIcon className="h-4 w-4" />
    </Button>
    <h3 className="text-normal-muted font-semibold">{title}</h3>
  </div>
);
