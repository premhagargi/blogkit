"use client";

import * as React from "react";
import { Link } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmbedDialog } from "./embed-dialog-context";
import { Textarea } from "@/components/ui/textarea";

/**
 * Decodes HTML entities in a string
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&");
}

/**
 * Extracts URL from various embed code formats (iframe, blockquote, or plain URL)
 * Returns the actual post/page URL, not the embed iframe URL
 */
function extractUrlFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Decode HTML entities first
  const decoded = decodeHtmlEntities(trimmed);

  // If it's already a plain URL (starts with http:// or https://), return as is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Try to extract src from iframe tag
  const iframeSrcMatch =
    decoded.match(/<iframe[^>]+src=["']([^"']+)["']/i) ||
    decoded.match(/<iframe[^>]+src=([^\s>]+)/i);
  
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    const iframeSrc = iframeSrcMatch[1];
    // If it's a Reddit embed iframe URL, try to extract the original post URL
    if (iframeSrc.includes('redditmedia.com')) {
      // Extract the path and construct the reddit.com URL
      const pathMatch = iframeSrc.match(/\/r\/[^?]+/i);
      if (pathMatch) {
        return `https://www.reddit.com${pathMatch[0]}`;
      }
    }
    return iframeSrc;
  }

  // Try to extract href from blockquote (Reddit embeds)
  const blockquoteHrefMatch = decoded.match(/<blockquote[^>]*>[\s\S]*?href=["']([^"']+)["']/i);
  if (blockquoteHrefMatch && blockquoteHrefMatch[1]) {
    const href = blockquoteHrefMatch[1];
    // If it's already a full URL, return it
    if (/^https?:\/\//i.test(href)) {
      return href;
    }
    // Otherwise, construct the full Reddit URL
    if (href.startsWith('/r/')) {
      return `https://www.reddit.com${href}`;
    }
    return href;
  }

  // Try to extract URL from any href attribute
  const hrefMatch = decoded.match(/href=["']([^"']+)["']/i);
  if (hrefMatch && hrefMatch[1]) {
    const href = hrefMatch[1];
    if (/^https?:\/\//i.test(href)) {
      return href;
    }
  }

  // If we can't extract a URL, return null
  return null;
}

export function EmbedDialog() {
  const { isOpen, closeDialog, onInsert } = useEmbedDialog();
  const [url, setUrl] = React.useState("");

  const handleInsert = React.useCallback(() => {
    const trimmedInput = url.trim();
    
    if (!trimmedInput) {
      toast.error("Please enter a URL or embed code");
      return;
    }
    
    // Extract the URL from the input (handles iframe, blockquote, embed code, or plain URL)
    const extractedUrl = extractUrlFromInput(trimmedInput);
    
    if (!extractedUrl) {
      toast.error("Could not extract a valid URL from the input. Please check your embed code or URL.");
      return;
    }
    
    if (onInsert) {
      // Pass only the extracted URL to be saved in element.url
      onInsert(extractedUrl);
    }
    setUrl("");
    closeDialog();
  }, [url, onInsert, closeDialog]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setUrl("");
      closeDialog();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      // Reset URL and focus the input when dialog opens
      setUrl("");
      setTimeout(() => {
        const input = document.getElementById("embed-url-input");
        input?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="size-4" />
            Insert Embed
          </DialogTitle>
          <DialogDescription>
            Enter a URL or paste embed code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              id="embed-url-input"
              placeholder="https://www.youtube.com/watch?v=... or &lt;blockquote class=&quot;reddit-embed-bq&quot;&gt;..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              rows={5}
              className="resize-none max-h-[100px] max-w-[450px] overflow-y-auto font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleInsert();
                }
              }}
              autoFocus
            />
            <Label htmlFor="embed-url-input" className="text-xs text-gray-500">
            Works with YouTube and Twitter links, or with any iframe and other embed codes.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!url.trim()}>
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
