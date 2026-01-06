"use client";

import {
  Sun,
  Moon,
  Monitor,
  Smartphone,
  ChevronLeft,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Tab {
  value: string;
  label: string;
}

interface EditorHeaderProps {
  title: string;
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: "light" | "dark";
  onThemeChange: () => void;
  device: "desktop" | "mobile";
  onDeviceChange: (device: "desktop" | "mobile") => void;
  onSaveChanges: () => void;
  onCancelChanges?: () => void;
  onBack?: () => void;
  isSaving?: boolean;
  isDisabled?: boolean;
  saveMessage?: string | null;
  saveError?: string | null;
}

export default function EditorHeader({
  title,
  tabs,
  activeTab,
  onTabChange,
  theme,
  onThemeChange,
  device,
  onDeviceChange,
  onSaveChanges,
  onCancelChanges,
  onBack,
  isSaving = false,
  isDisabled = false,
  saveMessage = null,
  saveError = null,
}: EditorHeaderProps) {
  const gridColsClass = `grid-cols-${tabs.length}`;
  const router = useRouter();

  return (
    <>
      <header className="flex items-center justify-between px-4 py-1 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-main whitespace-nowrap">{title}</h2>
          <fieldset
            disabled={isDisabled || isSaving}
            className={isDisabled || isSaving ? "cursor-not-allowed" : ""}
          >
            <Tabs value={activeTab} onValueChange={onTabChange}>
              <TabsList className={`grid w-full ${gridColsClass}`}>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="font-normal text-normal"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </fieldset>
        </div>

        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onThemeChange}>
            {theme === "light" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeviceChange("desktop")}
          >
            <Monitor
              className={`h-4 w-4 ${
                device === "desktop"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeviceChange("mobile")}
          >
            <Smartphone
              className={`h-4 w-4 ${
                device === "mobile"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            />
          </Button>

          <Button
            variant="outline"
            onClick={onCancelChanges}
            className="mx-2 h-8"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button className="h-8" onClick={onSaveChanges} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      {(saveMessage || saveError) && (
        <div className="px-4 py-2">
          {saveMessage && (
            <Alert className="mb-2">
              <AlertDescription className="text-green-600">
                {saveMessage}
              </AlertDescription>
            </Alert>
          )}
          {saveError && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </>
  );
}
