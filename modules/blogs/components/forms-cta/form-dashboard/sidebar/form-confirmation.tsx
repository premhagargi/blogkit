"use client";
import { useContext } from "react";
import { produce } from "immer";
import { FormContext, ConfirmationButtonType } from "../context/form-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import DescriptionEditor from "@/components/common/description-editor";

export default function FormConfirmation() {
  const { formState, setActiveTab, setFormState } = useContext(FormContext);
  const { confirmation } = formState;

  // Corrected state update logic for nested objects
  const handleConfirmationChange = (
    field: keyof typeof confirmation,
    value: any
  ) => {
    setFormState(
      produce(formState, (draft) => {
        (draft.confirmation as any)[field] = value;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* --- Main Header --- */}
      <div className="flex items-start gap-3">
        {/* <CheckCircle2 className="h-4 w-4 text-normal mt-1" /> */}
        <div>
          <h1 className="text-main">Confirmation Message</h1>
          <p className="text-small">
            Set the confirmation message of your form.
          </p>
        </div>
      </div>

      {/* --- Message Content Section --- */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-normal font-medium" htmlFor="conf-heading">
            Heading
          </Label>
          <Input
            id="conf-heading"
            value={confirmation.heading}
            onChange={(e) =>
              handleConfirmationChange("heading", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-normal font-medium" htmlFor="conf-description">
            Description
          </Label>
          <DescriptionEditor
            value={confirmation.description}
            onChange={(content: string) =>
              handleConfirmationChange("description", content)
            }
          />
        </div>

        <Separator />

        {/* --- Action Button Section --- */}
        <div className="space-y-2">
          <Label className="text-normal font-medium" htmlFor="conf-button-text">
            Button Text
          </Label>
          <Input
            id="conf-button-text"
            value={confirmation.buttonText}
            onChange={(e) =>
              handleConfirmationChange("buttonText", e.target.value)
            }
          />
        </div>
        <div className="space-y-2 w-full">
          <Label className="text-normal font-medium" htmlFor="conf-button-type">
            Button Type
          </Label>
          <Select
            value={confirmation.buttonType}
            onValueChange={(v: ConfirmationButtonType) =>
              handleConfirmationChange("buttonType", v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Close">Close Message</SelectItem>
              <SelectItem value="Link">Redirect to URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setActiveTab("form")}>
            ← Back
          </Button>
          <Button onClick={() => setActiveTab("action")}>Next →</Button>
        </div>

        {/* Conditional fields for 'Link' type */}
        {confirmation.buttonType === "Link" && (
          <div className="space-y-4  mt-4">
            <div className="space-y-2">
              <Label className="text-normal font-medium" htmlFor="conf-url">
                Redirect URL
              </Label>
              <Input
                id="conf-url"
                placeholder="https://example.com"
                value={confirmation.url}
                onChange={(e) =>
                  handleConfirmationChange("url", e.target.value)
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="conf-new-tab"
                checked={!!confirmation.openInNewTab}
                onCheckedChange={(c) =>
                  handleConfirmationChange("openInNewTab", c)
                }
              />
              <Label className="text-normal font-medium" htmlFor="conf-new-tab">
                Open in New Tab
              </Label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
