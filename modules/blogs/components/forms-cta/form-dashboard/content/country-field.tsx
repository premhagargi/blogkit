"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { countries } from "@/lib/countries";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface CountryFieldProps {
  className?: string;
  defaultValue?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string; // Add placeholder prop
}

export default function CountryField({
  className,
  defaultValue,
  onChange,
  placeholder, // Destructure placeholder
}: CountryFieldProps) {
  const [selectedCode, setSelectedCode] = useState<string | undefined>(
    defaultValue
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedCountry = countries.find((c) => c.code === selectedCode);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) {
      return countries;
    }
    return countries.filter((country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Reset search query when the select is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleValueChange = (newValue: string) => {
    setSelectedCode(newValue);
    if (onChange) {
      onChange(newValue); // Notify the parent component of the change
    }
  };

  return (
    <Select
      value={selectedCode}
      onValueChange={handleValueChange}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className={cn("w-full", className)}>
        {/* Use the dynamic placeholder prop with a fallback */}
        <SelectValue placeholder={placeholder || "Select a country"}>
          {selectedCountry && (
            <div className="flex items-center gap-2">
              {/* <Image
                src={`/flags/${selectedCountry.code.toLowerCase()}.svg`}
                alt={selectedCountry.name}
                width={20}
                height={15}
                className="object-contain"
              /> */}
              <span>{selectedCountry.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent
        position="popper"
        className="max-h-[300px] w-[--radix-select-trigger-width]"
      >
        <Input
          placeholder="Search country..."
          className="mb-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />

        {filteredCountries.length > 0 ? (
          filteredCountries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                {/* <Image
                  src={`/flags/${country.code.toLowerCase()}.svg`}
                  alt={country.name}
                  width={20}
                  height={15}
                  className="object-contain"
                /> */}
                <span>{country.name}</span>
              </div>
            </SelectItem>
          ))
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No countries found.
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
