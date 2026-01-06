"use client";
import React, { useContext } from "react";
import { CtaContext, CtaType, CtaTrigger } from "../context/cta-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common/tooltip";
import CategoriesTagsMultiSelect from "../../shared/categories-tags-multiselect";

// SVGs for CTA Types
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

const icons: Record<CtaType, React.ReactNode> = {
  EndOfPost: <EndOfPostIcon />,
  Sidebar: <SidebarIcon />,
  InLine: <InLineIcon />,
  PopUp: <PopUpIcon />,
  Floating: <FloatingIcon />,
};

const CtaTypeCard = ({
  type,
  label,
  isActive,
  onSelect,
}: {
  type: CtaType;
  label: string;
  isActive: boolean;
  onSelect: (type: CtaType) => void;
}) => (
  <div
    onClick={() => onSelect(type)}
    className={cn("p-2 border-2 rounded-lg text-center cursor-pointer", {
      "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50": isActive,
      "border-gray-200 hover:border-gray-400 dark:border-zinc-700": !isActive,
    })}
  >
    <div className="h-16 bg-gray-100 dark:bg-zinc-800 mb-2 rounded-md flex items-center justify-center overflow-hidden">
      {icons[type]}
    </div>
    <p className="text-small text-gray-700 dark:text-gray-300">{label}</p>
  </div>
);

export default function CtaConfigure() {
  const {
    ctaState,
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
  } = useContext(CtaContext);

  const {
    ctaName,
    type,
    categories: selectedCategoriesRaw,
    tags: selectedTagsRaw,
    trigger,
    timeDelay,
    scrollTrigger,
  } = ctaState;

  // Add safety checks to ensure arrays
  const selectedCategories = Array.isArray(selectedCategoriesRaw)
    ? selectedCategoriesRaw
    : [];
  const selectedTags = Array.isArray(selectedTagsRaw) ? selectedTagsRaw : [];

  const isTriggerConfigurable = ["PopUp", "Floating"].includes(type);
  const showTimeDelay = isTriggerConfigurable && trigger === "TimeDelay";
  const showScrollTrigger = isTriggerConfigurable && trigger === "Scroll";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        {/* <Settings className="h-4 w-4 text-gray-600 dark:text-small mt-1" /> */}
        <div>
          <h1 className="text-main">Configure CTA</h1>
          <p className="text-small">
            Set the core behavior and targeting for this callout.
          </p>
        </div>
      </div>
      <div className="space-y-5">
        <div>
          <Label
            htmlFor="cta-name"
            className=" text-normal font-medium mb-2 block"
          >
            CTA Name
          </Label>
          <Input
            id="cta-name"
            value={ctaName}
            placeholder="e.g. Homepage Welcome CTA"
            onChange={(e) => updateField("ctaName", e.target.value)}
          />
        </div>
        <div>
          <Label className=" text-normal font-medium mb-2 block">Type</Label>
          <div className="grid grid-cols-3 gap-3">
            {Object.keys(icons).map((key) => (
              <CtaTypeCard
                key={key}
                type={key as CtaType}
                label={key.replace(/([A-Z])/g, " $1").trim()}
                isActive={type === key}
                onSelect={(t) => updateField("type", t)}
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
          tooltipContent="Select categories and tags to organize your CTAs."
          label="Categories & Tags"
        />

        {isTriggerConfigurable && (
          <>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="cta-trigger" className="text-normal font-medium">
                CTA trigger
              </Label>
              <Tooltip content="Select the trigger for the CTA.">
                <HelpCircle className="h-4 w-4 ml-2 text-small cursor-pointer" />
              </Tooltip>
            </div>
            <Select
              value={trigger}
              onValueChange={(v: CtaTrigger) => updateField("trigger", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Time delay / Scroll trigger / Exit Intent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TimeDelay">Time delay</SelectItem>
                <SelectItem value="Scroll">Scroll trigger</SelectItem>
                {type === "PopUp" && (
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
                <Label className="text-normal whitespace-nowrap">
                  Scroll Trigger
                </Label>
                <Input
                  className="w-16 h-8 text-center"
                  type="number"
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
        <div className="flex justify-end items-center pt-2">
          <Button onClick={() => setActiveTab("cta")}>Next →</Button>
        </div>
      </div>
    </div>
  );
}
