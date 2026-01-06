"use client";
import {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { produce } from "immer";
import { usePathname, useRouter } from "next/navigation";

// --- Type Definitions ---
export type DeviceType = "desktop" | "mobile";
export type ThemeType = "light" | "dark";
export type CtaType = "EndOfPost" | "Sidebar" | "PopUp" | "Floating" | "InLine";
export type CtaTrigger = "TimeDelay" | "Scroll" | "ExitIntent";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface CtaState {
  ctaName: string;
  type: CtaType;
  categories: string[]; // Changed from single category to array
  tags: string[]; // Added tags array
  trigger: CtaTrigger;
  timeDelay: number;
  scrollTrigger: number;
  content: {
    heading: string;
    description: string;
    primaryButton: { text: string; url: string };
    secondaryButton: { text: string; url: string };
    footnote: string;
  };
  customCode: { isEnabled: boolean; code: string };
}

interface CtaContextType {
  // CTA state
  ctaState: CtaState;
  setCtaState: (state: CtaState) => void;
  updateField: <K extends keyof CtaState>(field: K, value: CtaState[K]) => void;
  updateContentField: <K extends keyof CtaState["content"]>(
    field: K,
    value: CtaState["content"][K]
  ) => void;
  setCustomCode: (code: string) => void;
  setCustomCodeEnabled: (isEnabled: boolean) => void;

  // UI state
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  device: DeviceType;
  ctaTabs: { value: string; label: string }[];
  onBack: () => void;

  setDevice: (d: DeviceType) => void;
  setActiveTab: (tab: string) => void;

  // CTA operations
  saveChanges: () => void;
  cancelChanges: () => void;
  refresh: () => void;

  isCtaVisible: boolean;
  setIsCtaVisible: (visible: boolean) => void;

  // API state
  isSaving: boolean;
  saveMessage: string | null;
  saveError: string | null;
  ctaId: string | null;

  // Categories and Tags state
  categories: Category[];
  tags: Tag[];
  loadingCategories: boolean;
  loadingTags: boolean;
  categoriesError: string | null;
  tagsError: string | null;
  refreshCategories: () => void;
  refreshTags: () => void;
}

export const CtaContext = createContext<CtaContextType>(null!);

const initialState: CtaState = {
  ctaName: "Homepage Welcome CTA",
  type: "PopUp",
  categories: [], // Changed to empty array
  tags: [], // Added empty tags array
  trigger: "TimeDelay",
  timeDelay: 0,
  scrollTrigger: 50,
  content: {
    heading: "This is a big heading for the callout section of the page",
    description: "This is a subheading for the callout section",
    primaryButton: { text: "Main Button", url: "https://example.com" },
    secondaryButton: { text: "Secondary", url: "https://test.com" },
    footnote: "This is a small footnote.",
  },
  customCode: { isEnabled: false, code: "" },
};

export const CtaProvider = ({
  children,
  passedSetActiveTab,
  pageId,
  ctaId = null,
}: {
  children: ReactNode;
  passedSetActiveTab: (tab: string) => void;
  pageId: string;
  ctaId?: string | null;
}) => {
  // CTA state
  const [ctaState, setCtaState] = useState<CtaState>(initialState);
  const [theme, setTheme] = useState<ThemeType>("light");
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [ctaTabs, setCtaTabs] = useState([
    { value: "configure", label: "Configure" },
    { value: "cta", label: "CTA" },
  ]);

  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean);
  const backUrl = "/" + segments.slice(0, -1).join("/");
  const [isCtaVisible, setIsCtaVisible] = useState(false);

  // API state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Categories and Tags state
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [tagsError, setTagsError] = useState<string | null>(null);

  // Categories management
  const loadCategories = useCallback(async () => {
    if (!pageId) return;

    try {
      setLoadingCategories(true);
      setCategoriesError(null);

      // ✅ Use CTA API instead of forms API
      const response = await fetch(`/api/blogs/${pageId}/ctas`);
      const result = await response.json();

      if (result.success) {
        setCategories(result.data.availableCategories || []);
      } else {
        setCategoriesError("Failed to load categories");
        console.error("Failed to load categories:", result.error);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategoriesError("Error loading categories");
    } finally {
      setLoadingCategories(false);
    }
  }, [pageId]);

  const loadTags = useCallback(async () => {
    if (!pageId) return;

    try {
      setLoadingTags(true);
      setTagsError(null);

      // ✅ Use CTA API instead of forms API
      const response = await fetch(`/api/blogs/${pageId}/ctas`);
      const result = await response.json();

      if (result.success) {
        setTags(result.data.availableTags || []);
      } else {
        setTagsError("Failed to load tags");
        console.error("Failed to load tags:", result.error);
      }
    } catch (error) {
      console.error("Error loading tags:", error);
      setTagsError("Error loading tags");
    } finally {
      setLoadingTags(false);
    }
  }, [pageId]);

  const refreshCategories = () => {
    loadCategories();
  };

  const refreshTags = () => {
    loadTags();
  };

  // CTA data management
  const loadCtaData = useCallback(
    async (ctaIdToLoad: string) => {
      try {
        const response = await fetch(
          `/api/blogs/${pageId}/ctas/${ctaIdToLoad}`
        );
        const result = await response.json();

        if (result.success) {
          setCtaState(result.data.cta.config);
        } else {
          setSaveError("Failed to load CTA data");
        }
      } catch (error) {
        console.error("Error loading CTA data:", error);
        setSaveError("Error loading CTA data");
      }
    },
    [pageId]
  );

  const updateField = <K extends keyof CtaState>(
    field: K,
    value: CtaState[K]
  ) => {
    setCtaState(
      produce((draft) => {
        (draft as any)[field] = value;
      })
    );
  };

  const updateContentField = <K extends keyof CtaState["content"]>(
    field: K,
    value: CtaState["content"][K]
  ) => {
    setCtaState(
      produce((draft) => {
        (draft.content as any)[field] = value;
      })
    );
  };

  const setCustomCode = (code: string) => {
    setCtaState(
      produce((draft) => {
        draft.customCode.code = code;
      })
    );
  };

  const setCustomCodeEnabled = (isEnabled: boolean) => {
    setCtaState(
      produce((draft) => {
        draft.customCode.isEnabled = isEnabled;
      })
    );
  };

  // CTA operations
  const saveChanges = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const payload = {
        config: ctaState,
      };
      console.log(ctaState);
      let response;

      if (ctaId) {
        // Update existing CTA
        response = await fetch(`/api/blogs/${pageId}/ctas`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ctaId: ctaId,
            config: ctaState,
          }),
        });
      } else {
        // Create new CTA
        response = await fetch(`/api/blogs/${pageId}/ctas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (result.success) {
        setSaveMessage(result.data.message || "CTA saved successfully!");

        // If creating new CTA, redirect to edit mode
        if (!ctaId && result.data.cta?.id) {
          setTimeout(() => {
            router.push(
              `${window.location.pathname}?ctaId=${result.data.cta.id}`
            );
          }, 1000);
        }
      } else {
        setSaveError(result.error || "Failed to save CTA");
        if (result.details) {
          console.error("Validation errors:", result.details);
        }
      }
    } catch (error) {
      console.error("Error saving CTA:", error);
      setSaveError("Network error. Please try again.");
    } finally {
      setIsSaving(false);

      // Clear messages after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
        setSaveError(null);
      }, 3000);
    }
  };

  const cancelChanges = () => {
    setCtaState(initialState);
    setSaveMessage(null);
    setSaveError(null);
    router.push(backUrl);
  };

  const onBack = () => router.push(backUrl);

  const refresh = () => {
    if (ctaId) {
      loadCtaData(ctaId);
    }
    loadCategories();
    loadTags();
  };

  // Load categories, tags and CTA data on mount
  useEffect(() => {
    loadCategories();
    loadTags();
    if (ctaId) {
      loadCtaData(ctaId);
    }
  }, [pageId, ctaId, loadCategories, loadTags, loadCtaData]);

  return (
    <CtaContext.Provider
      value={{
        // CTA state
        ctaState,
        setCtaState,
        updateField,
        updateContentField,
        setCustomCode,
        setCustomCodeEnabled,

        // UI state
        theme,
        setTheme,
        device,
        setDevice,
        setActiveTab: passedSetActiveTab,

        // CTA operations
        saveChanges,
        cancelChanges,
        refresh,

        onBack,
        ctaTabs,
        // API state
        isSaving,
        saveMessage,
        saveError,
        ctaId,

        // Categories and Tags state
        categories,
        tags,
        loadingCategories,
        isCtaVisible,
        setIsCtaVisible,
        loadingTags,
        categoriesError,
        tagsError,
        refreshCategories,
        refreshTags,
      }}
    >
      {children}
    </CtaContext.Provider>
  );
};
