import { cn } from "@/shared/lib/utils";

import { fieldClass } from "./input";

/** 네이티브 select — Input 과 동일한 룩 */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldClass, "h-11", className)} {...props} />;
}
