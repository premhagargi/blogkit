"use client";
import { useContext, useState, useMemo } from "react";
import { FormContext, FormField } from "../context/form-context";
import { cn } from "@/lib/utils";
import { countries, Country } from "@/lib/countries";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import parse from "html-react-parser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X as CloseIcon } from "lucide-react";
import Image from "next/image";
import CountryField from "./country-field";
import PhoneField from "./Phone-field";

// --- Custom Field Rendering Logic ---
const renderField = (
  field: FormField,
  isDark: boolean,
  value: any,
  onChange: (fieldId: string, value: any) => void,
  errors: { [key: string]: string },
  phoneCountry: Country,
  setPhoneCountry: React.Dispatch<React.SetStateAction<Country>>,
  countryOptions: Country[]
) => {
  const baseInputClasses =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const errorClasses = errors[field.id]
    ? "border-red-500 ring-red-500 focus-visible:ring-red-500"
    : "";

  // --- Field Type Components ---
  switch (field.type) {
    case "Email":
    case "Password":
    case "ShortText":
      return (
        <Input
          type={
            field.type === "Password"
              ? "password"
              : field.type === "Email"
              ? "email"
              : "text"
          }
          placeholder={field.placeholder}
          className={cn(errorClasses)}
          value={value || ""}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );

    case "LongText":
      return (
        <Textarea
          placeholder={field.placeholder}
          className={cn(errorClasses)}
          rows={4}
          value={value || ""}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );

    case "Select":
      return (
        <Select
          onValueChange={(val) => onChange(field.id, val)}
          value={value || ""}
        >
          <SelectTrigger className={cn("w-full", errorClasses)}>
            <SelectValue
              placeholder={field.placeholder || "Select an option"}
            />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "Country":
      return (
        <CountryField
          defaultValue={value}
          onChange={(newValue) => onChange(field.id, newValue)}
          className={cn(errors[field.id] ? "border-red-500" : "")}
          placeholder={field.placeholder}
        />
      );

    case "Phone":
      return (
        <PhoneField
          value={value}
          onChange={(newValue) => onChange(field.id, newValue)}
          className={cn(
            errors[field.id]
              ? "!border-red-500 ring-2 ring-red-500 ring-offset-2"
              : ""
          )}
        />
      );

    case "MultiSelect":
      const selectedValues = new Set(value || []);
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between font-normal h-auto min-h-10",
                errorClasses
              )}
            >
              <div className="flex gap-1 flex-wrap">
                {selectedValues.size > 0 ? (
                  field.options
                    ?.filter((opt) => selectedValues.has(opt))
                    .map((opt) => (
                      <Badge
                        key={opt}
                        variant="secondary"
                        className="mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newValues = new Set(selectedValues);
                          newValues.delete(opt);
                          onChange(field.id, Array.from(newValues));
                        }}
                      >
                        {opt}
                        <CloseIcon className="ml-1 h-3 w-3" />
                      </Badge>
                    ))
                ) : (
                  <span className="text-muted-foreground">
                    {field.placeholder || "Select options"}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search options..." />
              <CommandList>
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup>
                  {field.options?.map((option) => {
                    const isSelected = selectedValues.has(option);
                    return (
                      <CommandItem
                        key={option}
                        onSelect={() => {
                          const newValues = new Set(selectedValues);
                          if (isSelected) {
                            newValues.delete(option);
                          } else {
                            newValues.add(option);
                          }
                          onChange(field.id, Array.from(newValues));
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );

    default:
      return (
        <Input
          type="text"
          placeholder={field.placeholder}
          className={cn(errorClasses)}
          value={value || ""}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      );
  }
};

// --- Main Form Component ---
export default function DynamicForm() {
  const {
    formState,
    theme,
    updateFieldValue,
    setIsConfirmationVisible,
    setIsFormAndConfirmationVisible, // New context function
  } = useContext(FormContext);
  const {
    heading,
    description,
    fields,
    buttonText,
    footnote,
    isMandatory,
    formType,
    formValues,
  } = formState;
  const isDark = theme === "dark";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [phoneCountry, setPhoneCountry] = useState<Country>(countries[0]);
  const countryOptions = useMemo(() => countries, []);

  const formClasses = cn(
    "p-6 rounded-lg flex flex-col items-center gap-4 w-full max-w-[400px] mx-auto shadow-xl relative", // Added relative positioning
    {
      "bg-white text-gray-800": !isDark,
      "bg-zinc-800 text-gray-200": isDark,
      "shadow-2xl": formType === "PopUp" || formType === "Gated",
      "fixed bottom-5 right-5 z-20 max-w-[400px]": formType === "Floating",
      "border dark:border-zinc-700":
        formType === "InLine" || formType === "EndOfPost",
      "border dark:border-zinc-700 !max-w-full": formType === "Sidebar",
    }
  );

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    sortedFields.forEach((field) => {
      const plainLabel = field.label.replace(/\*$/, "").trim();
      const value = formValues[field.id];

      // Updated validation logic for phone and other fields
      let isMissing = !value;
      if (field.type === "Phone") {
        isMissing = !value || !value.phoneNumber;
      } else if (Array.isArray(value)) {
        isMissing = value.length === 0;
      }

      if (field.isRequired && isMissing) {
        if (field.type === "Country" || field.type === "Phone") {
          newErrors[field.id] = `${plainLabel} is required.`;
        } else {
          newErrors[field.id] = `${plainLabel} is required.`;
        }
      }
      if (field.type === "Email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = "Invalid email format.";
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (validate()) {
      setIsConfirmationVisible(true);
    }
  };

  const handleClose = () => {
    // New handler to close the form
    if (setIsFormAndConfirmationVisible) {
      setIsFormAndConfirmationVisible(false);
    }
  };

  const showCloseButton =
    !isMandatory && ["PopUp", "Floating", "Gated"].includes(formType);

  return (
    <form className={formClasses}>
      {showCloseButton && (
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Close form"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      )}
      <div className="text-center">
        <h2 className="text-2xl font-bold">{heading}</h2>
        {description && (
          <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
            {parse(description)}
          </p>
        )}
      </div>

      <div className="w-full space-y-4">
        {sortedFields.map((field) => (
          <div key={field.id} className="w-full text-left">
            <label className="block text-sm font-medium mb-1.5">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(
              field,
              isDark,
              formValues[field.id],
              updateFieldValue,
              errors,
              phoneCountry,
              setPhoneCountry,
              countryOptions
            )}
            {errors[field.id] && (
              <p className="text-red-500 text-xs mt-1">{errors[field.id]}</p>
            )}
          </div>
        ))}
      </div>
      <button
        type="submit"
        onClick={handleSubmit}
        className={cn(
          "w-full py-2 px-4 rounded-md font-semibold hover:opacity-90",
          isDark ? "bg-blue-500 text-white" : "bg-black text-white"
        )}
      >
        {buttonText}
      </button>
      {footnote && (
        <p className="text-xs text-center text-muted-foreground">
          {parse(footnote)}
        </p>
      )}
    </form>
  );
}
