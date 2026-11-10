import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

export const fieldClass =
  "w-full min-w-0 rounded-md border border-line-strong bg-white px-3 text-sm text-ink transition-[border-color,box-shadow] outline-none placeholder:text-faint focus-visible:border-cobalt focus-visible:ring-4 focus-visible:ring-cobalt/12 disabled:cursor-not-allowed disabled:bg-paper-soft disabled:text-sub";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(fieldClass, "h-11", className)}
      {...props}
    />
  );
}

export { Input };
