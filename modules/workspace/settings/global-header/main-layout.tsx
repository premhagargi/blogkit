"use client";
import { useState, useContext, useEffect } from "react";
import HeaderItems from "./sidebar/header-items";
import HeaderStyle from "./sidebar/header-style";
import CustomCode from "./sidebar/custom-code"; // Import new component
import ContentPanel from "./content/content-panel";
import { HeaderContext } from "./context/header-context";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useSidebar } from "@/components/ui/sidebar";
import EditorHeader from "@/components/common/editor-header";
import { useRouter, usePathname } from "next/navigation";

export default function MainLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const slug = pathname?.split("/")?.[1];
  const backUrl = `/${slug}`;
  const [activeTab, setActiveTab] = useState("items");
  const {
    theme,
    setTheme,
    device,
    setDevice,
    saveChanges,
    cancelChanges,
    headerTabs,
    onBack,
    isCustomCodeEnabled,
    setIsCustomCodeEnabled
  } = useContext(HeaderContext);


  const { closeSidebar, openSidebar } = useSidebar();

  useEffect(() => {
    closeSidebar();
    return () => {
      openSidebar();
    };
  }, [closeSidebar, openSidebar]);

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <EditorHeader
        title="Header"
        tabs={headerTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onThemeChange={() => setTheme(theme === "light" ? "dark" : "light")}
        device={device}
        onDeviceChange={setDevice}
        onSaveChanges={saveChanges}
        onCancelChanges={cancelChanges}
        onBack={onBack}
        isDisabled={isCustomCodeEnabled}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[380px] bg-background border-r p-0 pl-1 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {isCustomCodeEnabled ? (
              <CustomCode onBack={() => setIsCustomCodeEnabled(false)} isCustomCodeEnabled={isCustomCodeEnabled} />
            ) : activeTab === "items" ? (
              <HeaderItems />
            ) : (
              <HeaderStyle />
            )}
          </div>

          {(!isCustomCodeEnabled && activeTab === "items") && (
            <div className="mt-auto border-t px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-normal">Custom Code &lt;/&gt;</span>
                <div className="flex align-center gap-2">
                  <p className="text-small">Disabled</p>
                  <Switch
                    checked={isCustomCodeEnabled}
                    onCheckedChange={setIsCustomCodeEnabled}
                  />
                </div>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 bg-gray-100 dark:bg-zinc-900 overflow-y-auto flex justify-center p-2">
          <div
            className={cn(
              "relative h-full overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 transition-all duration-500 ease-in-out",
              device === "mobile" ? "w-full max-w-[420px]" : "w-full max-w-none"
            )}
          >
            <div className="h-full w-full overflow-y-auto">
              <ContentPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
