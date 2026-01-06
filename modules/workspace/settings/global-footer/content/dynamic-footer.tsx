"use client";
import { useContext, useEffect } from "react";
import parse from "html-react-parser";
import {
  FooterContext,
  SocialLink,
  FooterColumn,
  SocialType,
} from "../context/footer-context";
import Image from "next/image";
import { ReactNode } from "react";
import {
  Dribbble,
  Link,
  Mail,
  Instagram,
  Twitter,
  Github,
  Globe,
  Facebook,
  Linkedin,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

const getSocialIcon = (type: SocialType): ReactNode => {
  const className = "h-5 w-5";
  switch (type) {
    case "mail":
      return <Mail className={className} />;
    case "website":
      return <Globe className={className} />;
    case "twitter":
      return <Twitter className={className} />;
    case "instagram":
      return <Instagram className={className} />;
    case "facebook":
      return <Facebook className={className} />;
    case "linkedin":
      return <Linkedin className={className} />;
    case "github":
      return <Github className={className} />;
    case "dribbble":
      return <Dribbble className={className} />;
    case "whatsapp":
      return <MessageSquare className={className} />;
    case "external":
      return <ExternalLink className={className} />;
    default:
      return <Link className={className} />;
  }
};

export default function DynamicFooter() {
  const {
    device,
    theme,
    footerStyle,
    logoUrls,
    logoUrl,
    description,
    socialLinks,
    footerColumns,
    footnote,
  } = useContext(FooterContext);

  const isDarkMode = theme === "dark";
  const footerContainerStyle: React.CSSProperties = {
    backgroundColor: isDarkMode
      ? footerStyle.backgroundColorDark
      : footerStyle.backgroundColorLight,
    color: isDarkMode ? footerStyle.textColorDark : footerStyle.textColorLight,
    borderTop: `${footerStyle.borderWidth}px solid ${footerStyle.borderColor}`,
  };

  const sortedColumns = [...footerColumns].sort((a, b) => a.order - b.order);
  const numColumns = sortedColumns.length;

  const getColumnsLayoutClass = () => {
    if (device === "mobile") {
      return "grid grid-cols-2 gap-x-6 gap-y-8";
    }

    switch (numColumns) {
      case 0:
        return "";
      case 1:
        return "grid grid-cols-1";
      case 2:
        return "grid grid-cols-2 gap-x-8 gap-y-10";
      default:
        return "grid grid-cols-3 gap-x-8 gap-y-10";
    }
  };

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const mainContainerClass =
    device === "mobile"
      ? "flex flex-col gap-10"
      : `flex flex-row gap-8 ${
          numColumns > 0 ? "justify-between" : "justify-start"
        }`;

  const leftSectionClass =
    device === "mobile" ? "w-full" : `w-full max-w-[300px] flex-shrink-0`;

  return (
    <footer style={footerContainerStyle} className="w-full">
      <div className="container mx-auto px-6 pt-12 pb-6">
        <div className={mainContainerClass}>
          <div className={leftSectionClass}>
            <div className="flex flex-col items-start space-y-4">
              {logoUrls[theme] && (
                <a href={logoUrl} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={logoUrls[theme]}
                    alt="logo"
                    width={120}
                    height={40}
                    className="object-contain h-8 w-auto"
                  />
                </a>
              )}
              {description && (
                <div className="text-sm opacity-80 break-words">
                  {parse(description)}
                </div>
              )}
              {socialLinks.filter((s) => s.link).length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                  {socialLinks
                    .filter((social) => social.link)
                    .map((social) => (
                      <a
                        key={social.id}
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-opacity hover:opacity-70"
                      >
                        {getSocialIcon(social.type)}
                      </a>
                    ))}
                </div>
              )}
            </div>
          </div>

          {numColumns > 0 && (
            <div className={getColumnsLayoutClass()}>
              {sortedColumns.map((column) => (
                <div key={column.id} className="break-inside-avoid">
                  <h3 className="font-semibold mb-4 whitespace-nowrap">
                    {column.title}
                  </h3>
                  <ul className="space-y-3">
                    {column.links
                      .sort((a, b) => a.order - b.order)
                      .map((link) => (
                        <li key={link.id}>
                          <a
                            href={link.link}
                            target={link.openInNewTab ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            className="text-sm transition-opacity hover:opacity-70 opacity-80"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {footnote && (
          <div
            className="mt-12 pt-6 border-t"
            style={{ borderColor: "rgba(128, 128, 128, 0.2)" }}
          >
            <div className="text-center text-sm opacity-60">
              {parse(footnote)}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
