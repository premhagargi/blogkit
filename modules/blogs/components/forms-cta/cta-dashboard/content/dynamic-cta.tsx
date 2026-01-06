"use client";
import { useContext } from "react";
import { CtaContext } from "../context/cta-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import parse from "html-react-parser";
import { X as CloseIcon } from "lucide-react"; // Import the close icon

export default function DynamicCta() {
  const { ctaState, setIsCtaVisible } = useContext(CtaContext);
  const { content, type } = ctaState;

  const handleClose = () => {
    setIsCtaVisible(false);
  };

  const showCloseButton = ["PopUp", "Floating"].includes(type);

  const ctaClasses = cn(
    "p-8 rounded-lg flex flex-col items-center gap-4 w-full max-w-[500px] mx-auto shadow-2xl text-white text-center relative", // Added relative
    "bg-indigo-600",
    {
      "shadow-2xl": type === "PopUp",
      "fixed bottom-5 right-5 z-20": type === "Floating",
      "border dark:border-zinc-700 !max-w-full": type === "Sidebar",
    }
  );

  return (
    <div className={ctaClasses}>
      {showCloseButton && (
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full text-indigo-200 hover:bg-white/20"
          aria-label="Close CTA"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      )}

      <h2 className="text-3xl font-bold">{content.heading}</h2>

      {content.description && (
        <div className="text-indigo-200 text-sm">
          {parse(content.description)}
        </div>
      )}

      <div className="flex items-center gap-4 mt-4">
        {content.primaryButton.text && (
          <Button asChild variant="secondary" size="lg">
            <a
              href={content.primaryButton.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content.primaryButton.text}
            </a>
          </Button>
        )}
        {content.secondaryButton.text && (
          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600"
          >
            <a
              href={content.secondaryButton.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content.secondaryButton.text}
            </a>
          </Button>
        )}
      </div>

      {content.footnote && (
        <div className="text-xs text-indigo-300 mt-4">
          {parse(content.footnote)}
        </div>
      )}
    </div>
  );
}
