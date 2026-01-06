"use client";
import { useState, useContext, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FormConfigure from "./sidebar/form-configure";
import FormFields from "./sidebar/form-fields";
import FormConfirmation from "./sidebar/form-confirmation";
import FormAction from "./sidebar/form-action";
import ContentPanel from "./content/content-panel";
import { FormProvider, FormContext } from "./context/form-context";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useSidebar } from "@/components/ui/sidebar";
import CustomCode from "./sidebar/custom-code";
import EditorHeader from "@/components/common/editor-header";
import DynamicForm from "./content/dynamic-form";
import { Button } from "@/components/ui/button";
import parse from "html-react-parser";

const SidebarContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case "configure":
      return <FormConfigure />;
    case "form":
      return <FormFields />;
    case "confirmation":
      return <FormConfirmation />;
    case "action":
      return <FormAction />;
    default:
      return <FormConfigure />;
  }
};

// Extracted ConfirmationMessage to be used here
const ConfirmationMessage = () => {
  const { formState, theme, setIsConfirmationVisible } =
    useContext(FormContext);
  const { confirmation } = formState;
  const isDark = theme === "dark";

  const handleButtonClick = () => {
    if (confirmation.buttonType === "Link" && confirmation.url) {
      window.open(
        confirmation.url,
        confirmation.openInNewTab ? "_blank" : "_self"
      );
    }
    setIsConfirmationVisible(false);
  };

  const confirmationClasses = cn(
    "px-10 py-6 rounded-lg flex flex-col items-center justify-center gap-2 w-full max-w-[400px] mx-auto shadow-xl text-center",
    isDark ? "bg-zinc-800 text-gray-200" : "bg-white text-gray-800"
  );

  return (
    <div className={confirmationClasses}>
      <h2 className="text-header">{confirmation.heading}</h2>
      <p className="text-head">{parse(confirmation.description)}</p>
      <Button onClick={handleButtonClick} className="mt-4">
        {confirmation.buttonText}
      </Button>
    </div>
  );
};

const FormDashboard = ({
  activeTab,
  setActiveTab, // This prop is essential
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const {
    device,
    formState,
    setCustomCodeEnabled,
    isFormVisible,
    isConfirmationVisible,
    setIsFormAndConfirmationVisible,
  } = useContext(FormContext);

  const { formType, isMandatory } = formState;
  const isCustomCodeActive = formState.customCode.isEnabled;
  const { closeSidebar, openSidebar } = useSidebar();

  useEffect(() => {
    closeSidebar();
    return () => openSidebar();
  }, [closeSidebar, openSidebar]);

  // ✅ 1. Create a single, reusable function to exit the custom code view
  // This function will disable the feature AND switch to the 'configure' tab.
  const handleExitCustomCode = () => {
    setCustomCodeEnabled(false);
    setActiveTab("configure");
  };

  const handleOverlayClick = () => {
    if (!isMandatory && setIsFormAndConfirmationVisible) {
      setIsFormAndConfirmationVisible(false);
    }
  };

  const isOverlayFormVisible =
    (formType === "PopUp" || formType === "Gated") && isFormVisible;

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

        {activeTab === "form" && !isCustomCodeActive && (
          <div className="mt-auto border-t px-5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-normal">Embed Form &lt;/&gt;</span>
              <div className="flex items-center gap-2">
                <p className="text-sm">
                  {formState.customCode.isEnabled ? "Enabled" : "Disabled"}
                </p>
                <Switch
                  checked={formState.customCode.isEnabled}
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
            "relative h-full overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 transition-all duration-500 ease-in-out",
            device === "mobile" ? "w-full max-w-[420px]" : "w-full max-w-none"
          )}
        >
          <div
            id="form-preview-container"
            className="h-full w-full overflow-y-auto"
          >
            <ContentPanel />
          </div>

          {/* --- MODAL AND OVERLAY LOGIC IS NOW HERE --- */}
          {isOverlayFormVisible && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center p-4"
              onClick={handleOverlayClick}
            >
              <div
                className={cn(
                  "absolute inset-0 ",
                  formType === "Gated" && "backdrop-blur-sm bg-black/60"
                )}
              ></div>
              <div
                className="relative z-30"
                onClick={(e) => e.stopPropagation()}
              >
                {isConfirmationVisible ? (
                  <ConfirmationMessage />
                ) : (
                  <DynamicForm />
                )}
              </div>
            </div>
          )}

          {formType === "Floating" && isFormVisible && (
            <div className="absolute bottom-5 right-5 z-20 max-w-[400px]">
              {isConfirmationVisible ? (
                <ConfirmationMessage />
              ) : (
                <DynamicForm />
              )}
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
    theme,
    setTheme,
    device,
    setDevice,
    saveChanges,
    cancelChanges,
    isSaving,
    saveMessage,
    saveError,
    formTabs,
    onBack,
    formState,
  } = useContext(FormContext);
  const isCustomCodeActive = formState.customCode.isEnabled;

  return (
    <>
      <EditorHeader
        title="Form"
        tabs={formTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onThemeChange={() => setTheme(theme === "light" ? "dark" : "light")}
        device={device}
        onDeviceChange={setDevice}
        onSaveChanges={saveChanges}
        onCancelChanges={cancelChanges}
        onBack={onBack}
        isSaving={isSaving}
        saveMessage={saveMessage}
        saveError={saveError}
        isDisabled={isCustomCodeActive}
      />
      <FormDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

export default function MainLayout({ pageId }: { pageId: string }) {
  const [activeTab, setActiveTab] = useState("configure");
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <FormProvider
        passedSetActiveTab={setActiveTab}
        pageId={pageId}
        formId={formId}
      >
        <LayoutContent activeTab={activeTab} setActiveTab={setActiveTab} />
      </FormProvider>
    </div>
  );
}
