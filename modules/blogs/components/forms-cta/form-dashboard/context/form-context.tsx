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
export type FormType =
  | "EndOfPost"
  | "Sidebar"
  | "InLine"
  | "PopUp"
  | "Floating"
  | "Gated";
export type FormTrigger = "TimeDelay" | "Scroll" | "ExitIntent";
export type FieldType =
  | "Email"
  | "Password"
  | "ShortText"
  | "LongText"
  | "Phone"
  | "Country"
  | "Select"
  | "MultiSelect";
export type ConfirmationButtonType = "Close" | "Link";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  isRequired: boolean;
  options?: string[];
  order: number;
}

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

export interface FormState {
  formName: string;
  heading: string;
  description: string;
  formType: FormType;
  categories: string[];
  tags: string[];
  formTrigger: FormTrigger;
  timeDelay: number;
  scrollTrigger: number;
  isMandatory: boolean;
  fields: FormField[];
  buttonText: string;
  footnote: string;
  isMultiStep: boolean;
  confirmation: {
    heading: string;
    description: string;
    buttonText: string;
    buttonType: ConfirmationButtonType;
    url?: string;
    openInNewTab?: boolean;
  };
  embedCode: { isEnabled: boolean; code: string };
  customCode: { isEnabled: boolean; code: string };
  formValues: { [fieldId: string]: any };
}

interface FormContextType {
  formState: FormState;
  setFormState: (state: FormState) => void;
  updateField: <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => void;
  addField: (field: Omit<FormField, "id" | "order">) => void;
  updateFormField: (field: FormField) => void;
  deleteFormField: (id: string) => void;
  setFields: (fields: FormField[]) => void;
  isFormVisible: boolean;
  setIsFormVisible: (isEnabled: boolean) => void;
  setIsFormAndConfirmationVisible: (visible: boolean) => void;
  updateFieldValue: (fieldId: string, value: any) => void;
  setEmbedCodeEnabled: (isEnabled: boolean) => void;
  setCustomCodeEnabled: (isEnabled: boolean) => void;
  setCustomCode: (code: string) => void;
  formTabs: { value: string; label: string }[];
  onBack: () => void;
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  device: DeviceType;
  setDevice: (d: DeviceType) => void;
  setActiveTab: (tab: string) => void;
  isConfirmationVisible: boolean;
  setIsConfirmationVisible: (visible: boolean) => void;
  saveChanges: () => void;
  cancelChanges: () => void;
  refresh: () => void;
  isSaving: boolean;
  saveMessage: string | null;
  saveError: string | null;
  formId: string | null;
  categories: Category[];
  tags: Tag[];
  loadingCategories: boolean;
  loadingTags: boolean;
  categoriesError: string | null;
  tagsError: string | null;
  refreshCategories: () => void;
  refreshTags: () => void;
}

export const FormContext = createContext<FormContextType>(null!);

const initialState: FormState = {
  formName: "Newsletter form",
  heading: "Subscribe to Our Newsletter",
  description: "Get the latest news and updates.\nNo spam, we promise.",
  formType: "PopUp",
  categories: [],
  tags: [],
  formTrigger: "TimeDelay",
  timeDelay: 0,
  scrollTrigger: 50,
  isMandatory: true,
  fields: [
    {
      id: "1",
      type: "Email",
      label: "Email*",
      placeholder: "you@example.com",
      isRequired: true,
      order: 0,
    },
    // {
    //   id: "2",
    //   type: "ShortText",
    //   label: "First Name",
    //   placeholder: "Jane",
    //   isRequired: false,
    //   order: 1,
    // },
    // {
    //   id: "3",
    //   type: "Select",
    //   label: "What are you interested in?",
    //   isRequired: true,
    //   order: 2,
    //   options: ["Marketing", "Design", "Development"],
    // },
    {
      id: "4",
      type: "Phone",
      label: "Phone Number",
      placeholder: "+91 9876543210",
      isRequired: true,
      order: 1,
    },
    {
      id: "5",
      type: "Country",
      label: "Country",
      placeholder: "Select your country",
      isRequired: true,
      order: 2,
    },
  ],
  buttonText: "Sign Up Now",
  footnote: "By signing up, you agree to our Terms of Service.",
  isMultiStep: false,
  confirmation: {
    heading: "Thank You!",
    description: "Your submission has been received.",
    buttonText: "Close",
    buttonType: "Close",
    url: "",
    openInNewTab: true,
  },
  embedCode: { isEnabled: false, code: "" },
  customCode: { isEnabled: false, code: "" },
  formValues: {},
};

