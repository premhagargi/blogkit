import * as React from "react";
import { cn } from "@/lib/utils";

const inputBaseClasses =
  "h-12 px-4 w-full border-none focus-visible:outline-none focus-visible:ring-0";
const placeholderClasses = "placeholder:text-muted-foreground";

type InputProps = React.ComponentProps<"input"> & {
  suffix?: string;
};

function Input({ className, type, suffix, ...props }: InputProps) {
  return (
    <div
      className={cn(
        "flex w-full rounded-xl border border-input focus-within:ring-[0.5px] focus-within:ring-ring focus-within:ring-offset-[0.2px]"
      )}
    >
      <input
        type={type}
        data-slot="input"
        className={cn(
          inputBaseClasses,
          placeholderClasses,
          suffix ? "rounded-r-none" : "rounded-xl",
          className
        )}
        {...props}
      />
      {suffix && (
        <div className="h-12 px-3 flex items-center border-l border-input rounded-r-xl bg-muted text-md text-muted-foreground">
          {suffix}
        </div>
      )}
    </div>
  );
}

export { Input };
