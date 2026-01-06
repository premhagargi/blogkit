"use client";
import { useContext, useState, useEffect } from "react";
import { CtaContext, CtaType } from "../context/cta-context";
import DynamicCta from "./dynamic-cta";
import { cn } from "@/lib/utils";

const SkeletonBlock = ({ className }: { className?: string }) => {
  const { theme } = useContext(CtaContext);
  const bg = theme === "dark" ? "bg-zinc-700" : "bg-gray-300";
  return <div className={cn("rounded", bg, className)} />;
};

const ArticleSkeleton = ({ showInlineCta }: { showInlineCta: boolean }) => (
  <div className="bg-background dark:bg-zinc-800/50 shadow-lg rounded-xl p-6 md:p-8 space-y-10">
    <div>
      <SkeletonBlock className="h-8 w-2-3 mb-3" />
      <SkeletonBlock className="h-4 w-1-3" />
    </div>
    <div className="flex items-center gap-4">
      <SkeletonBlock className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-1-4" />
        <SkeletonBlock className="h-3 w-1-3" />
      </div>
    </div>
    <div className="space-y-3">
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-11-12" />
    </div>
    <SkeletonBlock className="h-64 w-full rounded-lg" />
    {showInlineCta && (
      <div id="inline-cta-container" className="py-10">
        <DynamicCta />
      </div>
    )}
    <div className="space-y-3">
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-10-12" />
    </div>
  </div>
);

export default function ContentPanel() {
  const { ctaState, theme, device, isCtaVisible, setIsCtaVisible } =
    useContext(CtaContext);
  const { type, trigger, timeDelay, scrollTrigger } = ctaState;
  const [hasBeenTriggered, setHasBeenTriggered] = useState(false);

  useEffect(() => {
    setIsCtaVisible(false);
    setHasBeenTriggered(false);
    if (!["PopUp", "Floating"].includes(type)) {
      setIsCtaVisible(true);
    }
  }, [type, trigger, timeDelay, scrollTrigger, setIsCtaVisible]);

  useEffect(() => {
    const scrollTargets: Partial<{ [key in CtaType]: string }> = {
      InLine: "inline-cta-container",
      EndOfPost: "endofpost-cta-container",
      Sidebar: "sidebar-cta-container",
    };
    const targetId = scrollTargets[type];
    if (targetId) {
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [type]);

  useEffect(() => {
    if (
      !["PopUp", "Floating"].includes(type) ||
      trigger !== "TimeDelay" ||
      hasBeenTriggered
    )
      return;
    const timer = setTimeout(() => {
      setIsCtaVisible(true);
      setHasBeenTriggered(true);
    }, timeDelay * 1000);
    return () => clearTimeout(timer);
  }, [timeDelay, trigger, type, hasBeenTriggered, setIsCtaVisible]);

  useEffect(() => {
    if (
      !["PopUp", "Floating"].includes(type) ||
      trigger !== "Scroll" ||
      hasBeenTriggered
    )
      return;
    const container = document.getElementById("cta-preview-container");
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
      if (scrollPercent >= scrollTrigger && !hasBeenTriggered) {
        setIsCtaVisible(true);
        setHasBeenTriggered(true);
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [scrollTrigger, trigger, type, hasBeenTriggered, setIsCtaVisible]);

  useEffect(() => {
    if (type !== "PopUp" || trigger !== "ExitIntent" || hasBeenTriggered)
      return;
    const handleMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasBeenTriggered) {
        setIsCtaVisible(true);
        setHasBeenTriggered(true);
      }
    };
    document.addEventListener("mouseout", handleMouseOut);
    return () => document.removeEventListener("mouseout", handleMouseOut);
  }, [trigger, type, hasBeenTriggered, setIsCtaVisible]);

  const bg = theme === "dark" ? "bg-zinc-900" : "bg-gray-100";

  return (
    <div className={`min-h-full ${bg}`}>
      <div className="flex justify-center">
        <div className="w-full max-w-none xl:max-w-[1400px] flex">
          <div className="flex-1 min-w-0">
            <ArticleSkeleton
              showInlineCta={type === "InLine" && isCtaVisible}
            />
            {type === "EndOfPost" && isCtaVisible && (
              <div
                id="endofpost-cta-container"
                className="pt-8 mt-8 border-t dark:border-zinc-700"
              >
                <DynamicCta />
              </div>
            )}
          </div>
          {type === "Sidebar" && device !== "mobile" && isCtaVisible && (
            <aside
              id="sidebar-cta-container"
              className="w-80 flex-shrink-0 p-4 hidden lg:block"
            >
              <div className="sticky top-4">
                <DynamicCta />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
