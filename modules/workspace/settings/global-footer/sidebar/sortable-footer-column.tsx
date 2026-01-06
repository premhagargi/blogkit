"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FooterContext,
  FooterColumn,
  FooterLink,
} from "../context/footer-context";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2, PlusCircle } from "lucide-react";
import { useContext, useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableFooterLink } from "./sortable-footer-link";
import AddEditLinkModal from "../modals/add-edit-link-modal";
import { ConfirmationDialog } from "@/components/models/confirmation-dialog";

interface Props {
  column: FooterColumn;
  onEditColumn: () => void;
  onDeleteColumn: () => void;
}

export function SortableFooterColumn({
  column,
  onEditColumn,
  onDeleteColumn,
}: Props) {
  const { footerColumns, setFooterColumns } = useContext(FooterContext);
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [confirmDeleteLink, setConfirmDeleteLink] = useState<FooterLink | null>(
    null
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", item: column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
    zIndex: isDragging ? 10 : "auto",
  };

  const handleSaveLink = (linkData: Omit<FooterLink, "id" | "order">) => {
    const parentColumn = footerColumns.find((c) => c.id === column.id);
    if (!parentColumn) return;

    let updatedLinks: FooterLink[];

    if (editingLink) {
      updatedLinks = parentColumn.links.map((l) =>
        l.id === editingLink.id ? { ...editingLink, ...linkData } : l
      );
    } else {
      const newLink: FooterLink = {
        ...linkData,
        id: Date.now().toString(),
        order: parentColumn.links.length,
      };
      updatedLinks = [...parentColumn.links, newLink];
    }

    const updatedColumns = footerColumns.map((c) =>
      c.id === column.id ? { ...c, links: updatedLinks } : c
    );
    setFooterColumns(updatedColumns);
    setEditingLink(null);
  };

  const handleDeleteLink = (link: FooterLink) => {
    setConfirmDeleteLink(link);
  };

  const confirmDeleteAction = () => {
    if (!confirmDeleteLink) return;
    const updatedLinks = column.links.filter(
      (l) => l.id !== confirmDeleteLink.id
    );
    const updatedColumns = footerColumns.map((c) =>
      c.id === column.id ? { ...c, links: updatedLinks } : c
    );
    setFooterColumns(updatedColumns);
    setConfirmDeleteLink(null);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-2 pl-1 space-y-2"
    >
      <div className="flex items-center h-[34px] overflow-hidden">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground"
        >
          <GripVertical className="h-4 w-4 ml-1" />
        </div>
        <p className="font-medium text-normal flex-1 ml-2">{column.title}</p>
        <span className="text-small bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
          List
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setEditingLink(null);
            setLinkModalOpen(true);
          }}
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onEditColumn}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDeleteColumn}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="ml-4 space-y-2">
        <SortableContext
          items={column.links.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.links.map((link) => (
            <SortableFooterLink
              key={link.id}
              parentColumnId={column.id}
              link={link}
              onEdit={() => {
                setEditingLink(link);
                setLinkModalOpen(true);
              }}
              onDelete={() => handleDeleteLink(link)}
            />
          ))}
        </SortableContext>
      </div>

      {isLinkModalOpen && (
        <AddEditLinkModal
          isOpen={isLinkModalOpen}
          setIsOpen={setLinkModalOpen}
          onSave={handleSaveLink}
          link={editingLink}
        />
      )}

      {confirmDeleteLink && (
        <ConfirmationDialog
          open={!!confirmDeleteLink}
          onOpenChange={() => setConfirmDeleteLink(null)}
          title="Delete Link?"
          description={`Are you sure you want to delete "${confirmDeleteLink.name}"?`}
          onConfirm={confirmDeleteAction}
          theme="danger"
          confirmButtonLabel="Delete"
        />
      )}
    </div>
  );
}
