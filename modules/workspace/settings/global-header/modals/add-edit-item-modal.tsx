"use client";
import { useContext, useState, useEffect } from "react";
import {
  HeaderContext,
  HeaderItem,
  ItemType,
  Alignment,
  ButtonStyle,
} from "../context/header-context";
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
import { Switch } from "@/components/ui/switch";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  item: HeaderItem | null;
}

const defaultState = {
  name: "",
  type: "Link" as ItemType,
  link: "",
  alignment: "left" as Alignment,
  buttonStyle: "solid" as ButtonStyle,
  textColor: "#000000",
  buttonColor: "#000000",
  openInNewTab: false,
};

export default function AddEditItemModal({ isOpen, setIsOpen, item }: Props) {
  const { addItem, updateItem } = useContext(HeaderContext);
  const [formState, setFormState] = useState(defaultState);

  useEffect(() => {
    if (item) {
      setFormState({
        name: item.name,
        type: item.type,
        link: item.link || "",
        alignment: item.alignment || "left",
        buttonStyle: item.buttonStyle || "solid",
        textColor: item.textColor || "#000000",
        buttonColor: item.buttonColor || "#000000",
        openInNewTab: item.openInNewTab || false,
      });
    } else {
      setFormState(defaultState);
    }
  }, [item, isOpen]);

  const handleSave = () => {
    if (item) {
      updateItem({ ...item, ...formState });
    } else {
      addItem(formState);
    }
    setIsOpen(false);
  };

  const handleAlignmentChange = (align: Alignment) => {
    setFormState((prev) => ({ ...prev, alignment: align }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Header Item</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-normal font-normal" htmlFor="type">
              Type
            </Label>
            <Select
              value={formState.type}
              onValueChange={(v: ItemType) =>
                setFormState((p) => ({ ...p, type: v }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Link">Link</SelectItem>
                <SelectItem value="List">List</SelectItem>
                <SelectItem value="Button">Button</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-normal font-normal" htmlFor="name">
              Name
            </Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(e) =>
                setFormState((p) => ({ ...p, name: e.target.value }))
              }
              className="col-span-3"
            />
          </div>
          {/* Link */}
          {formState.type !== "List" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-normal font-normal" htmlFor="link">
                Link
              </Label>
              <Input
                id="link"
                value={formState.link}
                onChange={(e) =>
                  setFormState((p) => ({ ...p, link: e.target.value }))
                }
                className="col-span-3"
              />
            </div>
          )}
          {/* Alignment */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label>Alignment</Label>
            <div className="col-span-3 flex items-center gap-2">
              <Button
                variant={formState.alignment === "left" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => handleAlignmentChange("left")}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={
                  formState.alignment === "center" ? "secondary" : "ghost"
                }
                size="icon"
                onClick={() => handleAlignmentChange("center")}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={
                  formState.alignment === "right" ? "secondary" : "ghost"
                }
                size="icon"
                onClick={() => handleAlignmentChange("right")}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Button Style */}
          {formState.type === "Button" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-normal font-normal" htmlFor="button-style">
                Button Style
              </Label>
              <Select
                value={formState.buttonStyle}
                onValueChange={(v: ButtonStyle) =>
                  setFormState((p) => ({ ...p, buttonStyle: v }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Text Color */}
          {/* <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-normal font-normal" htmlFor="text-color">
              Text Color
            </Label>
            <div className="col-span-3 flex items-center gap-2 border rounded-md px-2">
              <input
                type="color"
                value={formState.textColor}
                onChange={(e) =>
                  setFormState((p) => ({ ...p, textColor: e.target.value }))
                }
                className="w-6 h-6"
              />
              <Input
                id="text-color"
                value={formState.textColor}
                onChange={(e) =>
                  setFormState((p) => ({ ...p, textColor: e.target.value }))
                }
                className="border-none"
              />
            </div>
          </div> */}
          {/* Button Color */}
          {formState.type === "Button" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-normal font-normal" htmlFor="button-color">
                Button Color
              </Label>
              <div className="col-span-3 flex items-center gap-2 border rounded-md px-2">
                <input
                  type="color"
                  value={formState.buttonColor}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, buttonColor: e.target.value }))
                  }
                  className="w-6 h-6"
                />
                <Input
                  id="button-color"
                  value={formState.buttonColor}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, buttonColor: e.target.value }))
                  }
                  className="border-none"
                />
              </div>
            </div>
          )}
          {/* Open in New Tab */}
          {formState.type !== "List" && (
            <div className="flex  gap-2">
              <Label>Open in New Tab</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  checked={formState.openInNewTab}
                  onCheckedChange={(c) =>
                    setFormState((p) => ({ ...p, openInNewTab: !!c }))
                  }
                />
                <span className="text-normal">
                  {formState.openInNewTab ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          )}
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
