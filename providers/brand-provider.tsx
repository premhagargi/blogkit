"use client";
import { createContext, useState, ReactNode } from "react";

export type ThemeType = "light" | "dark";

interface BrandContextType {
  logoUrls: { light: string; dark: string };
  faviconUrl: string;
  setLogoUrl: (mode: ThemeType, url: string) => void;
  setFaviconUrl: (url: string) => void;
  darkModeEnabled: boolean;
  setDarkModeEnabled: (val: boolean) => void;
}

export const BrandContext = createContext<BrandContextType>(null!);

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [logoUrls, setLogoUrls] = useState({
    light:
      "https://res.cloudinary.com/dcvcw1ju2/image/upload/v1756567608/rankingFocused_jleoty.png",
    dark: "https://res.cloudinary.com/dcvcw1ju2/image/upload/v1756567595/gemini_y5zfnb.png",
  });

  const [faviconUrl, setFaviconUrl] = useState(
    "https://res.cloudinary.com/dcvcw1ju2/image/upload/v1756567595/gemini_y5zfnb.png"
  );

  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  const setLogoUrl = (mode: ThemeType, url: string) => {
    setLogoUrls((prev) => ({ ...prev, [mode]: url }));
  };

  return (
    <BrandContext.Provider
      value={{
        logoUrls,
        setLogoUrl,
        faviconUrl,
        setFaviconUrl,
        darkModeEnabled,
        setDarkModeEnabled,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};
