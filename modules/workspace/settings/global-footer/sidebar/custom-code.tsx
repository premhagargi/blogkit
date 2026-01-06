// global - footer custom code
"use client";
import { useContext } from "react";
import { FooterContext } from "../context/footer-context";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CustomCodeProps {
  onBack: () => void;
}

export default function CustomCode({ onBack }: CustomCodeProps) {
  const {
    customCode,
    setCustomCode,
    isCustomCodeEnabled,
    setIsCustomCodeEnabled,
    saveChanges,
  } = useContext(FooterContext);

  const handleSave = () => {
    saveChanges();
  };

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex items-center justify-between ">
        <h2 className="text-main font-medium">Custom Code &lt;/&gt;</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="custom-code-switch" className="text-sm">
            {isCustomCodeEnabled ? "Enabled" : "Disabled"}
          </label>
          <Switch
            id="custom-code-switch"
            checked={isCustomCodeEnabled}
            onCheckedChange={setIsCustomCodeEnabled}
          />
        </div>
      </div>

      <div className="flex-1 py-2 flex flex-col gap-2 min-h-0">
        <p className="text-small">Enter HTML / JavaScript code</p>
        <Textarea
          value={customCode}
          onChange={(e) => setCustomCode(e.target.value)}
          placeholder="<!-- Your custom footer code goes here -->"
          className="flex-1 font-mono text-sm resize-none bg-secondary"
        />
      </div>

      <div className="flex justify-between mt-auto pt-2 border-t">
        <Button variant="outline" onClick={onBack}>
          &lt;- Back
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}
