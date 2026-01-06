export interface CtaConfig {
  ctaName: string;
  type: 'EndOfPost' | 'Sidebar' | 'InLine' | 'PopUp' | 'Floating';
  categories: string[];
  tags: string[];
  trigger: 'TimeDelay' | 'Scroll' | 'ExitIntent';
  timeDelay: number;
  scrollTrigger: number;

  content: {
    heading: string;
    description: string;
    primaryButton: { text: string; url: string };
    secondaryButton: { text: string; url: string };
    footnote: string;
  };

  customCode: {
    isEnabled: boolean;
    code: string;
  };
}

export interface StoredCtaConfig {
  id: string;
  config: CtaConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PageCtasConfig {
  ctas: StoredCtaConfig[];
  categoryMapping: { [categoryId: string]: string };
  tagMapping?: { [tagId: string]: string };
  globalDefaultCtaId?: string;
  lastUpdated: string;
}
