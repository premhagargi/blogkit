import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Font } from "@samuelmeuli/font-manager";
import { Separator } from "@/components/ui/separator";
import { Search, X } from "lucide-react";

export default function FontSearchModal({
  fonts,
  activeFontFamily,
  onSelect,
  open,
  setOpen,
}: {
  fonts: Font[];
  activeFontFamily: string;
  onSelect: (font: Font) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");

  const filteredFonts = useMemo(() => {
    if (!query) return fonts;
    return fonts.filter((f) =>
      f.family.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, fonts]);

  if (!open) return null;

  return (
    <Card className="w-[200px] p-2 gap-0 absolute right-0 bottom-10 shadow-lg z-50">
      {/* Search Input */}
      <div className="relative w-full">
        <Input
          placeholder="Search fonts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 pr-8"
        />
        <Search className="absolute left-2 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        {query && (
          <X
            className="absolute right-2 top-1/2 w-4 h-4 -translate-y-1/2 cursor-pointer text-muted-foreground"
            onClick={() => setQuery("")}
          />
        )}
      </div>

      <Separator className="my-2" />
      <p className="text-small pb-2 pl-1">All results</p>

      {/* Font List */}
      <Card className="max-h-50 !shadow-none border-none gap-0 outline-none overflow-x-hidden overflow-y-auto py-0">
        {filteredFonts.map((font) => (
          <Button
            key={font.family}
            variant={font.family === activeFontFamily ? "default" : "ghost"}
            size="sm"
            className="w-full justify-start py-3"
            style={{ fontFamily: font.family }}
            onClick={() => {
              onSelect(font);
              setOpen(false);
            }}
          >
            {font.family}
          </Button>
        ))}

        {filteredFonts.length === 0 && (
          <p className="text-small p-2 text-center">No results found</p>
        )}
      </Card>
    </Card>
  );
}
