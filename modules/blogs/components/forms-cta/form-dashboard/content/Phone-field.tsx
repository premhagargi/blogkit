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

// Define the shape of the value for the onChange handler
interface PhoneValue {
  countryCode: string;
  phoneNumber: string;
  fullNumber: string;
}

interface PhoneInputProps {
  className?: string;
  defaultCountry?: string; // e.g., "US"
  value?: Partial<PhoneValue>;
  onChange?: (value: PhoneValue) => void;
}

export default function PhoneField({
  className,
  defaultCountry = "US",
  value = {},
  onChange,
}: PhoneInputProps) {
  const [selectedCode, setSelectedCode] = useState<string>(
    value.countryCode || defaultCountry
  );
  const [phoneNumber, setPhoneNumber] = useState<string>(
    value.phoneNumber || ""
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // This effect syncs the component's internal state if the parent's value prop changes.
  // This is crucial for controlled components.
  useEffect(() => {
    setSelectedCode(value.countryCode || defaultCountry);
    setPhoneNumber(value.phoneNumber || "");
  }, [value.countryCode, value.phoneNumber, defaultCountry]);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === selectedCode),
    [selectedCode]
  );

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.phone.includes(searchQuery)
    );
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) setSearchQuery("");
  }, [isOpen]);

  // Handler for when a new country is selected from the dropdown
  const handleCountryChange = (newCountryCode: string) => {
    const newCountry = countries.find((c) => c.code === newCountryCode);
    setSelectedCode(newCountryCode);
    // Directly call onChange here
    if (onChange && newCountry) {
      onChange({
        countryCode: newCountryCode,
        phoneNumber, // Use the current phone number state
        fullNumber: `${newCountry.phone}${phoneNumber}`,
      });
    }
  };

  // Handler for when the phone number input changes
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = e.target.value.replace(/\D/g, "");
    setPhoneNumber(formattedNumber);
    // Directly call onChange here
    if (onChange && selectedCountry) {
      onChange({
        countryCode: selectedCode, // Use the current country code state
        phoneNumber: formattedNumber,
        fullNumber: `${selectedCountry.phone}${formattedNumber}`,
      });
    }
  };

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center rounded-md border border-input bg-white text-sm ring-offset-background",
        className
      )}
    >
      <Select
        value={selectedCode}
        onValueChange={handleCountryChange} // Use the new handler
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="h-full w-auto border-0 bg-transparent py-2 pl-3 pr-2 shadow-none focus:ring-0 focus-visible:ring-0">
          <SelectValue>
            <div className="flex items-center gap-2">
              {/* {selectedCountry && (
                <Image
                  src={`/flags/${selectedCountry.code.toLowerCase()}.svg`}
                  alt={selectedCountry.name}
                  width={20}
                  height={15}
                  className="object-contain"
                />
              )} */}
              <span>{selectedCountry?.phone}</span>
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent position="popper" className="max-h-[300px] w-[97%]">
          <Input
            placeholder="Search..."
            className="mb-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="max-h-[220px] overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* <Image
                        src={`/flags/${country.code.toLowerCase()}.svg`}
                        alt={country.name}
                        width={20}
                        height={15}
                        className="object-contain"
                      /> */}
                      <span className="truncate">{country.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {country.phone}
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            )}
          </div>
        </SelectContent>
      </Select>

      <Input
        type="tel"
        placeholder="Phone number"
        className="h-full flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 "
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
      />
    </div>
  );
}
