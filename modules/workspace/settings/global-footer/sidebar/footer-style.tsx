"use client";
import { useContext } from "react";
import { FooterContext } from "../context/footer-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChromePicker } from "react-color";

export function ColorSwatch({
  hex,
  onChange,
}: {
  hex: string;
  onChange: (newHex: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center justify-start border rounded-md px-2 py-1 w-25 text-sm cursor-pointer">
          <span
            className="w-5 h-5 rounded mr-2 border"
            style={{ backgroundColor: hex }}
          />
          <span className="font-mono text-xs">{hex}</span>
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="w-fit p-0 rounded-xl overflow-hidden"
      >
        <ChromePicker color={hex} onChange={(c) => onChange(c.hex)} />
      </DialogContent>
    </Dialog>
  );
}

export default function FooterStyle() {
  const { footerStyle, setFooterStyle } = useContext(FooterContext);

  const handleChange = (key: string, value: any) => {
    setFooterStyle({ ...footerStyle, [key]: value });
  };

  return (
    <div className="p-4 space-y-8">
      <Card className="p-0 shadow-none border-none gap-2">
        <div className="flex gap-22 items-center">
          <CardTitle className="text-normal">Colors</CardTitle>
          <div className="flex gap-13">
            <span className="text-small">Light Mode</span>
            <span className="text-small">Dark Mode</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <Label className="text-normal">Background</Label>
          <ColorSwatch
            hex={footerStyle.backgroundColorLight}
            onChange={(val) => handleChange("backgroundColorLight", val)}
          />
          <ColorSwatch
            hex={footerStyle.backgroundColorDark}
            onChange={(val) => handleChange("backgroundColorDark", val)}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <Label className="text-normal">Text</Label>
          <ColorSwatch
            hex={footerStyle.textColorLight}
            onChange={(val) => handleChange("textColorLight", val)}
          />
          <ColorSwatch
            hex={footerStyle.textColorDark}
            onChange={(val) => handleChange("textColorDark", val)}
          />
        </div>
      </Card>

      <Card className="p-0 shadow-none border-none items-center gap-0 flex flex-row align-center justify-between">
        <CardTitle className="text-normal font-medium">Border</CardTitle>
        <div className="flex items-center gap-2">
          <ColorSwatch
            hex={footerStyle.borderColor}
            onChange={(val) => handleChange("borderColor", val)}
          />
          <Slider
            value={[footerStyle.borderWidth]}
            onValueChange={(val) => handleChange("borderWidth", val[0])}
            min={0}
            max={5}
            step={1}
            className="flex-1 w-22"
          />
          <span className="text-normal text-gray-500 ">
            {footerStyle.borderWidth}px
          </span>
        </div>
      </Card>
    </div>
  );
}
