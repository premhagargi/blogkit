"use client";
import React, { useContext, useMemo, useEffect } from "react";
import { FormContext, FormType, FormTrigger } from "../context/form-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common/tooltip";
import CategoriesTagsMultiSelect from "../../shared/categories-tags-multiselect";

// SVGs for Form Types (Unchanged)
const EndOfPostIcon = () => (
  <svg viewBox="0 0 80 50">
    <rect x="5" y="5" width="70" height="40" rx="3" fill="#E5E7EB" />
    <rect x="15" y="10" width="50" height="4" rx="2" fill="#D1D5DB" />
    <rect x="15" y="18" width="50" height="4" rx="2" fill="#D1D5DB" />
    <rect x="15" y="32" width="50" height="10" rx="2" fill="#F97316" />
  </svg>
);
const SidebarIcon = () => (
  <svg viewBox="0 0 80 50">
    <rect x="5" y="5" width="70" height="40" rx="3" fill="#E5E7EB" />
    <rect x="10" y="10" width="40" height="4" rx="2" fill="#D1D5DB" />
    <rect x="10" y="18" width="40" height="4" rx="2" fill="#D1D5DB" />
    <rect x="55" y="10" width="15" height="30" rx="2" fill="#F97316" />
  </svg>
);
const InLineIcon = () => (
  <svg viewBox="0 0 80 50">
    <rect x="5" y="5" width="70" height="40" rx="3" fill="#E5E7EB" />
    <rect x="15" y="10" width="50" height="4" rx="2" fill="#D1D5DB" />
    <rect x="15" y="20" width="50" height="10" rx="2" fill="#F97316" />
    <rect x="15" y="34" width="50" height="4" rx="2" fill="#D1D5DB" />
  </svg>
);
const PopUpIcon = () => (
  <svg viewBox="0 0 80 50">
    <rect
      x="5"
      y="5"
      width="70"
      height="40"
      rx="3"
      fill="#E5E7EB"
      opacity="0.6"
    />
    <rect
      x="20"
      y="12.5"
      width="40"
      height="25"
      rx="3"
      stroke="#F97316"
      strokeWidth="2"
      fill="#F3F4F6"
    />
  </svg>
);
const FloatingIcon = () => (
  <svg viewBox="0 0 80 50">
    <rect x="5" y="5" width="70" height="40" rx="3" fill="#E5E7EB" />
    <rect x="15" y="10" width="50" height="4" rx="2" fill="#D1D5DB" />
    <rect x="45" y="28" width="25" height="12" rx="2" fill="#F97316" />
  </svg>
);
const GatedIcon = () => (
  <svg viewBox="0 0 80 50">
    <rect x="5" y="5" width="70" height="40" rx="3" fill="#E5E7EB" />
    <rect
      x="5"
      y="5"
      width="70"
      height="40"
      rx="3"
      fill="black"
      opacity="0.5"
    />
    <rect x="20" y="12.5" width="40" height="25" rx="3" fill="#F3F4F6" />
  </svg>
);

const icons: Record<FormType, React.ReactNode> = {
  EndOfPost: <EndOfPostIcon />,
  Sidebar: <SidebarIcon />,
  InLine: <InLineIcon />,
  PopUp: <PopUpIcon />,
  Floating: <FloatingIcon />,
  Gated: <GatedIcon />,
};

const FormTypeCard = ({
  type,
  label,
  isActive,
  onSelect,
}: {
  type: FormType;
  label: string;
  isActive: boolean;
  onSelect: (type: FormType) => void;
}) => (
  <div
    onClick={() => onSelect(type)}
    className={cn(
      "p-2 border-2 rounded-lg text-center cursor-pointer transition-all duration-200",
      {
        "border-blue-500 bg-blue-50 dark:bg-blue-900/50": isActive,
        "border-gray-200 hover:border-gray-400 dark:border-zinc-700 dark:hover:border-zinc-500":
          !isActive,
      }
    )}
  >
    <div className="h-16 bg-gray-100 dark:bg-zinc-800 mb-2 rounded-md flex items-center justify-center overflow-hidden">
      {icons[type]}
    </div>
    <p className="text-small  text-gray-700 dark:text-gray-300">{label}</p>
  </div>
);

