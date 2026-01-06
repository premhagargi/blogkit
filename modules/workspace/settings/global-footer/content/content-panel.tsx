"use client";
import { useContext } from "react";
import { FooterContext } from "../context/footer-context";
import DynamicFooter from "./dynamic-footer";

export default function ContentPanel() {
  const { theme, isCustomCodeEnabled, customCode } = useContext(FooterContext);

  const bg = theme === "dark" ? "bg-zinc-900" : "bg-gray-50";
  const box = theme === "dark" ? "bg-zinc-700" : "bg-gray-200";
  const card = theme === "dark" ? "bg-zinc-800" : "bg-gray-100";

  // If custom code is enabled, render it directly and fill the parent.
  // We wrap the placeholder content in a separate div from the footer itself.
  return (
    <div className={`min-h-full flex flex-col ${bg}`}>
      <div className="flex-grow p-4 sm:p-8 space-y-16">
        {/* Placeholder Content */}
        <div className="space-y-10">
          <div className={`h-12 w-2/3 rounded-lg ${box}`}></div>
          <div className="space-y-3">
            <div className={`h-4 w-5/6 rounded-md ${box}`}></div>
            <div className={`h-4 w-2/3 rounded-md ${box}`}></div>
          </div>
          <div className={`h-72 w-full rounded-xl ${box}`}></div>
        </div>
      </div>

      {isCustomCodeEnabled ? (
        <div dangerouslySetInnerHTML={{ __html: customCode }} />
      ) : (
        <DynamicFooter />
      )}
    </div>
  );
}
