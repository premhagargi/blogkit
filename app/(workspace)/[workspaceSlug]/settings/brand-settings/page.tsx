"use client";
import { Switch } from "@/components/ui/switch";
import { ImageIcon } from "lucide-react";
import { useContext, useState } from "react";
import { ChromePicker } from "react-color";
import { Dialog } from "@/components/ui/dialog";
import { DialogContent, DialogTrigger } from "@/components/ui/dialog";
import FontSettings from "./components/font-setting-row";
import Image from "next/image";
import { HeaderContext } from "@/modules/workspace/settings/global-header/context/header-context";
import { BrandContext } from "@/providers/brand-provider";

function ColorSwatch({
  hex,
  onChange,
  disabled = false,
}: {
  hex: string;
  onChange: (newHex: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`flex flex-col items-start gap-y-1  ${disabled ? "hidden" : ""
        }`}
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            disabled={disabled}
            className="h-18 w-18  border cursor-pointer "
            style={{ backgroundColor: hex }}
          />
        </DialogTrigger>
        {!disabled && (
          <DialogContent
            showCloseButton={false}
            className="w-fit p-0 m-0 rounded-xl overflow-hidden"
          >
            <ChromePicker color={hex} onChange={(c) => onChange(c.hex)} />
          </DialogContent>
        )}
      </Dialog>
      <p className="text-small ml-[12px]">{hex}</p>
    </div>
  );
}

const ImageUploadPlaceholder = ({
  label,
  className = "w-24 h-16",
  disabled = false,
  imageUrl,
  onImageChange,
}: {
  label?: string;
  className?: string;
  disabled?: boolean;
  imageUrl: string;
  onImageChange: (url: string) => void;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newImageUrl = URL.createObjectURL(file);
      onImageChange(newImageUrl);
    }
  };

  return (
    <div
      className={`flex flex-col items-start gap-y-2 ${disabled ? "hidden" : ""
        }`}
    >
      {label && <p className="text-normal">{label}</p>}

      <label
        className={`relative flex items-center justify-center bg-secondary ${className}  overflow-hidden cursor-pointer ${disabled ? "pointer-events-none" : ""
          }`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Uploaded"
            width={400}
            height={400}
            className="object-contain w-full h-full"
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        )}

        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={handleChange}
        />
      </label>
    </div>
  );
};

const SettingsSection = ({
  title,
  description,
  children,
  showRestore = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  showRestore?: boolean;
}) => (
  <div className="grid grid-cols-1 gap-8 border-t py-md md:grid-cols-[350px_1fr]">
    <div>
      <h3 className="text-main">{title}</h3>
      <p className="text-small max-w-[220px]">{description}</p>
      {showRestore && (
        <p className="text-small underline mt-0.5 cursor-pointer">
          Restore default
        </p>
      )}
    </div>
    <div className="flex items-start mt-1">{children}</div>
  </div>
);

function CornerRadiusSelector() {
  const [selected, setSelected] = useState("Curved");

  const options = [
    { label: "Curved", className: "rounded-tl-md" },
    { label: "Rounded", className: "rounded-tl-2xl" },
    { label: "Sharp", className: "rounded-none" },
  ];

  return (
    <div className="flex gap-x-4">
      {options.map(({ label, className }) => (
        <button
          key={label}
          onClick={() => setSelected(label)}
          className="flex flex-col items-center gap-y-2 focus:outline-none"
        >
          <p
            className={`text-normal ${selected === label ? "text-normal" : "text-normal-muted"
              }`}
          >
            {label}
          </p>

          {/* outer box */}
          <div
            className={`flex h-[80px] w-[80px] items-start justify-start cursor-pointer p-2 transition rounded-xl 
              ${selected === label
                ? "border-2 border-primary/50"
                : "border-2 border-secondary"
              }`}
          >
            {/* inner corner stroke */}
            <div
              className={`h-[90%] w-[90%] border-t-2 border-l-2 border-foreground ${className}`}
            />
          </div>
        </button>
      ))}
    </div>
  );
}

