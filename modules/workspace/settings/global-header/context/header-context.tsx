"use client";
import { BrandContext } from "@/providers/brand-provider";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useState, ReactNode, useContext } from "react";

export type DeviceType = "desktop" | "mobile";
export type ThemeType = "light" | "dark";
export type ItemType = "Link" | "List" | "Button";
export type Alignment = "left" | "center" | "right";
export type ButtonStyle = "solid" | "outline";

export interface SubHeaderItem {
  id: string;
  name: string;
  link: string;
  order: number;
  openInNewTab: boolean;
}

export interface HeaderItem {
  id: string;
  name: string;
  type: ItemType;
  order: number;
  alignment: Alignment;
  link?: string;
  openInNewTab?: boolean;
  buttonStyle?: ButtonStyle;
  textColor?: string;
  buttonColor?: string;
  children?: SubHeaderItem[];
}

export interface HeaderStyle {
  height: number;
  backgroundColorLight: string;
  textColorLight: string;
  backgroundColorDark: string;
  textColorDark: string;
  borderColor: string;
  borderWidth: number;
  sticky: boolean;
  buttonRadius: number;
}

interface HeaderContextType {
  logoUrls: { light: string; dark: string };
  setLogoUrl: (mode: ThemeType, url: string) => void;
  headerItems: HeaderItem[];
  setHeaderItems: (items: HeaderItem[]) => void;
  headerStyle: HeaderStyle;
  logoUrl: string;
  faviconUrl: string;
  headerTabs: { value: string; label: string }[];
  setFaviconUrl: (url: string) => void;
  setLogoUrlLink: (url: string) => void;
  setHeaderStyle: (style: HeaderStyle) => void;
  addItem: (item: Omit<HeaderItem, "id" | "order">) => void;
  updateItem: (item: HeaderItem) => void;
  deleteItem: (id: string) => void;
  toggleAlignment: (id: string) => void;
  addSubItem: (
    parentId: string,
    subItem: Omit<SubHeaderItem, "id" | "order">
  ) => void;
  updateSubItem: (parentId: string, subItem: SubHeaderItem) => void;
  deleteSubItem: (parentId: string, subItemId: string) => void;
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
  setIsCustomCodeEnabled: (enabled: boolean) => void;
}

export const HeaderContext = createContext<HeaderContextType>(null!);

