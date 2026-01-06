"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FooterLink } from "../context/footer-context";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

interface Props {
  parentColumnId: string;
  link: FooterLink;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableFooterLink({
  parentColumnId,
  link,
  onEdit,
  onDelete,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: link.id,
    data: {
      type: "link",
      item: link,
      parentId: parentColumnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center border rounded-md h-[34px] overflow-hidden bg-white dark:bg-zinc-700"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground"
      >
        <GripVertical className="h-4 w-4 ml-1" />
      </div>
      <p className="font-normal text-sm flex-1 ml-2">{link.name}</p>
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
