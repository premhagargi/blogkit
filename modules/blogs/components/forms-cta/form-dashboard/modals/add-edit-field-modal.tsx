"use client";
import { useContext, useState, useEffect, KeyboardEvent, useMemo } from "react";
import { FormContext, FormField, FieldType } from "../context/form-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, PlusCircle, GripVertical } from "lucide-react";
import { produce } from "immer";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Draggable Option Item Component ---
interface SortableOptionProps {
  id: string;
  option: string;
  index: number;
  onUpdate: (index: number, value: string) => void;
  onDelete: (index: number) => void;
}

function SortableOptionItem({
  id,
  option,
  index,
  onUpdate,
  onDelete,
}: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center h-[32px] border rounded-md bg-background"
    >
      <div {...attributes} {...listeners} className="cursor-grab p-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        value={option}
        onChange={(e) => onUpdate(index, e.target.value)}
        className="flex-1 !border-none !shadow-none !ring-0 !outline-none focus:!outline-none focus:!border-none focus:!ring-0"
      />
      <Button variant="ghost" size="icon" onClick={() => onDelete(index)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// --- Main Modal Component ---
interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  field: FormField | null;
}

const defaultState: Omit<FormField, "id" | "order"> = {
  label: "",
  type: "ShortText",
  placeholder: "",
  isRequired: false,
  options: [],
};

export default function AddEditFieldModal({ isOpen, setIsOpen, field }: Props) {
  const { addField, updateFormField } = useContext(FormContext);
  const [formState, setFormState] = useState(defaultState);
  const [newOption, setNewOption] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const optionIds = useMemo(
    () => formState.options?.map((_, index) => `option-${index}`) || [],
    [formState.options]
  );

  useEffect(() => {
    if (field) {
      setFormState({
        label: field.label,
        type: field.type,
        placeholder: field.placeholder || "",
        isRequired: field.isRequired,
        options: field.options || [],
      });
    } else {
      setFormState(defaultState);
    }
  }, [field, isOpen]);

  const handleSave = () => {
    if (field) {
      updateFormField({ ...field, ...formState });
    } else {
      addField(formState);
    }
    setIsOpen(false);
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setFormState(
        produce((draft) => {
          draft.options = [...(draft.options || []), newOption.trim()];
        })
      );
      setNewOption("");
    }
  };

  const handleUpdateOption = (index: number, value: string) => {
    setFormState(
      produce((draft) => {
        if (draft.options) {
          draft.options[index] = value;
        }
      })
    );
  };

  const handleDeleteOption = (index: number) => {
    setFormState(
      produce((draft) => {
        draft.options?.splice(index, 1);
      })
    );
  };

  const handleOptionKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddOption();
    }
  };

  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = optionIds.indexOf(active.id as string);
      const newIndex = optionIds.indexOf(over.id as string);
      setFormState(
        produce((draft) => {
          if (draft.options) {
            draft.options = arrayMove(draft.options, oldIndex, newIndex);
          }
        })
      );
    }
  };

  const showOptionsEditor =
    formState.type === "Select" || formState.type === "MultiSelect";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{field ? "Edit" : "Add"} Field</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select
              value={formState.type}
              onValueChange={(v: FieldType) =>
                setFormState((p) => ({ ...p, type: v, options: [] }))
              }
            >
              <SelectTrigger className="col-span-3 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Email">Email</SelectItem>
                {/* <SelectItem value="Password">Password</SelectItem> */}
                <SelectItem value="ShortText">Short Text</SelectItem>
                <SelectItem value="LongText">Long Text</SelectItem>
                <SelectItem value="Phone">Phone</SelectItem>
                <SelectItem value="Country">Country</SelectItem>
                <SelectItem value="Select">Select</SelectItem>
                <SelectItem value="MultiSelect">Multi Select</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="label" className="text-right">
              Label
            </Label>
            <Input
              id="label"
              value={formState.label}
              onChange={(e) =>
                setFormState((p) => ({ ...p, label: e.target.value }))
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="placeholder" className="text-right">
              Placeholder
            </Label>
            <Input
              id="placeholder"
              value={formState.placeholder}
              onChange={(e) =>
                setFormState((p) => ({ ...p, placeholder: e.target.value }))
              }
              className="col-span-3"
            />
          </div>

          {showOptionsEditor && (
            <div className="flex flex-col ">
              <Label className="text-right pt-2">Options</Label>
              <>
                {formState.options.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleOptionDragEnd}
                  >
                    <SortableContext
                      items={optionIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 mt-2">
                        {formState.options?.map((opt, index) => (
                          <SortableOptionItem
                            key={optionIds[index]}
                            id={optionIds[index]}
                            option={opt}
                            index={index}
                            onUpdate={handleUpdateOption}
                            onDelete={handleDeleteOption}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Input
                    placeholder="Add new option"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={handleOptionKeyDown}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddOption}
                    disabled={!newOption.trim()}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="required" className="text-right">
              Required
            </Label>
            <div className="col-span-3 flex items-center">
              <Checkbox
                id="required"
                checked={formState.isRequired}
                onCheckedChange={(c) =>
                  setFormState((p) => ({ ...p, isRequired: !!c }))
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