export const HeaderProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const slug = pathname?.split("/")?.[1];
  const backUrl = `/${slug}`;
  const { logoUrls, setLogoUrl, faviconUrl, setFaviconUrl } =
    useContext(BrandContext);
  const [logoUrl, setLogoUrlLink] = useState("https://example.com");
  const [headerTabs, setHeaderTabs] = useState([
    { value: "items", label: "Header Items" },
    { value: "style", label: "Header Style" },
  ]);
  const [headerItems, setHeaderItems] = useState<HeaderItem[]>([
    {
      id: "0",
      name: "Home",
      type: "Link",
      link: "#",
      order: 0,
      alignment: "left",
      openInNewTab: false,
      textColor: "#000000",
    },
    {
      id: "1",
      name: "About",
      type: "Link",
      link: "#",
      order: 1,
      alignment: "left",
      openInNewTab: false,
      textColor: "#000000",
    },
    {
      id: "2",
      name: "Resources",
      type: "List",
      order: 2,
      alignment: "left",
      children: [
        { id: "sub-1", name: "Guide", link: "#", order: 0, openInNewTab: true },
        { id: "sub-2", name: "Blog", link: "#", order: 1, openInNewTab: false },
      ],
    },
    {
      id: "3",
      name: "Log In",
      type: "Button",
      order: 3,
      alignment: "right",
      buttonStyle: "outline",
      buttonColor: "#B3B3B3",
    },
    {
      id: "4",
      name: "Get Started",
      type: "Button",
      order: 4,
      alignment: "right",
      buttonStyle: "solid",
      buttonColor: "#000000",
      textColor: "#FFFFFF",
    },
  ]);
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>({
    height: 60,
    backgroundColorLight: "#FFFFFF",
    textColorLight: "#000000",
    backgroundColorDark: "#18181B",
    textColorDark: "#FFFFFF",
    borderColor: "#E0E0E0",
    borderWidth: 2,
    sticky: true,
    buttonRadius: 8,
  });
  const defaultNavbarCode = `
<nav style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background-color: #f8f9fa; border-bottom: 1px solid #dee2e6; font-family: sans-serif;">
  <div style="font-size: 1.5rem; font-weight: bold;">Logo</div>
  <div style="display: flex; gap: 1.5rem;">
    <a href="#" style="text-decoration: none; color: #333;">Home</a>
    <a href="#" style="text-decoration: none; color: #333;">Features</a>
    <a href="#" style="text-decoration: none; color: #333;">Pricing</a>
  </div>
</nav>
  `.trim();
  const [theme, setTheme] = useState<ThemeType>("light");
  const [device, setDevice] = useState<DeviceType>("desktop");

  const [customCode, setCustomCode] = useState(defaultNavbarCode);

  const [isCustomCodeEnabled, setIsCustomCodeEnabled] = useState(false);

  const addItem = (item: Omit<HeaderItem, "id" | "order">) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      order: headerItems.length,
    };
    setHeaderItems([...headerItems, newItem]);
  };

  const updateItem = (updatedItem: HeaderItem) => {
    setHeaderItems(
      headerItems.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setHeaderItems(headerItems.filter((item) => item.id !== id));
  };

  const toggleAlignment = (id: string) => {
    setHeaderItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const alignments: Alignment[] = ["left", "center", "right"];
          const currentIndex = alignments.indexOf(item.alignment);
          const nextIndex = (currentIndex + 1) % alignments.length;
          return { ...item, alignment: alignments[nextIndex] };
        }
        return item;
      })
    );
  };

  const addSubItem = (
    parentId: string,
    subItem: Omit<SubHeaderItem, "id" | "order">
  ) => {
    const newSubItem = { ...subItem, id: `sub-${Date.now()}`, order: 0 };
    setHeaderItems(
      headerItems.map((item) => {
        if (item.id === parentId) {
          const children = item.children || [];
          newSubItem.order = children.length;
          return { ...item, children: [...children, newSubItem] };
        }
        return item;
      })
    );
  };

  const updateSubItem = (parentId: string, updatedSubItem: SubHeaderItem) => {
    setHeaderItems(
      headerItems.map((item) => {
        if (item.id === parentId) {
          const updatedChildren = item.children?.map((child) =>
            child.id === updatedSubItem.id ? updatedSubItem : child
          );
          return { ...item, children: updatedChildren };
        }
        return item;
      })
    );
  };

  const deleteSubItem = (parentId: string, subItemId: string) => {
    setHeaderItems(
      headerItems.map((item) => {
        if (item.id === parentId) {
          const filteredChildren = item.children?.filter(
            (child) => child.id !== subItemId
          );
          return { ...item, children: filteredChildren };
        }
        return item;
      })
    );
  };

  const saveChanges = () =>
    console.log("Saved:", {
      logoUrls,
      headerItems,
      headerStyle,
      customCode,
      isCustomCodeEnabled,
    });
  const cancelChanges = () => router.push(backUrl);
  const refresh = () => console.log("Refreshed preview!");
  const onBack = () => router.push(backUrl);

  return (
    <HeaderContext.Provider
      value={{
        logoUrls,
        logoUrl,
        onBack,
        setLogoUrlLink,
        setLogoUrl,
        headerItems,
        setHeaderItems,
        faviconUrl,
        setFaviconUrl,
        headerStyle,
        setHeaderStyle,
        addItem,
        updateItem,
        deleteItem,
        toggleAlignment,
        addSubItem,
        updateSubItem,
        deleteSubItem,
        theme,
        setTheme,
        device,
        headerTabs,
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
    </HeaderContext.Provider>
  );
};
