"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PencilIcon, Bold, Italic } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import FontPicker from "./font-picker";

// Font style type
interface FontStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
}

// Initial font settings
const initialFontSettings: { [key: string]: FontStyle } = {
  h1: {
    fontFamily: "Roboto",
    fontSize: 26,
    fontWeight: "bold",
    fontStyle: "normal",
  },
  h2: {
    fontFamily: "Lato",
    fontSize: 20,
    fontWeight: "bold",
    fontStyle: "normal",
  },
  h3: {
    fontFamily: "Open Sans",
    fontSize: 16,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  h4: {
    fontFamily: "Montserrat",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
  },
};

export default function FontSelector() {
  const [fontSettings, setFontSettings] = useState(initialFontSettings);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const textRefs = useRef<{ [key: string]: HTMLParagraphElement | null }>({});

  const updateFontSetting = (key: string, newStyle: Partial<FontStyle>) => {
    setFontSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...newStyle },
    }));
  };

  const FontRow = ({ tag, style }: { tag: string; style: FontStyle }) => {
    const key = tag.toLowerCase();
    const isEditing = editingKey === key;

    // Dynamic width for the popover based on text width
    const [popoverWidth, setPopoverWidth] = useState(300);
    useLayoutEffect(() => {
      const width = textRefs.current[key]?.offsetWidth || 200;
      setPopoverWidth(width + 100); // some extra space
    }, [
      style.fontSize,
      style.fontFamily,
      style.fontWeight,
      style.fontStyle,
      key,
    ]);

    return (
      <div className="relative max-w-[400px] flex items-center justify-between p-sm border rounded-md mb-2">
        <p
          ref={(el) => {
            textRefs.current[key] = el;
          }}
          style={{
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            fontStyle: style.fontStyle,
          }}
          className="flex-grow"
        >
          {style.fontFamily}, {style.fontSize}px, {style.fontWeight},{" "}
          {style.fontStyle}
        </p>

        <Popover
          open={isEditing}
          onOpenChange={(open) => !open && setEditingKey(null)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-4"
              onClick={() => setEditingKey(isEditing ? null : key)}
            >
              <PencilIcon className="h-3 w-3" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="flex items-center gap-1 p-1 shadow-lg rounded-md min-w-[10px] max-w-[90vw] absolute -right-5 bottom-5"
            side="top"
            align="start"
            style={{ width: "auto" }}
          >
            <FontPicker
              apiKey="AIzaSyBpgwLwmkX5Mjm2MkAxo3P34K-wl2rvHX8"
              activeFontFamily={fontSettings[key].fontFamily}
              onChange={(nextFont) =>
                updateFontSetting(key, { fontFamily: nextFont.family })
              }
            />

            <Input
              type="number"
              value={fontSettings[key].fontSize}
              onChange={(e) =>
                updateFontSetting(key, { fontSize: +e.target.value })
              }
              className="px-1 w-16"
            />

            <Button
              variant="ghost"
              onClick={() =>
                updateFontSetting(key, {
                  fontWeight:
                    fontSettings[key].fontWeight === "bold" ? "normal" : "bold",
                })
              }
              className={
                fontSettings[key].fontWeight === "bold"
                  ? "text-primary !px-2"
                  : "text-muted-foreground !px-2"
              }
            >
              <Bold
                className="w-5 h-5"
                strokeWidth={fontSettings[key].fontWeight === "bold" ? 3 : 1.5}
              />
            </Button>

            <Button
              variant="ghost"
              onClick={() =>
                updateFontSetting(key, {
                  fontStyle:
                    fontSettings[key].fontStyle === "italic"
                      ? "normal"
                      : "italic",
                })
              }
              className={
                fontSettings[key].fontStyle === "italic"
                  ? "text-primary !px-2"
                  : "text-muted-foreground !px-2"
              }
            >
              <Italic
                className="w-5 h-5"
                strokeWidth={fontSettings[key].fontStyle === "italic" ? 3 : 1.5}
              />
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className="">
      {Object.entries(fontSettings).map(([key, style]) => (
        <FontRow key={key} tag={key.toUpperCase()} style={style} />
      ))}
    </div>
  );
}
