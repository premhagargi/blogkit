"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Hash, Circle, User, Tag, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
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

export interface ActiveFilter {
  id: string;
  type: "search" | "statuses" | "categories" | "tags" | "authors";
  label: string;
  value: string | string[];
  count?: number;
}

interface ActiveFilterChipProps {
  filter: ActiveFilter;
  onRemove: (filterId: string) => void;
  onUpdate?: (filterId: string, newValue: string | string[]) => void;
  options?: Array<{ id: string; name: string; label?: string; image?: string }>;
  currentValue?: string | string[];
}

const filterIcons = {
  search: null,
  statuses: Circle,
  categories: Hash,
  tags: Tag,
  authors: User,
};

const filterColors = {
  search: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  statuses: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  categories:
    "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  tags: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  authors: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
};

const statusOptions = [
  { id: "PUBLISHED", name: "Published", label: "Published" },
  { id: "DRAFT", name: "Draft", label: "Draft" },
  { id: "SCHEDULED", name: "Scheduled", label: "Scheduled" },
  { id: "ARCHIVED", name: "Archived", label: "Archived" },
];

export function ActiveFilterChip({
  filter,
  onRemove,
  onUpdate,
  options = [],
  currentValue,
}: ActiveFilterChipProps) {
  const [open, setOpen] = useState(false);
  const Icon = filterIcons[filter.type];

  // For search filters only - show simple remove button
  if (filter.type === "search" || !onUpdate) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "flex items-center gap-1.5 pr-1 pl-2.5 py-1 text-xs font-medium border",
          filterColors[filter.type]
        )}
      >
        {Icon && <Icon className="h-3 w-3" />}
        <span>{filter.label}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(filter.id)}
          className="h-4 w-4 p-0 hover:bg-black/10 rounded-full ml-1"
        >
          <X className="h-2.5 w-2.5" />
        </Button>
      </Badge>
    );
  }

  // For multiselect filters
  const selectedValues = Array.isArray(filter.value)
    ? filter.value
    : [filter.value];

  const getFilterOptions = () => {
    if (filter.type === "statuses") {
      return statusOptions;
    }
    // ✅ Options are already mapped with IDs from the parent component
    return options.map((opt) => ({
      id: opt.id,
      name: opt.name,
      label: opt.label || opt.name,
    }));
  };

  const filterOptions = getFilterOptions();

  const toggleSelection = (optionId: string) => {
    const newSelection = selectedValues.includes(optionId)
      ? selectedValues.filter((id) => id !== optionId)
      : [...selectedValues, optionId];

    onUpdate(filter.id, newSelection);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          variant="secondary"
          className={cn(
            "flex items-center gap-1.5 pr-1 pl-2.5 py-1 text-xs font-medium border cursor-pointer transition-colors",
            filterColors[filter.type]
          )}
        >
          {Icon && <Icon className="h-3 w-3" />}
          <span>
            {filter.count && filter.count > 1
              ? `${filter.type} (${filter.count})`
              : filter.label}
          </span>
          <div className="flex items-center ml-1 gap-0.5">
            <ChevronDown className="h-2.5 w-2.5" />
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(filter.id);
              }}
              className="h-4 w-4 p-0 hover:bg-black/10 rounded-full"
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          </div>
        </Badge>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          {filterOptions.length > 5 && (
            <CommandInput
              placeholder={`Search ${filter.type}...`}
              className="h-9"
            />
          )}
          <CommandEmpty>No {filter.type} found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {filterOptions.map((option) => {
                const isSelected = selectedValues.includes(option.id);
                return (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => toggleSelection(option.id)}
                  >
                    <div
                      className={cn(
                        "mr-2 h-4 w-4 border border-primary rounded flex items-center justify-center",
                        isSelected ? "bg-primary" : "bg-background"
                      )}
                    >
                      {isSelected && (
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex items-center">
                      {filter.type === "authors" &&
                        options.find((a) => a.id === option.id)?.image && (
                          <img
                            src={options.find((a) => a.id === option.id)?.image}
                            alt={option.name}
                            className="w-4 h-4 rounded-full mr-2"
                          />
                        )}
                      {option.label}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface ActiveFiltersBarProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filterId: string) => void;
  onUpdateFilter?: (filterId: string, newValue: string | string[]) => void;
  onClearAll: () => void;
  categories?: string[];
  tags?: Array<{ name: string; posts: number; traffic: number; leads: number }>;
  authors?: Array<{ id: string; name: string; email: string; image?: string }>;
}

export function ActiveFiltersBar({
  activeFilters,
  onRemoveFilter,
  onUpdateFilter,
  onClearAll,
  categories = [],
  tags = [],
  authors = [],
}: ActiveFiltersBarProps) {
  if (activeFilters.length === 0) {
    return null;
  }

  const getOptionsForFilter = (filter: ActiveFilter) => {
    switch (filter.type) {
      case "categories":
        return categories.map((cat) => ({ id: cat, name: cat }));
      case "tags":
        return tags.map((tag) => ({ id: tag.name, name: tag.name }));
      case "authors":
        return authors.map((author) => ({
          id: author.id,
          name: author.name,
          image: author.image,
        }));
      default:
        return [];
    }
  };

  return (
    <div className="flex items-center gap-2 px-6 pb-4 border-b ">
      <p className="text-normal">Active filters </p>
      <div className="flex items-center gap-2 flex-wrap">
        {activeFilters.map((filter) => (
          <ActiveFilterChip
            key={filter.id}
            filter={filter}
            onRemove={onRemoveFilter}
            onUpdate={onUpdateFilter}
            options={getOptionsForFilter(filter)}
            currentValue={filter.value}
          />
        ))}
      </div>
      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-small"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
