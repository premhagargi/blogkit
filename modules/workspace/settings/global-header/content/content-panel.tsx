"use client";
import { useContext } from "react";
import { HeaderContext } from "../context/header-context";
import DynamicHeader from "./dynamic-header";

export default function ContentPanel() {
  const { theme, isCustomCodeEnabled, customCode } = useContext(HeaderContext);

  if (isCustomCodeEnabled) {
    return (
      <div
        className="h-full w-full"
        dangerouslySetInnerHTML={{ __html: customCode }}
      />
    );
  }

  const bg = theme === "dark" ? "bg-zinc-900" : "bg-gray-50";
  const box = theme === "dark" ? "bg-zinc-700" : "bg-gray-200";
  const card = theme === "dark" ? "bg-zinc-800" : "bg-gray-100";

  return (
    // The parent now controls the width, so this div just handles background and scrolling
    <div className={`min-h-full ${bg}`}>
      <DynamicHeader />

      {/* max-w and mx-auto are removed. Padding is now responsive. */}
      <div className="p-4 sm:p-8 space-y-16">
        {/* Hero */}
        <div className="space-y-10">
          <div className={`h-12 w-2/3 rounded-lg ${box}`}></div>
          <div className="space-y-3">
            <div className={`h-4 w-5/6 rounded-md ${box}`}></div>
            <div className={`h-4 w-2/3 rounded-md ${box}`}></div>
          </div>
          <div className="flex gap-4">
            <div className={`h-10 w-32 rounded-full ${box}`}></div>
            <div className={`h-10 w-32 rounded-full ${box}`}></div>
          </div>
          <div className={`h-72 w-full rounded-xl ${box}`}></div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`p-6 rounded-xl space-y-4 ${card}`}>
              <div className={`h-8 w-1/2 rounded-md ${box}`}></div>
              <div className={`h-4 w-full rounded-md ${box}`}></div>
              <div className={`h-4 w-3/4 rounded-md ${box}`}></div>
              <div className={`h-32 w-full rounded-lg ${box}`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
