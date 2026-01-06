export interface FormField {
  id: string;
  type:
    | 'Email'
    | 'ShortText'
    | 'LongText'
    | 'Phone'
    | 'Country'
    | 'Select'
    | 'MultiSelect';
  label: string;
  placeholder?: string;
  isRequired: boolean;
  options?: string[];
  order: number;
}

export interface FormConfirmation {
  heading: string;
  description: string;
  buttonText: string;
  buttonType: 'Close' | 'Link';
  url?: string;
  openInNewTab?: boolean;
}

export interface FormConfig {
  formName: string;
  heading: string;
  description: string;
  formType: 'EndOfPost' | 'Sidebar' | 'InLine' | 'PopUp' | 'Floating' | 'Gated';
  categories: string[];
  tags: string[];
  formTrigger: 'TimeDelay' | 'Scroll' | 'ExitIntent';
  timeDelay: number;
  scrollTrigger: number;
  isMandatory: boolean;
  fields: FormField[];
  buttonText: string;
  footnote: string;
  isMultiStep: boolean;
  confirmation: FormConfirmation;
  embedCode: {
    isEnabled: boolean;
    code: string;
  };
  customCode: {
    isEnabled: boolean;
    code: string;
  };
  formValues: { [fieldId: string]: any };
}

// What we'll store in database
export interface StoredFormConfig {
  id: string; // Generated form ID
  name: string; // formName from frontend
  categoryIds: string[]; // Array of category IDs
  tagIds: string[]; // Array of tag IDs
  config: FormConfig; // Full config from frontend
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// Page forms structure
export interface PageFormsConfig {
  forms: StoredFormConfig[];
  categoryFormMapping: { [categoryId: string]: string }; // categoryId -> formId
  globalDefaultFormId?: string;
}
