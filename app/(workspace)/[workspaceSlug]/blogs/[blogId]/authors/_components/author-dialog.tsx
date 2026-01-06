"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Upload,
  Twitter,
  Linkedin,
  Github,
  Globe,
  Loader2,
  X,
  Trash2,
  Dribbble,
  Link,
  Facebook,
  Mail,
} from "lucide-react";
import { uploadAvatarToSupabase } from "@/lib/supabase-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuthorFormData {
  name: string;
  bio: string;
  email: string;
  website: string;
  image: string;
  socialLinks: Record<string, string>;
}

interface AuthorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AuthorFormData) => Promise<void>;
  initialData?: AuthorFormData;
  isEdit?: boolean;
  isLoading?: boolean;
}

const socialPlatforms = [
  {
    key: "website",
    label: "Website",
    icon: Globe,
    placeholder: "https://example.com",
  },
  {
    key: "dribble",
    label: "Dribble",
    icon: Dribbble,
    placeholder: "https://dribble.com",
  },
  {
    key: "email",
    label: "Email",
    icon: Mail,
    placeholder: "johndoe@blogmail.com",
  },
  {
    key: "twitter",
    label: "Twitter",
    icon: Twitter,
    placeholder: "https://twitter.com/username",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    placeholder: "https://linkedin.com/in/username",
  },
  {
    key: "github",
    label: "GitHub",
    icon: Github,
    placeholder: "https://github.com/username",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    placeholder: "https://facebook.com/username",
  },
];

const defaultFormData: AuthorFormData = {
  name: "",
  bio: "",
  email: "",
  website: "",
  image: "",
  socialLinks: {},
};

export function AuthorDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEdit = false,
  isLoading = false,
}: AuthorDialogProps) {
  const [formData, setFormData] = useState<AuthorFormData>(defaultFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customPlatform, setCustomPlatform] = useState("");

  // Update form data when initialData changes or dialog opens
  useEffect(() => {
    if (open && initialData) {
      setFormData(initialData);
    } else if (open && !initialData) {
      setFormData(defaultFormData);
    }
  }, [open, initialData]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData(defaultFormData);
      setUploadError(null);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    // Clean up social links - remove empty ones
    const cleanedSocialLinks: Record<string, string> = {};
    Object.entries(formData.socialLinks).forEach(([key, value]) => {
      if (value && value.trim()) {
        cleanedSocialLinks[key] = value.trim();
      }
    });

    const submitData = {
      ...formData,
      socialLinks: cleanedSocialLinks,
    };

    await onSubmit(submitData);
  };

  const updateSocialLink = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const addSocialLink = (platform: string) => {
    if (platform === "custom") {
      // Show a prompt or modal for custom platform name
      const customName = prompt("Enter custom platform name:");
      if (customName && customName.trim()) {
        const customKey = `custom_${customName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")}`;
        setFormData((prev) => ({
          ...prev,
          socialLinks: {
            ...prev.socialLinks,
            [customKey]: "",
          },
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: "",
      },
    }));
  };

  const removeSocialLink = (platform: string) => {
    setFormData((prev) => {
      const newSocialLinks = { ...prev.socialLinks };
      delete newSocialLinks[platform];
      return {
        ...prev,
        socialLinks: newSocialLinks,
      };
    });
  };

  const addCustomSocialLink = () => {
    if (!customPlatform.trim()) return;

    const customKey = `custom_${customPlatform
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")}`;
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [customKey]: "",
      },
    }));
    setCustomPlatform(""); // Clear the input
  };

  // Get available platforms that haven't been added yet
  const availablePlatforms = socialPlatforms.filter(
    (platform) => !(platform.key in formData.socialLinks)
  );

  // Get added social links
  const addedSocialLinks = Object.entries(formData.socialLinks)
    .map(([key, value]) => {
      const platform = socialPlatforms.find((p) => p.key === key);
      if (platform) {
        return { ...platform, value };
      }
      // Handle custom platforms
      if (key.startsWith("custom_")) {
        const customLabel = key.replace("custom_", "").replace(/_/g, " ");
        return {
          key,
          label: customLabel.charAt(0).toUpperCase() + customLabel.slice(1),
          icon: Link, // Use globe icon for custom platforms
          placeholder: "Enter URL",
          value,
        };
      }
      return null;
    })
    .filter(Boolean);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const imageUrl = await uploadAvatarToSupabase(file);
      setFormData((prev) => ({
        ...prev,
        image: imageUrl,
      }));
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-5 pt-6 pb-2">
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? "Edit Author" : "Create Author"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-6 overflow-y-auto max-h-[calc(90vh-210px)]">
          {/* Profile Image */}
          <div className="flex flex-col items-center space-y-4 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={formData.image} />
              <AvatarFallback className="text-xl">
                {formData.name ? formData.name[0].toUpperCase() : "A"}
              </AvatarFallback>
            </Avatar>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleFileSelect}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3 mr-2" />
                  Upload Image
                </>
              )}
            </Button>

            {uploadError && (
              <div className="text-xs text-red-500 text-center max-w-xs">
                {uploadError}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="author-name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="author-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder=""
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author-bio" className="text-sm font-medium">
                About
              </Label>
              <Textarea
                id="author-bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder=""
                rows={3}
                className="w-full resize-none"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Social Links</Label>

              {/* Add social link dropdown */}
              {availablePlatforms.length > 0 && (
                <Select onValueChange={addSocialLink}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add social link" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlatforms.map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <SelectItem key={platform.key} value={platform.key}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{platform.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="custom" className="text-blue-600">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>Custom...</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Added social links */}
              <div className="space-y-2">
                {addedSocialLinks.map((link) => {
                  if (!link) return null;
                  const Icon = link.icon;

                  return (
                    <div
                      key={link.key}
                      className="flex items-center space-x-3 border rounded-md pl-2"
                    >
                      <div className="border-r-1 border-gray-200 pr-2">
                        <Icon className="h-4 w-4 text-gray-500 flex-shrink-0 " />
                      </div>
                      <Input
                        value={link.value || ""}
                        onChange={(e) =>
                          updateSocialLink(link.key, e.target.value)
                        }
                        placeholder={link.placeholder}
                        className="flex-1 text-sm border-none"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSocialLink(link.key)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between border-t">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading || isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isUploading || !formData.name.trim()}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {isLoading
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
              ? "Edit"
              : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