export default function FormConfigure() {
  const {
    formState,
    updateField,
    setActiveTab,
    categories,
    tags,
    loadingCategories,
    loadingTags,
    categoriesError,
    tagsError,
    refreshCategories,
    refreshTags,
  } = useContext(FormContext);

  const {
    formName,
    formType,
    categories: selectedCategoriesRaw,
    tags: selectedTagsRaw,
    formTrigger,
    timeDelay,
    scrollTrigger,
    isMandatory,
  } = formState;

  const selectedCategories = useMemo(
    () => (Array.isArray(selectedCategoriesRaw) ? selectedCategoriesRaw : []),
    [selectedCategoriesRaw]
  );

  const selectedTags = useMemo(
    () => (Array.isArray(selectedTagsRaw) ? selectedTagsRaw : []),
    [selectedTagsRaw]
  );

  // Set default formTrigger to "Scroll" when formType is "Gated"
  useEffect(() => {
    if (formType === "Gated" && formTrigger !== "Scroll") {
      updateField("formTrigger", "Scroll");
    }
  }, [formType, formTrigger, updateField]);

  const isTriggerConfigurable = ["PopUp", "Floating", "Gated"].includes(
    formType
  );
  const showTimeDelay =
    isTriggerConfigurable &&
    formTrigger === "TimeDelay" &&
    ["PopUp", "Floating", "Gated"].includes(formType);
  const showScrollTrigger = isTriggerConfigurable && formTrigger === "Scroll";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        {/* <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-1" /> */}
        <div>
          <h1 className="text-main">Configure Form</h1>
          <p className="text-small">
            Set the core behavior and appearance of your form.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Form Name */}
        <div>
          <Label
            htmlFor="form-name"
            className="text-normal font-medium mb-2 block"
          >
            Form Name
          </Label>
          <Input
            id="form-name"
            value={formName}
            placeholder="e.g. Blog Post Lead Magnet"
            onChange={(e) => updateField("formName", e.target.value)}
          />
        </div>

        {/* Form Type */}
        <div>
          <Label className="text-normal font-medium mb-2 block">Type</Label>
          <div className="grid grid-cols-3 gap-3">
            {Object.keys(icons).map((key) => (
              <FormTypeCard
                key={key}
                type={key as FormType}
                label={key.replace(/([A-Z])/g, " $1").trim()}
                isActive={formType === key}
                onSelect={(t) => updateField("formType", t)}
              />
            ))}
          </div>
        </div>

        {/* Categories and Tags Selection */}
        <CategoriesTagsMultiSelect
          categories={categories}
          tags={tags}
          selectedCategories={selectedCategories}
          selectedTags={selectedTags}
          updateField={updateField}
          loadingCategories={loadingCategories}
          loadingTags={loadingTags}
          categoriesError={categoriesError}
          tagsError={tagsError}
          refreshCategories={refreshCategories}
          refreshTags={refreshTags}
          tooltipContent="Select categories and tags to organize your forms."
          label="Categories & Tags"
        />

        {/* Form Trigger Configuration */}
        {isTriggerConfigurable && (
          <>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="form-trigger" className="font-medium">
                Form trigger
              </Label>
              <Tooltip content="Select the trigger for the form.">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-pointer" />
              </Tooltip>
            </div>
            <Select
              value={formTrigger}
              onValueChange={(v: FormTrigger) => updateField("formTrigger", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Time delay / Scroll trigger / Exit Intent" />
              </SelectTrigger>
              <SelectContent>
                {formType !== "Gated" && (
                  <SelectItem value="TimeDelay">Time delay</SelectItem>
                )}
                <SelectItem value="Scroll">Scroll trigger</SelectItem>
                {formType === "PopUp" && (
                  <SelectItem value="ExitIntent">Exit Intent</SelectItem>
                )}
              </SelectContent>
            </Select>

            {showTimeDelay && (
              <div className="flex items-center gap-2 mt-3">
                <Label className="text-normal whitespace-nowrap">
                  Time Delay
                </Label>
                <Input
                  className="w-16 h-8 text-center"
                  type="number"
                  min="0"
                  value={timeDelay}
                  onChange={(e) =>
                    updateField("timeDelay", parseInt(e.target.value, 10))
                  }
                />
                <span className="text-normal">Seconds</span>
              </div>
            )}

            {showScrollTrigger && (
              <div className="flex items-center gap-2 mt-3">
                <Label className="text-normal">Scroll Trigger</Label>
                <Input
                  className="w-16 h-8 text-center"
                  type="number"
                  min="0"
                  value={scrollTrigger}
                  onChange={(e) =>
                    updateField("scrollTrigger", parseInt(e.target.value, 10))
                  }
                />
                <span className="text-normal">% of post page</span>
              </div>
            )}
          </>
        )}

        {/* Mandatory Form & Next Button */}
        {(formType === "PopUp" ||
          formType === "Floating" ||
          formType === "Gated") && (
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="font-medium">Mandatory Form</Label>
                <Tooltip content="Make the form mandatory to submit.">
                  <HelpCircle className="h-4 w-4  text-gray-400 cursor-pointer" />
                </Tooltip>
              </div>
              <Checkbox
                id="mandatory"
                checked={isMandatory}
                onCheckedChange={(c) => updateField("isMandatory", !!c)}
              />
              <Label htmlFor="mandatory" className="text-normal">
                Yes
              </Label>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={() => setActiveTab("form")}>Next →</Button>
        </div>
      </div>
    </div>
  );
}