function BrandColors({ darkModeDisabled }: { darkModeDisabled: boolean }) {
  const [brandColors, setBrandColors] = useState([
    { label: "Primary Color", lightHex: "#FF9F4D", darkHex: "#FF9F4D" },
    { label: "Secondary Color", lightHex: "#B8B8B8", darkHex: "#D9D9D9" },
    { label: "Background Color", lightHex: "#FFFFFF", darkHex: "#000000" },
    { label: "Heading Text Color", lightHex: "#000000", darkHex: "#FFFFFF" },
    { label: "Body Text Color", lightHex: "#6E6E6E", darkHex: "#D1D1D1" },
    { label: "Button Color", lightHex: "#FF9F4D", darkHex: "#FF9F4D" },
    { label: "Button Text Color", lightHex: "#FFFFFF", darkHex: "#FFFFFF" },
  ]);

  const updateColor = (
    label: string,
    mode: "lightHex" | "darkHex",
    value: string
  ) => {
    setBrandColors((prev) =>
      prev.map((c) => (c.label === label ? { ...c, [mode]: value } : c))
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 border-t py-md md:grid-cols-[200px_1fr]">
        <div className="flex flex-col gap-y-6">
          {/* Header Row */}
          <div className="grid grid-cols-[350px_100px_100px] items-center justify-start gap-x-4">
            <div className="flex flex-col">
              <h3 className="text-main">Brand Colors</h3>
              <p className="text-small underline mt-0.5 cursor-pointer">
                Restore default
              </p>
            </div>

            <p className="text-normal text-center  mt-1 ml-2">Light Mode</p>
            <p
              className={`text-normal text-center mt-1 ml-2 ${!darkModeDisabled ? "hidden" : "text-foreground"
                }`}
            >
              Dark Mode
            </p>
          </div>

          {/* Colors */}
          {brandColors.map((color) => (
            <div
              key={color.label}
              className="grid grid-cols-[370px_100px_100px] items-start gap-x-4"
            >
              <div>
                <p className="text-normal">{color.label}</p>
                <p className="text-small">Used for Buttons, XYZ, XYZ and XYZ</p>
              </div>

              {/* Light */}
              <ColorSwatch
                hex={color.lightHex}
                onChange={(val) => updateColor(color.label, "lightHex", val)}
              />

              {/* Dark */}
              <ColorSwatch
                hex={color.darkHex}
                onChange={(val) => updateColor(color.label, "darkHex", val)}
                disabled={!darkModeDisabled}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BrandSettings() {
  const {
    logoUrls,
    setLogoUrl,
    faviconUrl,
    setFaviconUrl,
    darkModeEnabled,
    setDarkModeEnabled,
  } = useContext(BrandContext);  // <-- use BrandContext instead of HeaderContext

  return (
    <div className="h-full p-4 sm:p-6">
      <header className="mb-md">
        <h1 className="text-header">Brand Settings</h1>
        <p className="text-normal-muted">Manage your brand</p>
      </header>

      <main>
        <SettingsSection
          title="Dark Mode"
          description="Toggle dark mode support"
        >
          <div className="flex items-center gap-x-2">
            <Switch
              id="dark-mode"
              checked={darkModeEnabled}
              onCheckedChange={setDarkModeEnabled}
            />
            <label htmlFor="dark-mode" className="text-normal ">
              {darkModeEnabled ? "Enabled" : "Disabled"}
            </label>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Brand Logo"
          description="Supported formats (JPG, PNG, WebP)"
        >
          <div className="flex gap-x-4">
            <ImageUploadPlaceholder
              className="w-28 h-16"
              label="Light Mode"
              imageUrl={logoUrls.light}
              onImageChange={(url) => setLogoUrl("light", url)}
            />
            <ImageUploadPlaceholder
              disabled={!darkModeEnabled}
              className="w-28 h-16"
              label="Dark Mode"
              imageUrl={logoUrls.dark}
              onImageChange={(url) => setLogoUrl("dark", url)}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Favicon" description="Recommended size 100x100">
          <ImageUploadPlaceholder
            className="w-18 h-18"
            imageUrl={faviconUrl}
            onImageChange={setFaviconUrl}
          />
        </SettingsSection>

        <BrandColors darkModeDisabled={darkModeEnabled} />

        <SettingsSection title="Corner Radius" description="">
          <CornerRadiusSelector />
        </SettingsSection>

        <SettingsSection title="Fonts" description="" showRestore>
          <FontSettings />
        </SettingsSection>
      </main>
    </div>
  );
}

