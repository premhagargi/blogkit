"use client";
import { useState, useContext, useEffect } from "react";
import CtaConfigure from "./sidebar/cta-configure";
import CtaEditor from "./sidebar/cta-editor";
import CustomCode from "./sidebar/custom-code";
import ContentPanel from "./content/content-panel";
import { CtaProvider, CtaContext } from "./context/cta-context";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useSidebar } from "@/components/ui/sidebar";
import { useSearchParams } from "next/navigation";
import EditorHeader from "@/components/common/editor-header";
import DynamicCta from "./content/dynamic-cta"; // Import DynamicCta

const SidebarContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case "configure":
      return <CtaConfigure />;
    case "cta":
      return <CtaEditor />;
    default:
      return <CtaConfigure />;
  }
};

const CtaDashboard = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const {
    ctaState,
    setCustomCodeEnabled,
    device,
    isCtaVisible,
    setIsCtaVisible,
  } = useContext(CtaContext);
  const { type } = ctaState;
  const isCustomCodeActive = ctaState.customCode.isEnabled;
  const { closeSidebar, openSidebar } = useSidebar();

  useEffect(() => {
    closeSidebar();
    return () => openSidebar();
  }, [closeSidebar, openSidebar]);

  // ✅ 1. Create a unified handler to exit custom code view and switch tabs.
  const handleExitCustomCode = () => {
    setCustomCodeEnabled(false);
    setActiveTab("configure");
  };

  const handleOverlayClick = () => {
    setIsCtaVisible(false);
  };

  const isOverlayCtaVisible = type === "PopUp" && isCtaVisible;

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-[380px] bg-background border-r p-0 pl-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4">
          {isCustomCodeActive ? (
            <CustomCode onBack={handleExitCustomCode} />
          ) : (
            <SidebarContent activeTab={activeTab} />
          )}
        </div>
        {activeTab === "cta" && !isCustomCodeActive && (
          <div className="mt-auto border-t px-5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-normal">Custom Code &lt;/&gt;</span>
              <div className="flex items-center gap-2">
                <p className="text-sm">
                  {isCustomCodeActive ? "Enabled" : "Disabled"}
                </p>
                <Switch
                  checked={isCustomCodeActive}
                  // ✅ 4. Update the Switch to use the handler when toggled.
                  onCheckedChange={(isChecked) => {
                    if (isChecked) {
                      setCustomCodeEnabled(true);
                    } else {
                      handleExitCustomCode();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </aside>
      <main className="flex-1 bg-gray-100 dark:bg-zinc-900 overflow-y-auto flex justify-center p-2">
        <div
          className={cn(
            "relative h-full overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5",
            device === "mobile" ? "w-full max-w-[420px]" : "w-full max-w-none"
          )}
        >
          <div
            id="cta-preview-container"
            className="h-full w-full overflow-y-auto"
          >
            <ContentPanel />
          </div>

          {/* --- MODAL AND OVERLAY LOGIC IS NOW HERE --- */}
          {isOverlayCtaVisible && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center p-4 "
              onClick={handleOverlayClick}
            >
              <div
                className="relative z-30"
                onClick={(e) => e.stopPropagation()}
              >
                <DynamicCta />
              </div>
            </div>
          )}

          {type === "Floating" && isCtaVisible && (
            <div className="absolute bottom-5 right-5 z-20 max-w-[500px]">
              <DynamicCta />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const LayoutContent = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const {
    ctaTabs,
    ctaState,
    onBack,
    theme,
    setTheme,
    device,
    setDevice,
    saveChanges,
    cancelChanges,
  } = useContext(CtaContext);

  const isCustomCodeActive = ctaState.customCode.isEnabled;

  return (
    <>
      <EditorHeader
        title="CTA"
        tabs={ctaTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onThemeChange={() => setTheme(theme === "light" ? "dark" : "light")}
        device={device}
        onDeviceChange={setDevice}
        onSaveChanges={saveChanges}
        onCancelChanges={cancelChanges}
        onBack={onBack}
        isDisabled={isCustomCodeActive}
      />
      <CtaDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

export default function MainLayout({ pageId }: { pageId: string }) {
  const [activeTab, setActiveTab] = useState("configure");
  const searchParams = useSearchParams();
  const ctaId = searchParams.get("ctaId");
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <CtaProvider
        pageId={pageId}
        ctaId={ctaId}
        passedSetActiveTab={setActiveTab}
      >
        <LayoutContent activeTab={activeTab} setActiveTab={setActiveTab} />
      </CtaProvider>
    </div>
  );
}
