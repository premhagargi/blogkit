"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormField } from "../context/form-context";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

interface SortableFormFieldProps {
  field: FormField;
  onEdit: (field: FormField) => void;
  onDelete: (field: FormField) => void;
}

export function SortableFormField({
  field,
  onEdit,
  onDelete,
}: SortableFormFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center h-[32px] border rounded-md bg-background"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground p-2"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <p className="font-medium text-sm flex-1 ml-1 truncate">{field.label}</p>

      <span className="text-small px-2 py-0.5 rounded-full mx-2">
        {field.type} {field.isRequired && "*"}
      </span>
      <Button variant="ghost" size="icon" onClick={() => onEdit(field)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(field)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
