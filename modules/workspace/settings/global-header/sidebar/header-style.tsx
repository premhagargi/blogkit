"use client";
import { useContext } from "react";
import { HeaderContext } from "../context/header-context";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChromePicker } from "react-color";

export function ColorSwatch({
  hex,
  onChange,
  disabled = false,
}: {
  hex: string;
  onChange: (newHex: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          disabled={disabled}
          className={`flex items-center justify-start border rounded-md px-2 py-1 w-25 text-sm
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className="w-5 h-5 rounded mr-2 border"
            style={{ backgroundColor: hex }}
          />
          <span className="font-mono text-xs">{hex}</span>
        </button>
      </DialogTrigger>
      {!disabled && (
        <DialogContent
          showCloseButton={false}
          className="w-fit p-0 rounded-xl overflow-hidden"
        >
          <ChromePicker color={hex} onChange={(c) => onChange(c.hex)} />
        </DialogContent>
      )}
    </Dialog>
  );
}

export default function HeaderStyle() {
  const { headerStyle, setHeaderStyle } = useContext(HeaderContext);

  const handleChange = (key: string, value: any) => {
    setHeaderStyle({ ...headerStyle, [key]: value });
  };

  return (
    <div className=" p-4 space-y-8">
      {/* Colors */}
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
            hex={headerStyle.backgroundColorLight}
            onChange={(val) => handleChange("backgroundColorLight", val)}
          />
          <ColorSwatch
            hex={headerStyle.backgroundColorDark}
            onChange={(val) => handleChange("backgroundColorDark", val)}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <Label className="text-normal">Text</Label>
          <ColorSwatch
            hex={headerStyle.textColorLight}
            onChange={(val) => handleChange("textColorLight", val)}
          />
          <ColorSwatch
            hex={headerStyle.textColorDark}
            onChange={(val) => handleChange("textColorDark", val)}
          />
        </div>
      </Card>

      {/* Header Height */}
      <Card className="p-0 shadow-none border-none space-y-2 flex flex-row justify-between items-center">
        <CardTitle className="text-normal font-medium">Header height</CardTitle>
        <div className="flex items-center  gap-2">
          <Slider
            value={[headerStyle.height]}
            onValueChange={(val) => handleChange("height", val[0])}
            min={40}
            max={100}
            step={1}
            className="flex-1 min-w-46"
          />
          <span className="text-normal text-gray-500">
            {headerStyle.height}px
          </span>
        </div>
      </Card>
      {/* <Card className="p-0 shadow-none border-none space-y-2 flex flex-row items-center justify-between">
        <CardTitle className="text-normal font-medium">Button Radius</CardTitle>
        <div className="flex items-center gap-2">
          <Slider
            value={[headerStyle.buttonRadius]}
            onValueChange={(val) => handleChange("buttonRadius", val[0])}
            min={0}
            max={32}
            step={1}
            className="flex-1 min-w-40"
          />
          <span className="text-normal text-gray-500 ">
            {headerStyle.buttonRadius}px
          </span>
        </div>
      </Card> */}

      {/* Navbar Border Width */}
      <Card className="p-0 shadow-none border-none items-center gap-0 flex flex-row align-center justify-between">
        <CardTitle className="text-normal font-medium">Border</CardTitle>
        <div className="flex items-center gap-2">
          <ColorSwatch
            hex={headerStyle.borderColor}
            onChange={(val) => handleChange("borderColor", val)}
          />
          <Slider
            value={[headerStyle.borderWidth]}
            onValueChange={(val) => handleChange("borderWidth", val[0])}
            min={0}
            max={5}
            step={1}
            className="flex-1 min-w-21.5"
          />
          <span className="text-normal text-gray-500 ">
            {headerStyle.borderWidth}px
          </span>
        </div>
      </Card>

      {/* Sticky Header */}
      <Card className="shadow-none border-none flex-row items-center p-0 gap-8">
        <CardTitle className="text-normal font-medium">Sticky Header</CardTitle>
        <div className="flex items-center gap-2">
          <Switch
            checked={headerStyle.sticky}
            onCheckedChange={(val) => handleChange("sticky", val)}
          />
          <span className="text-normal text-gray-500">
            {headerStyle.sticky ? "Enabled" : "Disabled"}
          </span>
        </div>
      </Card>
    </div>
  );
}
