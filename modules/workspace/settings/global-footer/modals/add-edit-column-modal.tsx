"use client";
import { useState, useEffect } from "react";
import { FooterColumn } from "../context/footer-context";
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

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (column: Omit<FooterColumn, "id" | "order" | "links">) => void;
  column: Pick<FooterColumn, "title"> | null;
}

export default function AddEditColumnModal({
  isOpen,
  setIsOpen,
  onSave,
  column,
}: Props) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (column) {
      setTitle(column.title);
    } else {
      setTitle("");
    }
  }, [column, isOpen]);

  const handleSave = () => {
    if (!title) return;
    onSave({ title });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>{column ? "Edit" : "Add"} Column</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-normal font-normal" htmlFor="title">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
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
