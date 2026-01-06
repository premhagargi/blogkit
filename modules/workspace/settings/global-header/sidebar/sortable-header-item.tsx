"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  HeaderContext,
  HeaderItem,
  SubHeaderItem,
} from "../context/header-context";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Pencil,
  Trash2,
  ListPlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PlusCircle,
} from "lucide-react";
import { useContext } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSubItem } from "./sortable-sub-item";

interface SortableHeaderItemProps {
  item: HeaderItem;
  onEdit: (item: HeaderItem) => void;
  onDelete: (item: HeaderItem) => void;
  onAddSubItem: (item: HeaderItem) => void;
  onEditSubItem: (parent: HeaderItem, sub: SubHeaderItem) => void;
  onDeleteSubItem: (parent: HeaderItem, sub: SubHeaderItem) => void;
}

export function SortableHeaderItem({
  item,
  onEdit,
  onDelete,
  onAddSubItem,
  onEditSubItem,
  onDeleteSubItem,
}: SortableHeaderItemProps) {
  const { toggleAlignment } = useContext(HeaderContext);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "parent",
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-zinc-50 dark:bg-zinc-800 rounded-md "
    >
      <div className="flex items-center h-[34px] overflow-hidden border rounded-md">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground"
        >
          <GripVertical className="h-4 w-4 ml-1" />
        </div>
        <p className="font-medium text-normal flex-1 ml-2">{item.name}</p>
        <span className="text-small bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
          {item.type}
        </span>

        {item.type === "List" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddSubItem(item)}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleAlignment(item.id)}
        >
          {item.alignment === "left" && <AlignLeft className="h-4 w-4" />}
          {item.alignment === "center" && <AlignCenter className="h-4 w-4" />}
          {item.alignment === "right" && <AlignRight className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(item)}>
          <Trash2 className="h-4 w-4 " />
        </Button>
      </div>

      {/* Nested Sortable List for Children */}
      {item.type === "List" && item.children && item.children.length > 0 && (
        <div className="ml-4 mt-2 space-y-2">
          <SortableContext
            items={item.children.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {item.children
              .sort((a, b) => a.order - b.order)
              .map((child) => (
                <SortableSubItem
                  key={child.id}
                  parentItem={item}
                  subItem={child}
                  onEdit={onEditSubItem}
                  onDelete={onDeleteSubItem}
                />
              ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
