import * as React from "react";

import { cn } from "@/shared/lib/utils";

import { fieldClass } from "./input";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldClass, "field-sizing-content min-h-16 py-2.5 leading-[1.7]", className)}
      {...props}
    />
  );
}

export { Textarea };
