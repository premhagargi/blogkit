"use client";
import { useContext, useState, useRef, useMemo } from "react";
import {
  HeaderContext,
  HeaderItem,
  ThemeType,
  SubHeaderItem,
} from "../context/header-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, ImageIcon } from "lucide-react";
import AddEditItemModal from "../modals/add-edit-item-modal";
import AddListItemModal from "../modals/add-list-ltem-modal";
import { ConfirmationDialog } from "@/components/models/confirmation-dialog";
import { SortableHeaderItem } from "./sortable-header-item"; // Adjust path as needed

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Separator } from "@/components/ui/separator";
import { BrandContext } from "@/providers/brand-provider";

export default function HeaderItems() {
  const {
    headerItems,
    setHeaderItems,
    deleteItem,
    deleteSubItem,
    logoUrls,
    setLogoUrl,
    logoUrl,
    setLogoUrlLink,
    setTheme,
    theme,
  } = useContext(HeaderContext);

  const { darkModeEnabled } = useContext(BrandContext);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HeaderItem | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [parentItem, setParentItem] = useState<HeaderItem | null>(null);
  const [editingSubItem, setEditingSubItem] = useState<SubHeaderItem | null>(
    null
  );

  // Confirmation Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Memoize item IDs for SortableContext
  const parentItemIds = useMemo(
    () => headerItems.map((item) => item.id),
    [headerItems]
  );

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(theme, reader.result as string);
      reader.readAsDataURL(files[0]);
    }
  };

  // --- Modal Handlers ---
  const handleEdit = (item: HeaderItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };
  const handleAddNew = () => {
    setEditingItem(null);
    setIsEditModalOpen(true);
  };
  const handleAddSubItem = (pItem: HeaderItem) => {
    setParentItem(pItem);
    setEditingSubItem(null);
    setIsListModalOpen(true);
  };
  const handleEditSubItem = (pItem: HeaderItem, subItem: SubHeaderItem) => {
    setParentItem(pItem);
    setEditingSubItem(subItem);
    setIsListModalOpen(true);
  };

  // --- Delete Handlers ---
  const handleDeleteItem = (item: HeaderItem) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Header Item?",
      description: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      onConfirm: () => deleteItem(item.id),
    });
  };

  const handleDeleteSubItem = (parent: HeaderItem, sub: SubHeaderItem) => {
    setConfirmState({
      isOpen: true,
      title: "Delete List Item?",
      description: `Are you sure you want to delete "${sub.name}"?`,
      onConfirm: () => deleteSubItem(parent.id, sub.id),
    });
  };

  // --- Drag and Drop Handler ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Scenario 1: Reordering Parent Items
    if (activeData?.type === "parent" && overData?.type === "parent") {
      const oldIndex = headerItems.findIndex((item) => item.id === active.id);
      const newIndex = headerItems.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(headerItems, oldIndex, newIndex);
      setHeaderItems(
        reordered.map((item, index) => ({ ...item, order: index }))
      );
    }

    // Scenario 2: Reordering Child Items within the same Parent
    if (
      activeData?.type === "child" &&
      overData?.type === "child" &&
      activeData.parentId === overData.parentId
    ) {
      const parentId = activeData.parentId;
      const parent = headerItems.find((item) => item.id === parentId);
      if (!parent || !parent.children) return;

      const oldIndex = parent.children.findIndex(
        (child) => child.id === active.id
      );
      const newIndex = parent.children.findIndex(
        (child) => child.id === over.id
      );

      const reorderedChildren = arrayMove(parent.children, oldIndex, newIndex);

      const updatedItems = headerItems.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            children: reorderedChildren.map((child, index) => ({
              ...child,
              order: index,
            })),
          };
        }
        return item;
      });
      setHeaderItems(updatedItems);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4">
        {/* Logo Section */}
        <Card className=" bg-transparent border-none shadow-none p-0">
          <CardContent className="space-y-4 p-0">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-normal">Logo</CardTitle>
                {darkModeEnabled && (
                  <Select
                    value={theme}
                    onValueChange={(v: ThemeType) => setTheme(v)}
                  >
                    <SelectTrigger className="w-fit">
                      <SelectValue placeholder="Select Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button
                  variant="link"
                  className="!p-0 h-auto text-small"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className=" h-3 w-3" /> Upload
                </Button>
              </div>
              <div
                className="w-52 ml-2 h-28 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    // Create FileList from dropped file
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    handleFileChange(dt.files); // stays consistent with your FileList type
                  }
                }}
              >
                {logoUrls[theme] ? (
                  <img
                    src={logoUrls[theme]}
                    alt={`${theme} logo`}
                    className="max-h-24 object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-500 text-small">
                    <ImageIcon className="h-8 w-8 mb-1" />
                    Upload Image
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label
                htmlFor="logoUrl"
                className="text-normal font-normal whitespace-nowrap"
              >
                Logo URL
              </label>
              <Input
                id="logoUrl"
                placeholder="Enter URL for logo link"
                value={logoUrl}
                onChange={(e) => setLogoUrlLink(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Separator className="my-4" />

        {/* Header Items Section */}
        <Card className=" bg-transparent border-none shadow-none p-0 gap-4">
          <CardHeader className="flex flex-row items-center justify-between p-0">
            <CardTitle className="text-normal font-medium">
              Header Items
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2">
              <SortableContext
                items={parentItemIds}
                strategy={verticalListSortingStrategy}
              >
                {headerItems
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <SortableHeaderItem
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDeleteItem}
                      onAddSubItem={handleAddSubItem}
                      onEditSubItem={handleEditSubItem}
                      onDeleteSubItem={handleDeleteSubItem}
                    />
                  ))}
              </SortableContext>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        {isEditModalOpen && (
          <AddEditItemModal
            isOpen={isEditModalOpen}
            setIsOpen={setIsEditModalOpen}
            item={editingItem}
          />
        )}
        {isListModalOpen && parentItem && (
          <AddListItemModal
            isOpen={isListModalOpen}
            setIsOpen={setIsListModalOpen}
            parentItem={parentItem}
            editingSubItem={editingSubItem}
          />
        )}
        {confirmState?.isOpen && (
          <ConfirmationDialog
            open={confirmState.isOpen}
            onOpenChange={(open) => !open && setConfirmState(null)}
            title={confirmState.title}
            description={confirmState.description}
            onConfirm={() => {
              confirmState.onConfirm();
              setConfirmState(null);
            }}
            theme="danger"
            confirmButtonLabel="Delete"
          />
        )}
      </div>
    </DndContext>
  );
}
