"use client";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronDown,
  X,
  HelpCircle,
  RefreshCw,
  Tag,
  Hash,
  Check,
} from "lucide-react";
import { Tooltip } from "@/components/common/tooltip";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface CategoriesTagsMultiSelectProps {
  categories: Category[];
  tags: Tag[];
  selectedCategories: string[];
  selectedTags: string[];
  updateField: (field: string, value: any) => void;
  loadingCategories: boolean;
  loadingTags: boolean;
  categoriesError: any;
  tagsError: any;
  refreshCategories: () => void;
  refreshTags: () => void;
  tooltipContent?: string;
  label?: string;
}

export default function CategoriesTagsMultiSelect({
  categories,
  tags,
  selectedCategories,
  selectedTags,
  updateField,
  loadingCategories,
  loadingTags,
  categoriesError,
  tagsError,
  refreshCategories,
  refreshTags,
  tooltipContent = "Select categories and tags to organize your forms.",
  label = "Categories & Tags",
}: CategoriesTagsMultiSelectProps) {
  const [open, setOpen] = useState(false);

  // Combine categories and tags for multiselect
  const allOptions = useMemo(() => {
    const categoryOptions = (categories || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      label: cat.name,
      type: "category" as const,
    }));

    const tagOptions = (tags || []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      label: tag.name,
      type: "tag" as const,
    }));

    return [...categoryOptions, ...tagOptions];
  }, [categories, tags]);

  const selectedValues = useMemo(() => {
    return [...selectedCategories, ...selectedTags];
  }, [selectedCategories, selectedTags]);

  const allSelected =
    selectedValues.length === allOptions.length && allOptions.length > 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = allOptions.map((o) => o.id);
      const newCategories: string[] = [];
      const newTags: string[] = [];
      allIds.forEach((value) => {
        if (categories.some((cat) => cat.id === value)) {
          newCategories.push(value);
        } else if (tags.some((tag) => tag.id === value)) {
          newTags.push(value);
        }
      });
      updateField("categories", newCategories);
      updateField("tags", newTags);
    } else {
      updateField("categories", []);
      updateField("tags", []);
    }
  };

  const handleSelectionChange = (value: string) => {
    const newCategories = [...selectedCategories];
    const newTags = [...selectedTags];

    // Check if it's a category
    const isCategory = categories?.some((cat) => cat.id === value);
    const isTag = tags?.some((tag) => tag.id === value);

    if (isCategory) {
      const index = newCategories.indexOf(value);
      if (index > -1) {
        newCategories.splice(index, 1);
      } else {
        newCategories.push(value);
      }
      updateField("categories", newCategories);
    } else if (isTag) {
      const index = newTags.indexOf(value);
      if (index > -1) {
        newTags.splice(index, 1);
      } else {
        newTags.push(value);
      }
      updateField("tags", newTags);
    }
  };

  const removeItem = (value: string) => {
    const newCategories = selectedCategories.filter((id) => id !== value);
    const newTags = selectedTags.filter((id) => id !== value);
    updateField("categories", newCategories);
    updateField("tags", newTags);
  };

  const getSelectedItemsDisplay = () => {
    const selectedItems: {
      id: string;
      name: string;
      type: "category" | "tag";
    }[] = [];

    selectedCategories.forEach((catId) => {
      const cat = categories?.find((c) => c.id === catId);
      if (cat) {
        selectedItems.push({ id: catId, name: cat.name, type: "category" });
      }
    });

    selectedTags.forEach((tagId) => {
      const tag = tags?.find((t) => t.id === tagId);
      if (tag) {
        selectedItems.push({ id: tagId, name: tag.name, type: "tag" });
      }
    });

    return selectedItems;
  };

  const selectedItems = getSelectedItemsDisplay();

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Label htmlFor="categories-tags" className="text-normal font-medium">
          {label}
        </Label>
        <Tooltip content={tooltipContent}>
          <HelpCircle className="h-4 w-4 text-gray-400 cursor-pointer" />
        </Tooltip>
        {(categoriesError || tagsError) && (
          <div className="ml-auto flex gap-1">
            {categoriesError && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshCategories}
                className="h-6 px-2"
                title="Refresh categories"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
            {tagsError && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshTags}
                className="h-6 px-2"
                title="Refresh tags"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between min-h-10"
              disabled={loadingCategories || loadingTags}
            >
              <div className="flex flex-wrap gap-1">
                {selectedItems.length === 0 ? (
                  <span className="text-muted-foreground">
                    {loadingCategories || loadingTags
                      ? "Loading..."
                      : "Select categories and tags..."}
                  </span>
                ) : (
                  ""
                )}
                {selectedItems.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedItems.length} selected
                  </span>
                )}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search categories and tags..." />
              {/* Add All Posts with same checkbox UI & label */}
              <div className="px-2 py-1 border-b pl-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="add-all-posts"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="add-all-posts"
                    className="text-sm leading-tight cursor-pointer select-none mt-0.5"
                  >
                    Add All Posts
                  </Label>
                </div>
              </div>
              <CommandEmpty>No items found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {allOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() => handleSelectionChange(option.id)}
                    >
                      <div className="flex items-start gap-2 w-full">
                        {/* Make item checkbox same as Add All */}
                        <Checkbox
                          id={`option-${option.id}`}
                          checked={selectedValues.includes(option.id)}
                          onCheckedChange={() =>
                            handleSelectionChange(option.id)
                          }
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`option-${option.id}`}
                          className="flex items-start gap-1 text-sm cursor-pointer w-full"
                        >
                          <span className="flex items-center gap-1 min-w-0">
                            {option.type === "category" ? (
                              <Hash className="h-3 w-3 text-blue-500 shrink-0" />
                            ) : (
                              <Tag className="h-3 w-3 text-green-500 shrink-0" />
                            )}
                            <span className="truncate max-w-[200px]">
                              {option.label}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              ({option.type})
                            </span>
                          </span>
                        </Label>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected items display */}
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs max-w-full "
              >
                <span className="flex items-center gap-1 min-w-0">
                  {item.type === "category" ? (
                    <Hash className="h-3 w-3 text-blue-500 shrink-0" />
                  ) : (
                    <Tag className="h-3 w-3 text-green-500 shrink-0" />
                  )}
                  <span className="truncate min-w-0">{item.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 flex items-center justify-center"
                >
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Helper text */}
      {!loadingCategories && !loadingTags && allOptions.length === 0 && (
        <p className="text-sm text-muted-foreground mt-1">
          Create categories and tags in your blog settings to organize forms
        </p>
      )}

      {(categoriesError || tagsError) && (
        <div className="mt-1 space-y-1">
          {categoriesError && (
            <p className="text-sm text-red-500">
              Failed to load categories.
              <button
                onClick={refreshCategories}
                className="underline ml-1 hover:no-underline"
              >
                Try again
              </button>
            </p>
          )}
          {tagsError && (
            <p className="text-sm text-red-500">
              Failed to load tags.
              <button
                onClick={refreshTags}
                className="underline ml-1 hover:no-underline"
              >
                Try again
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
