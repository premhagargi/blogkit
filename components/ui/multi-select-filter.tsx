"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Option {
  id: string;
  name: string;
  label?: string;
  count?: number;
  image?: string;
  email?: string;
}

interface MultiSelectFilterProps {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  searchPlaceholder: string;
  options: Option[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  loading?: boolean;
  colorScheme?: {
    button: string;
    icon: string;
  };
  showSearch?: boolean;
  allowClearAll?: boolean;
  renderOption?: (option: Option, isSelected: boolean) => React.ReactNode;
}

export function MultiSelectFilter({
  icon: Icon,
  placeholder,
  searchPlaceholder,
  options,
  selectedValues,
  onSelectionChange,
  loading = false,
  colorScheme,
  showSearch = true,
  allowClearAll = true,
  renderOption,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleSelection = (optionId: string) => {
    const newSelection = selectedValues.includes(optionId)
      ? selectedValues.filter((id) => id !== optionId)
      : [...selectedValues, optionId];

    onSelectionChange(newSelection);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const getButtonText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    // return `${placeholder} ${
    //   selectedValues.length > 0 ? "(" + selectedValues.length + ")" : ""
    // }`;
    return placeholder;
  };

  const defaultRenderOption = (option: Option, isSelected: boolean) => (
    <>
      <div
        className={cn(
          "size-4 border border-primary rounded flex items-center justify-center shrink-0 mr-2",
          isSelected ? "bg-primary" : "bg-background"
        )}
      >
        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
      <Icon
        className={cn(
          "mr-2 h-3 w-3",
          colorScheme?.icon || "text-muted-foreground"
        )}
      />
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {option.image && (
            <img
              src={option.image}
              alt={option.name}
              className="w-4 h-4 rounded-full mr-2"
            />
          )}
          <div className="flex flex-col">
            <span>{option.label || option.name}</span>
            {option.email && (
              <span className="text-xs text-muted-foreground">
                {option.email}
              </span>
            )}
          </div>
        </div>
        {/* {option.count && (
          <span className="text-xs text-muted-foreground ml-2">
            {option.count}
          </span>
        )} */}
      </div>
    </>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-8 text-normal justify-between",
            selectedValues.length > 0 && colorScheme?.button
          )}
          disabled={loading}
        >
          <Icon className="!h-3 !w-3" />
          {getButtonText()}
          {/* <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" /> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0" align="start">
        <Command>
          {showSearch && options.length > 5 && (
            <CommandInput placeholder={searchPlaceholder} className="h-9" />
          )}
          <CommandEmpty>No {placeholder.toLowerCase()} found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {allowClearAll && selectedValues.length > 0 && (
                <CommandItem
                  value="clear-all"
                  onSelect={clearAll}
                  className="text-muted-foreground gap-0"
                >
                  <div className="mr-2 h-4 w-4 border border-muted-foreground rounded flex items-center justify-center">
                    {/* Empty checkbox for clear all */}
                  </div>
                  Clear all {placeholder.toLowerCase()}
                </CommandItem>
              )}
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.id);
                return (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    className="gap-0"
                    onSelect={() => toggleSelection(option.id)}
                  >
                    {renderOption
                      ? renderOption(option, isSelected)
                      : defaultRenderOption(option, isSelected)}
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
