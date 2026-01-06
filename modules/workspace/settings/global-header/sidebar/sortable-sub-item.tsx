"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HeaderItem, SubHeaderItem } from "../context/header-context";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

interface SortableSubItemProps {
  parentItem: HeaderItem;
  subItem: SubHeaderItem;
  onEdit: (parent: HeaderItem, sub: SubHeaderItem) => void;
  onDelete: (parent: HeaderItem, sub: SubHeaderItem) => void;
}

export function SortableSubItem({
  parentItem,
  subItem,
  onEdit,
  onDelete,
}: SortableSubItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subItem.id,
    data: {
      type: "child",
      item: subItem,
      parentId: parentItem.id,
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
      className="flex items-center border rounded-md  h-[34px] overflow-hidden bg-white dark:bg-zinc-700"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground"
      >
        <GripVertical className="h-4 w-4 ml-1" />
      </div>
      <p className="font-normal text-sm flex-1 ml-2">{subItem.name}</p>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(parentItem, subItem)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(parentItem, subItem)}
      >
        <Trash2 className="h-4 w-4 " />
      </Button>
    </div>
  );
}
