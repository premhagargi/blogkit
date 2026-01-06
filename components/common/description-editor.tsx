import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon,
  Link2Icon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

interface DescriptionEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  className,
}) => {
  const [linkPopoverOpen, setLinkPopoverOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkText, setLinkText] = React.useState("");
  // Force a re-render on every transaction to update the active state
  const [, setForceUpdate] = React.useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        heading: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    // Add onTransaction to force re-renders
    onTransaction: () => {
      setForceUpdate((prev) => prev + 1);
    },
    editorProps: {
      attributes: {
        class:
          "text-normal leading-relaxed mx-auto focus:outline-none min-h-[60px] p-2",
      },
    },
  });

  const handleBold = () => {
    editor?.chain().focus().toggleBold().run();
  };

  const handleItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };

  const handleUnderline = () => {
    editor?.chain().focus().toggleUnderline().run();
  };

  const handleLink = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    setLinkText(selectedText || "");
    const existingUrl = editor.getAttributes("link").href;
    if (existingUrl) {
      setLinkUrl(existingUrl);
    }
    setLinkPopoverOpen(true);
  };

  const handleSetLink = () => {
    if (!editor || !linkUrl) return;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();

    if (
      linkText &&
      !editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      )
    ) {
      editor.chain().insertContent(linkText).run();
    }

    setLinkPopoverOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setLinkPopoverOpen(false);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border shadow-xs", className)}>
      {/* Toolbar */}
      <div className="flex items-center border-b ">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className={cn(
            "h-8 w-8 p-0  rounded-none",
            editor.isActive("bold") && "bg-slate-200"
          )}
        >
          <FontBoldIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className={cn(
            "h-8 w-8 p-0  rounded-none",
            editor.isActive("italic") && "bg-slate-200"
          )}
        >
          <FontItalicIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnderline}
          className={cn(
            "h-8 w-8 p-0  rounded-none",
            editor.isActive("underline") && "bg-slate-200"
          )}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              // Keep the popover open while interacting with it
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleLink}
              className={cn(
                "h-8 w-8 p-0  rounded-none",
                editor.isActive("link") && "bg-slate-200"
              )}
            >
              <Link2Icon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="link-url" className="text-normal">
                  URL
                </Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-2 justify-end ">
                {editor.isActive("link") && (
                  <Button variant="outline" onClick={handleRemoveLink}>
                    Remove Link
                  </Button>
                )}
                <Button onClick={handleSetLink} disabled={!linkUrl}>
                  Set Link
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="min-h-[100px]"
        placeholder={placeholder}
      />
    </div>
  );
};

export default DescriptionEditor;