export const FormProvider = ({
  children,
  passedSetActiveTab,
  pageId,
  formId = null,
}: {
  children: ReactNode;
  passedSetActiveTab: (tab: string) => void;
  pageId: string;
  formId?: string | null;
}) => {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [theme, setTheme] = useState<ThemeType>("light");
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formTabs, setFormTabs] = useState([
    { value: "configure", label: "Configure" },
    { value: "form", label: "Form" },
    { value: "confirmation", label: "Confirmation" },
    { value: "action", label: "Action" },
  ]);

  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean);
  const backUrl = "/" + segments.slice(0, -1).join("/");

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!pageId) return;
    try {
      setLoadingCategories(true);
      setCategoriesError(null);
      const response = await fetch(`/api/blogs/${pageId}/forms`);
      const result = await response.json();
      if (result.success) {
        setCategories(result.data.availableCategories || []);
      } else {
        setCategoriesError("Failed to load categories");
      }
    } catch (error) {
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
      const response = await fetch(`/api/blogs/${pageId}/forms`);
      const result = await response.json();
      if (result.success) {
        setTags(result.data.availableTags || []);
      } else {
        setTagsError("Failed to load tags");
      }
    } catch (error) {
      setTagsError("Error loading tags");
    } finally {
      setLoadingTags(false);
    }
  }, [pageId]);

  const refreshCategories = () => loadCategories();
  const refreshTags = () => loadTags();

  const loadFormData = useCallback(
    async (formIdToLoad: string) => {
      try {
        const response = await fetch(
          `/api/blogs/${pageId}/forms/${formIdToLoad}`
        );
        const result = await response.json();
        if (result.success) {
          setFormState(result.data.form.config);
        } else {
          setSaveError("Failed to load form data");
        }
      } catch (error) {
        setSaveError("Error loading form data");
      }
    },
    [pageId]
  );

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setFormState(
      produce((draft) => {
        (draft as any)[field] = value;
      })
    );
  };

  const addField = (field: Omit<FormField, "id" | "order">) => {
    setFormState(
      produce((draft) => {
        draft.fields.push({
          ...field,
          id: Date.now().toString(),
          order: draft.fields.length,
        });
      })
    );
  };

  const updateFormField = (updatedField: FormField) => {
    setFormState(
      produce((draft) => {
        const index = draft.fields.findIndex((f) => f.id === updatedField.id);
        if (index !== -1) draft.fields[index] = updatedField;
      })
    );
  };

  const deleteFormField = (id: string) => {
    setFormState(
      produce((draft) => {
        draft.fields = draft.fields.filter((f) => f.id !== id);
      })
    );
  };

  const setFields = (fields: FormField[]) => {
    setFormState(
      produce((draft) => {
        draft.fields = fields;
      })
    );
  };

  const setIsFormAndConfirmationVisible = (visible: boolean) => {
    setIsFormVisible(visible);
    setIsConfirmationVisible(visible);
  };

  const setEmbedCodeEnabled = (isEnabled: boolean) => {
    setFormState(
      produce((draft) => {
        draft.embedCode.isEnabled = isEnabled;
      })
    );
  };

  const setCustomCodeEnabled = (isEnabled: boolean) => {
    setFormState(
      produce((draft) => {
        draft.customCode.isEnabled = isEnabled;
      })
    );
  };

  const setCustomCode = (code: string) => {
    setFormState(
      produce((draft) => {
        draft.customCode.code = code;
      })
    );
  };

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormState(
      produce((draft) => {
        draft.formValues[fieldId] = value;
      })
    );
  };

  const saveChanges = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const payload = { config: formState, values: formState.formValues };
      const response = formId
        ? await fetch(`/api/blogs/${pageId}/forms`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formId: formId, config: formState }),
          })
        : await fetch(`/api/blogs/${pageId}/forms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const result = await response.json();
      if (result.success) {
        setSaveMessage(result.data.message || "Form saved successfully!");
        if (!formId && result.data.form?.id) {
          setTimeout(() => {
            router.push(
              `${window.location.pathname}?formId=${result.data.form.id}`
            );
          }, 1000);
        }
      } else {
        setSaveError(result.error || "Failed to save form");
      }
    } catch (error) {
      setSaveError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveMessage(null);
        setSaveError(null);
      }, 3000);
    }
  };

  const cancelChanges = () => {
    setFormState(initialState);
    router.push(backUrl);
  };

  const onBack = () => router.push(backUrl);
  const refresh = () => {
    if (formId) loadFormData(formId);
    loadCategories();
    loadTags();
  };

  useEffect(() => {
    loadCategories();
    loadTags();
    if (formId) loadFormData(formId);
  }, [pageId, formId, loadCategories, loadTags, loadFormData]);

  return (
    <FormContext.Provider
      value={{
        formState,
        setFormState,
        updateField,
        addField,
        updateFormField,
        deleteFormField,
        setFields,
        updateFieldValue,
        setEmbedCodeEnabled,
        setCustomCodeEnabled,
        setCustomCode,
        theme,
        setTheme,
        device,
        setDevice,
        setActiveTab: passedSetActiveTab,
        isConfirmationVisible,
        setIsConfirmationVisible,
        saveChanges,
        cancelChanges,
        refresh,
        isSaving,
        saveMessage,
        saveError,
        formId,
        formTabs,
        onBack,
        categories,
        tags,
        loadingCategories,
        loadingTags,
        categoriesError,
        tagsError,
        refreshCategories,
        refreshTags,
        isFormVisible,
        setIsFormVisible,
        setIsFormAndConfirmationVisible,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
