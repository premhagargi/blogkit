"use client";
import { createContext, useState, ReactNode, useContext } from "react";
import { BrandContext } from "@/providers/brand-provider";
import { usePathname, useRouter } from "next/navigation";

export type DeviceType = "desktop" | "mobile";
export type ThemeType = "light" | "dark";

export interface SocialLink {
  id: string;
  link: string;
}

export interface FooterLink {
  id: string;
  name: string;
  link: string;
  order: number;
  openInNewTab: boolean;
}

export interface FooterColumn {
  id: string;
  title: string;
  order: number;
  links: FooterLink[];
}

export interface FooterStyle {
  backgroundColorLight: string;
  textColorLight: string;
  backgroundColorDark: string;
  textColorDark: string;
  borderColor: string;
  borderWidth: number;
}

export type SocialType =
  | "mail"
  | "website"
  | "twitter"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "github"
  | "dribbble"
  | "whatsapp"
  | "external";

export interface SocialLink {
  id: string;
  type: SocialType;
  link: string;
}

interface FooterContextType {
  logoUrls: { light: string; dark: string };
  setLogoUrl: (mode: ThemeType, url: string) => void;
  logoUrl: string;
  setLogoUrlLink: (url: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  socialLinks: SocialLink[];
  setSocialLinks: (links: SocialLink[]) => void;
  addSocialLink: (type: SocialType) => void;
  updateSocialLink: (id: string, link: string) => void;
  deleteSocialLink: (id: string) => void;
  footerColumns: FooterColumn[];
  setFooterColumns: (columns: FooterColumn[]) => void;
  footnote: string;
  setFootnote: (note: string) => void;
  footerStyle: FooterStyle;
  setFooterStyle: (style: FooterStyle) => void;
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  device: DeviceType;
  setDevice: (d: DeviceType) => void;
  saveChanges: () => void;
  cancelChanges: () => void;
  refresh: () => void;
  onBack: () => void;
  customCode: string;
  setCustomCode: (code: string) => void;
  isCustomCodeEnabled: boolean;
  footerTabs: { value: string; label: string }[];
  setIsCustomCodeEnabled: (enabled: boolean) => void;
}

export const FooterContext = createContext<FooterContextType>(null!);

export const FooterProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const slug = pathname?.split("/")?.[1];
  const backUrl = `/${slug}`;
  const { logoUrls, setLogoUrl, faviconUrl, setFaviconUrl } =
    useContext(BrandContext);
  const [logoUrl, setLogoUrlLink] = useState("https://example.com");
  const [description, setDescription] = useState(
    "Graphy empowers teams to transform raw data into clear, compelling visuals — making insights easier to share, understand, and act on."
  );
  const [footerTabs, setFooterTabs] = useState([
    { value: "items", label: "Footer Items" },
    { value: "style", label: "Footer Style" },
  ]);

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { id: "1", type: "dribbble", link: "https://dribbble.com/larocheco" },
    { id: "2", type: "website", link: "https://shosho.co" },
    { id: "3", type: "mail", link: "mailto:eugen@shosho.co" },
  ]);
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([
    {
      id: "col1",
      title: "Product",
      order: 0,
      links: [
        {
          id: "p1",
          name: "Features",
          link: "#",
          order: 0,
          openInNewTab: false,
        },
        { id: "p2", name: "Pricing", link: "#", order: 1, openInNewTab: false },
        {
          id: "p3",
          name: "Integrations",
          link: "#",
          order: 2,
          openInNewTab: false,
        },
        {
          id: "p4",
          name: "Changelog",
          link: "#",
          order: 3,
          openInNewTab: false,
        },
      ],
    },
    {
      id: "col2",
      title: "Resources",
      order: 1,
      links: [
        {
          id: "r1",
          name: "Documentation",
          link: "#",
          order: 0,
          openInNewTab: false,
        },
        {
          id: "r2",
          name: "Tutorials",
          link: "#",
          order: 1,
          openInNewTab: false,
        },
        { id: "r3", name: "Blog", link: "#", order: 2, openInNewTab: false },
        { id: "r4", name: "Support", link: "#", order: 3, openInNewTab: false },
      ],
    },
    {
      id: "col3",
      title: "Company",
      order: 2,
      links: [
        { id: "c1", name: "About", link: "#", order: 0, openInNewTab: false },
        { id: "c2", name: "Careers", link: "#", order: 1, openInNewTab: false },
        { id: "c3", name: "Contact", link: "#", order: 2, openInNewTab: false },
        {
          id: "c4",
          name: "Partners",
          link: "#",
          order: 3,
          openInNewTab: false,
        },
      ],
    },
  ]);
  const [footnote, setFootnote] = useState(
    "© Copyright 2021, All Rights Reserved by Postcraft"
  );
  const [footerStyle, setFooterStyle] = useState<FooterStyle>({
    backgroundColorLight: "#FFFFFF",
    textColorLight: "#000000",
    backgroundColorDark: "#18181B",
    textColorDark: "#FFFFFF",
    borderColor: "#E0E0E0",
    borderWidth: 1,
  });
  const [theme, setTheme] = useState<ThemeType>("light");
  const [device, setDevice] = useState<DeviceType>("desktop");

  const defaultFooterCode = `
<footer style="padding: 2rem; color: black; text-align: center; border-top: 1px solid black; font-family: sans-serif; background-color: #E5E7EB">
  <p>© 2025 Your Company. All Rights Reserved.</p>
  <div style="margin-top: 1rem; display: flex; justify-content: center; gap: 1rem;">
    <a href="#" style="color: black; text-decoration: none;">Privacy Policy</a>
    <a href="#" style="color: black; text-decoration: none;">Terms of Service</a>
  </div>
</footer>
  `.trim();

  // Add new state for custom code
  const [customCode, setCustomCode] = useState(defaultFooterCode);
  const [isCustomCodeEnabled, setIsCustomCodeEnabled] = useState(false);

  const addSocialLink = (type: SocialType) => {
    const newLink: SocialLink = { id: Date.now().toString(), type, link: "" };
    setSocialLinks((prev) => [...prev, newLink]);
  };

  const updateSocialLink = (id: string, link: string) => {
    setSocialLinks(
      socialLinks.map((sl) => (sl.id === id ? { ...sl, link } : sl))
    );
  };

  const deleteSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter((sl) => sl.id !== id));
  };

  const saveChanges = () =>
    console.log("Saved:", {
      logoUrls,
      logoUrl,
      description,
      socialLinks,
      footerColumns,
      footnote,
      footerStyle,
      customCode,
      isCustomCodeEnabled,
    });
  const cancelChanges = () => router.push(backUrl);
  const refresh = () => console.log("Refreshed preview!");
  const onBack = () => router.push(backUrl);

  return (
    <FooterContext.Provider
      value={{
        logoUrls,
        setLogoUrl,
        onBack,
        logoUrl,
        footerTabs,
        setLogoUrlLink,
        description,
        setDescription,
        socialLinks,
        setSocialLinks,
        addSocialLink,
        updateSocialLink,
        deleteSocialLink,
        footerColumns,
        setFooterColumns,
        footnote,
        setFootnote,
        footerStyle,
        setFooterStyle,
        theme,
        setTheme,
        device,
        setDevice,
        saveChanges,
        cancelChanges,
        refresh,
        customCode,
        setCustomCode,
        isCustomCodeEnabled,
        setIsCustomCodeEnabled,
      }}
    >
      {children}
    </FooterContext.Provider>
  );
};
