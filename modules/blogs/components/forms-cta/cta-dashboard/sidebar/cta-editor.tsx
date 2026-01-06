"use client";
import { useContext } from "react";
import { CtaContext } from "../context/cta-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Menu, Bold, Italic, Underline, Link } from "lucide-react";
import { produce } from "immer";
import { Separator } from "@/components/ui/separator";
import DescriptionEditor from "@/components/common/description-editor";

export default function CtaEditor() {
  const { ctaState, updateContentField, saveChanges, setActiveTab } =
    useContext(CtaContext);
  const { content } = ctaState;

  // Handler for nested button objects
  const handleButtonChange = (
    button: "primaryButton" | "secondaryButton",
    field: "text" | "url",
    value: string
  ) => {
    const newButtonState = produce(content[button], (draft) => {
      draft[field] = value;
    });
    updateContentField(button, newButtonState);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col mb-5">
        <h1 className="text-main">CTA</h1>
        <p className="text-small">Set the CTA for this callout.</p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        <div className="space-y-2">
          <Label className="text-normal font-medium" htmlFor="cta-heading">
            Heading
          </Label>
          <Input
            id="cta-heading"
            value={content.heading}
            onChange={(e) => updateContentField("heading", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-normal font-medium" htmlFor="cta-desc">
            Description
          </Label>
          <DescriptionEditor
            value={content.description}
            onChange={(val: string) => updateContentField("description", val)}
            className="rounded-t-none"
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-normal font-medium">Primary Button</Label>
          <Input
            placeholder="Button Text"
            value={content.primaryButton.text}
            onChange={(e) =>
              handleButtonChange("primaryButton", "text", e.target.value)
            }
          />
          <Input
            placeholder="Button URL"
            value={content.primaryButton.url}
            onChange={(e) =>
              handleButtonChange("primaryButton", "url", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-normal font-medium">Secondary Button</Label>
          <Input
            placeholder="Button Text"
            value={content.secondaryButton.text}
            onChange={(e) =>
              handleButtonChange("secondaryButton", "text", e.target.value)
            }
          />
          <Input
            placeholder="Button URL"
            value={content.secondaryButton.url}
            onChange={(e) =>
              handleButtonChange("secondaryButton", "url", e.target.value)
            }
          />
        </div>
        <Separator />

        <div className="space-y-2">
          <Label className="text-normal font-medium" htmlFor="cta-footnote">
            Footnote
          </Label>
          <DescriptionEditor
            value={content.footnote}
            onChange={(val: string) => updateContentField("footnote", val)}
            className="rounded-t-none"
          />
        </div>
        <div className="flex justify-between mt-auto pt-2">
          <Button variant="outline" onClick={() => setActiveTab("configure")}>
            ← Back
          </Button>
          <Button onClick={saveChanges}>Save</Button>
        </div>
      </div>
    </div>
  );
}
