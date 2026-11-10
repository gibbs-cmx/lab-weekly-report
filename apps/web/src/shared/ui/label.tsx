import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("block text-xs font-semibold text-sub select-none", className)}
      {...props}
    />
  );
}

export { Label };
