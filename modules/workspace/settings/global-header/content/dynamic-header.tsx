"use client";
import { useContext, useState, useEffect } from "react";
import { HeaderContext, HeaderItem } from "../context/header-context";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

const DesktopNavItem = ({ item }: { item: HeaderItem }) => {
  const { theme, headerStyle } = useContext(HeaderContext);
  const isDarkMode = theme === "dark";
  const itemColor = {
    color:
      item.textColor ||
      (isDarkMode ? headerStyle.textColorDark : headerStyle.textColorLight),
  };
  const handleLinkClick = (link: string, newTab: boolean) => {
    if (!link) return;
    if (newTab) window.open(link, "_blank", "noopener,noreferrer");
    else window.location.href = link;
  };
  if (item.type === "Button") {
    const buttonStyles: React.CSSProperties = {
      backgroundColor:
        item.buttonStyle === "solid" ? item.buttonColor : "transparent",
      borderColor: item.buttonColor,
      color: item.textColor,
      borderRadius: `${headerStyle.buttonRadius}px`,
    };
    return (
      <button
        onClick={() => handleLinkClick(item.link!, item.openInNewTab!)}
        style={buttonStyles}
        className={`px-4 py-2 rounded-md text-normal font-medium transition-opacity hover:opacity-80 whitespace-nowrap ${
          item.buttonStyle === "outline" ? "border" : "border-transparent"
        }`}
      >
        {item.name}
      </button>
    );
  }
  if (item.type === "List") {
    return (
      <div className="relative group">
        <button
          style={itemColor}
          className="flex items-center gap-1 text-normal font-medium transition-opacity hover:opacity-70"
        >
          {item.name}
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180 mt-0.5 text-muted-foreground" />
        </button>
        <div className="absolute top-2 left-20 -translate-x-1/2 mt-2 min-w-[180px] bg-white dark:bg-zinc-800 border rounded-md shadow-lg py-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          {item.children
            ?.sort((a, b) => a.order - b.order)
            .map((child) => (
              <a
                key={child.id}
                href={child.link}
                target={child.openInNewTab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="block w-full text-left px-4 py-2 text-normal text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                {child.name}
              </a>
            ))}
        </div>
      </div>
    );
  }
  return (
    <a
      href={item.link}
      target={item.openInNewTab ? "_blank" : "_self"}
      rel="noopener noreferrer"
      style={itemColor}
      className="text-normal font-medium transition-opacity hover:opacity-70"
    >
      {item.name}
    </a>
  );
};
const MobileNavItem = ({ item }: { item: HeaderItem }) => {
  const [isListOpen, setIsListOpen] = useState(false);
  const handleLinkClick = (link: string, newTab: boolean) => {
    if (!link) return;
    if (newTab) window.open(link, "_blank", "noopener,noreferrer");
    else window.location.href = link;
  };
  if (item.type === "List") {
    return (
      <div className="w-full">
        <button
          onClick={() => setIsListOpen(!isListOpen)}
          className="w-full flex justify-between items-center py-3 text-normal"
        >
          {item.name}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              isListOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {isListOpen && (
          <div className="pl-4 border-l-1 border-gray-200 dark:border-zinc-700 flex flex-col items-start">
            {item.children
              ?.sort((a, b) => a.order - b.order)
              .map((child) => (
                <a
                  key={child.id}
                  href={child.link}
                  target={child.openInNewTab ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="py-2 text-small"
                >
                  {child.name}
                </a>
              ))}
          </div>
        )}
      </div>
    );
  }
  if (item.type === "Button") {
    return (
      <button
        onClick={() => handleLinkClick(item.link!, item.openInNewTab!)}
        className="w-full text-left py-3 text-normal"
      >
        {item.name}
      </button>
    );
  }
  return (
    <a
      href={item.link}
      target={item.openInNewTab ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className="w-full text-left py-3 text-normal"
    >
      {item.name}
    </a>
  );
};

export default function DynamicHeader() {
  const { logoUrl, logoUrls, headerItems, headerStyle, theme, device } =
    useContext(HeaderContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDarkMode = theme === "dark";
  const headerContainerStyle: React.CSSProperties = {
    height: `${headerStyle.height}px`,
    backgroundColor: isDarkMode
      ? headerStyle.backgroundColorDark
      : headerStyle.backgroundColorLight,
    color: isDarkMode ? headerStyle.textColorDark : headerStyle.textColorLight,
    borderBottom: `${headerStyle.borderWidth}px solid ${headerStyle.borderColor}`,
    position: headerStyle.sticky ? "sticky" : "static",
    top: headerStyle.sticky ? 0 : undefined,
    zIndex: headerStyle.sticky ? 50 : "auto",
  };

  const itemsByAlignment = (alignment: "left" | "center" | "right") =>
    headerItems
      .filter((item) => item.alignment === alignment)
      .sort((a, b) => a.order - b.order);

  const allNavItems = [
    ...itemsByAlignment("left"),
    ...itemsByAlignment("center"),
    ...itemsByAlignment("right"),
  ];

  const MobileMenu = () => (
    <>
      <div
        className={`absolute inset-0 bg-black/40 z-[99] transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <div
        className={`absolute top-0 right-0 h-full w-[60%] flex flex-col z-[100] transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: headerContainerStyle.backgroundColor,
          color: headerContainerStyle.color,
        }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{
            borderColor: isDarkMode
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.1)",
          }}
        >
          <span className="text-main">Menu</span>
          <button onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 flex flex-col items-start p-6 space-y-0 overflow-y-auto">
          {allNavItems.map((item) => (
            <MobileNavItem key={item.id} item={item} />
          ))}
        </nav>
      </div>
    </>
  );

  return (
    <header
      className="flex items-center px-4 transition-all duration-300 w-full"
      style={headerContainerStyle}
    >
      {device === "mobile" ? (
        <div className="flex w-full items-center">
          <div className="flex-1">
            {logoUrls[theme] && (
              <a href={logoUrl} target="_blank" rel="noopener noreferrer">
                <Image
                  src={logoUrls[theme]}
                  alt="logo"
                  width={40}
                  height={40}
                  className="object-contain h-8"
                />
              </a>
            )}
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="z-[101] p-2"
              style={{ color: headerContainerStyle.color }}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <MobileMenu />
        </div>
      ) : (
        <>
          <div className="hidden lg:grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-8">
            <div className="flex items-center gap-8 justify-self-start">
              {logoUrls[theme] && (
                <a href={logoUrl} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={logoUrls[theme]}
                    alt="logo"
                    width={40}
                    height={40}
                    className="object-contain h-10 shrink-0"
                  />
                </a>
              )}
              <nav className="flex items-center gap-4">
                {itemsByAlignment("left").map((item) => (
                  <DesktopNavItem key={item.id} item={item} />
                ))}
              </nav>
            </div>
            <nav className="flex items-center gap-4 justify-self-center">
              {itemsByAlignment("center").map((item) => (
                <DesktopNavItem key={item.id} item={item} />
              ))}
            </nav>
            <nav className="flex items-center gap-4 justify-self-end">
              {itemsByAlignment("right").map((item) => (
                <DesktopNavItem key={item.id} item={item} />
              ))}
            </nav>
          </div>
          {/*
            ================================================================
            === THE FIX: Updated flex layout to push menu to the right ===
            ================================================================
          */}
          <div className="lg:hidden flex w-full items-center">
            <div className="flex-1">
              {logoUrls[theme] && (
                <Image
                  src={logoUrls[theme]}
                  alt="logo"
                  width={100}
                  height={32}
                  className="object-contain h-8"
                />
              )}
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="z-[101] flex flex-col justify-around w-6 h-6 p-0"
              >
                <div
                  className="w-6 h-0.5"
                  style={{ backgroundColor: headerContainerStyle.color }}
                />
                <div
                  className="w-6 h-0.5"
                  style={{ backgroundColor: headerContainerStyle.color }}
                />
                <div
                  className="w-6 h-0.5"
                  style={{ backgroundColor: headerContainerStyle.color }}
                />
              </button>
            </div>
            <MobileMenu />
          </div>
        </>
      )}
    </header>
  );
}
