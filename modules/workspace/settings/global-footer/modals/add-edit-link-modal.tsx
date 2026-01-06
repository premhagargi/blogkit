"use client";

import { useState, useEffect } from "react";
import { FooterLink } from "../context/footer-context";
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
import { Switch } from "@/components/ui/switch";

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (link: Omit<FooterLink, "id" | "order">) => void;
  link: Omit<FooterLink, "id" | "order"> | null;
}

export default function AddEditLinkModal({
  isOpen,
  setIsOpen,
  onSave,
  link,
}: Props) {
  const [name, setName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);

  useEffect(() => {
    if (link) {
      setName(link.name);
      setLinkUrl(link.link);
      setOpenInNewTab(link.openInNewTab);
    } else {
      setName("");
      setLinkUrl("");
      setOpenInNewTab(true);
    }
  }, [link, isOpen]);

  const handleSave = () => {
    if (!name) return;
    onSave({ name, link: linkUrl, openInNewTab });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>{link ? "Edit" : "Add"} Link</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              className="text-normal font-normal text-right"
              htmlFor="name"
            >
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Enter name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              className="text-normal font-normal text-right"
              htmlFor="link"
            >
              Link
            </Label>
            <Input
              id="link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="col-span-3"
              placeholder="Enter link"
            />
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-normal font-normal" htmlFor="new-tab">
              Open in New Tab
            </Label>
            <div className="flex items-center gap-2">
              <Switch
                id="new-tab"
                checked={openInNewTab}
                onCheckedChange={setOpenInNewTab}
              />
              <span className="text-normal">{openInNewTab ? "ON" : "OFF"}</span>
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
