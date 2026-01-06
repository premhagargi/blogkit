"use client";

import { useContext, useState, useRef, useMemo, useEffect } from "react";
import {
  FooterContext,
  ThemeType,
  FooterColumn,
  FooterLink,
  SocialLink,
} from "../context/footer-context";
import {
  Mail,
  Globe,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Github,
  Dribbble,
  MessageSquare,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { SocialType } from "../context/footer-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, ImageIcon, Trash2, GripVertical } from "lucide-react";
import AddEditColumnModal from "../modals/add-edit-column-modal";
import AddEditLinkModal from "../modals/add-edit-link-modal";
import { ConfirmationDialog } from "@/components/models/confirmation-dialog";
import { SortableFooterColumn } from "./sortable-footer-column";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Separator } from "@/components/ui/separator";
import DescriptionEditor from "@/components/common/description-editor";
import dynamic from "next/dynamic";
import {
  PopoverTrigger,
  Popover,
  PopoverContent,
} from "@radix-ui/react-popover";
import { BrandContext } from "@/providers/brand-provider";

function FooterItems() {
  const {
    footerColumns,
    setFooterColumns,
    logoUrls,
    setLogoUrl,
    logoUrl,
    setLogoUrlLink,
    description,
    setDescription,
    socialLinks,
    addSocialLink,
    updateSocialLink,
    deleteSocialLink,
    footnote,
    setFootnote,
    theme,
    setTheme,
  } = useContext(FooterContext);
  const { darkModeEnabled } = useContext(BrandContext);

  const [isSocialPopoverOpen, setSocialPopoverOpen] = useState(false);
  const socialInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const [isColModalOpen, setColModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<FooterColumn | null>(null);
  const socialPlatforms = [
    { type: "mail" as SocialType, name: "Mail", Icon: Mail },
    { type: "website" as SocialType, name: "Website", Icon: Globe },
    { type: "twitter" as SocialType, name: "X / Twitter", Icon: Twitter },
    { type: "instagram" as SocialType, name: "Instagram", Icon: Instagram },
    { type: "facebook" as SocialType, name: "Facebook", Icon: Facebook },
    { type: "linkedin" as SocialType, name: "LinkedIn", Icon: Linkedin },
    { type: "github" as SocialType, name: "GitHub", Icon: Github },
    { type: "dribbble" as SocialType, name: "Dribbble", Icon: Dribbble },
    { type: "whatsapp" as SocialType, name: "WhatsApp", Icon: MessageSquare },
    {
      type: "external" as SocialType,
      name: "External Link",
      Icon: ExternalLink,
    },
  ];

  const SocialIcon = ({ type }: { type: SocialType }) => {
    const platform = socialPlatforms.find((p) => p.type === type);
    if (!platform)
      return <ExternalLink className="h-4 w-4 text-muted-foreground" />;
    const IconComponent = platform.Icon;
    return <IconComponent className="h-4 w-4 text-muted-foreground" />;
  };

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnIds = useMemo(
    () => footerColumns.map((c) => c.id),
    [footerColumns]
  );

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(theme, reader.result as string);
      reader.readAsDataURL(files[0]);
    }
  };

  useEffect(() => {
    if (socialLinks.length > 0) {
      const lastLink = socialLinks[socialLinks.length - 1];
      // Focus only if it's a new link (which will have an empty value)
      if (lastLink && lastLink.link === "") {
        const inputEl = socialInputRefs.current.get(lastLink.id);
        inputEl?.focus();
      }
    }
  }, [socialLinks.length, socialLinks]); // Reruns only when the number of links changes

  const handleAddSocialLink = (type: SocialType) => {
    addSocialLink(type);
    setSocialPopoverOpen(false); // Close the popover after selection
  };

  const handleSaveColumn = (colData: { title: string }) => {
    if (editingColumn) {
      setFooterColumns(
        footerColumns.map((c) =>
          c.id === editingColumn.id ? { ...c, title: colData.title } : c
        )
      );
    } else {
      const newColumn: FooterColumn = {
        id: Date.now().toString(),
        title: colData.title,
        order: footerColumns.length,
        links: [],
      };
      setFooterColumns([...footerColumns, newColumn]);
    }
    setEditingColumn(null);
  };

  const handleDeleteColumn = (columnId: string) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Column?",
      description:
        "Are you sure you want to delete this column and all its links? This action cannot be undone.",
      onConfirm: () => {
        setFooterColumns(footerColumns.filter((c) => c.id !== columnId));
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    const activeParentId = active.data.current?.parentId;
    const overParentId = over.data.current?.parentId;

    if (activeType === "column" && overType === "column") {
      const oldIndex = footerColumns.findIndex((c) => c.id === active.id);
      const newIndex = footerColumns.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(footerColumns, oldIndex, newIndex);
      setFooterColumns(
        reordered.map((item, index) => ({ ...item, order: index }))
      );
    }

    if (
      activeType === "link" &&
      overType === "link" &&
      activeParentId === overParentId
    ) {
      const parentColumn = footerColumns.find((c) => c.id === activeParentId);
      if (!parentColumn) return;

      const oldIndex = parentColumn.links.findIndex((l) => l.id === active.id);
      const newIndex = parentColumn.links.findIndex((l) => l.id === over.id);
      const reorderedLinks = arrayMove(parentColumn.links, oldIndex, newIndex);

      const updatedColumns = footerColumns.map((col) => {
        if (col.id === activeParentId) {
          return {
            ...col,
            links: reorderedLinks.map((link, index) => ({
              ...link,
              order: index,
            })),
          };
        }
        return col;
      });
      setFooterColumns(updatedColumns);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 space-y-4">
        <Card className="bg-transparent border-none shadow-none p-0">
          <CardContent className="space-y-4 p-0">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-normal">Logo</CardTitle>

                {darkModeEnabled && (
                  <Select
                    value={theme}
                    onValueChange={(v: ThemeType) => setTheme(v)}
                  >
                    <SelectTrigger className="w-fit">
                      <SelectValue placeholder="Select Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button
                  variant="link"
                  className="!p-0 h-auto text-small "
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-1 h-3 w-3" /> Upload
                </Button>
              </div>

              <div
                className="w-52 ml-2 h-28 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    // Create FileList from dropped file
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    handleFileChange(dt.files); // stays consistent with your FileList type
                  }
                }}
              >
                {logoUrls[theme] ? (
                  <img
                    src={logoUrls[theme]}
                    alt={`${theme} logo`}
                    className="max-h-24 object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-500 text-small">
                    <ImageIcon className="h-8 w-8 mb-1" /> Upload Image
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label
                htmlFor="logoUrl"
                className="text-normal font-normal whitespace-nowrap"
              >
                Logo URL
              </label>
              <Input
                id="logoUrl"
                placeholder="Enter URL for logo link"
                value={logoUrl}
                onChange={(e) => setLogoUrlLink(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <h1 className="text-normal font-medium">Description</h1>
              <DescriptionEditor
                value={description}
                onChange={setDescription}
              />
            </div>

            <div className="space-y-2">
              <Popover
                open={isSocialPopoverOpen}
                onOpenChange={setSocialPopoverOpen}
              >
                <h1 className="text-normal font-medium">Social Icons</h1>

                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-secondary"
                  >
                    <span className="text-normal font-normal">
                      Add social link
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                {socialLinks.map((social) => (
                  <div key={social.id} className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <SocialIcon type={social.type} />
                    </span>

                    <span className="absolute left-9 top-1/2 -translate-y-1/2 h-5 w-[0.9px] rounded-full bg-gray-300" />

                    <Input
                      ref={(node) => {
                        if (node) socialInputRefs.current.set(social.id, node);
                        else socialInputRefs.current.delete(social.id);
                      }}
                      placeholder="Enter URL..."
                      value={social.link}
                      onChange={(e) =>
                        updateSocialLink(social.id, e.target.value)
                      }
                      className="pl-12 pr-12"
                    />

                    <span className="absolute right-9 top-1/2 -translate-y-1/2 h-5 w-[1px] rounded-full bg-gray-300" />

                    <button
                      type="button"
                      onClick={() => deleteSocialLink(social.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 "
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <PopoverContent className="w-[330px] p-1 bg-secondary">
                  <div className="flex flex-col space-y-1 max-h-[200px] overflow-y-auto">
                    {socialPlatforms.map((platform) => (
                      <Button
                        key={platform.type}
                        variant="ghost"
                        className="w-full justify-start font-normal"
                        onClick={() => handleAddSocialLink(platform.type)}
                      >
                        <platform.Icon className="h-4 w-4 mr-2" />
                        {platform.name}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-4" />

        <Card className="bg-transparent border-none shadow-none p-0 gap-2">
          <CardHeader className="flex flex-row items-center justify-between p-0">
            <CardTitle className="text-normal font-medium">
              Footer Items
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingColumn(null);
                setColModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="space-y-2">
              <SortableContext
                items={columnIds}
                strategy={verticalListSortingStrategy}
              >
                {footerColumns.map((col) => (
                  <SortableFooterColumn
                    key={col.id}
                    column={col}
                    onEditColumn={() => {
                      setEditingColumn(col);
                      setColModalOpen(true);
                    }}
                    onDeleteColumn={() => handleDeleteColumn(col.id)}
                  />
                ))}
              </SortableContext>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h1 className="text-normal font-medium">Footnote</h1>
          <DescriptionEditor value={footnote} onChange={setFootnote} />
        </div>

        {isColModalOpen && (
          <AddEditColumnModal
            isOpen={isColModalOpen}
            setIsOpen={setColModalOpen}
            onSave={handleSaveColumn}
            column={editingColumn}
          />
        )}

        {confirmState?.isOpen && (
          <ConfirmationDialog
            open={confirmState.isOpen}
            onOpenChange={(open) => !open && setConfirmState(null)}
            title={confirmState.title}
            description={confirmState.description}
            onConfirm={() => {
              confirmState.onConfirm();
              setConfirmState(null);
            }}
            theme="danger"
            confirmButtonLabel="Delete"
          />
        )}
      </div>
    </DndContext>
  );
}

export default dynamic(() => Promise.resolve(FooterItems), {
  ssr: false,
});
