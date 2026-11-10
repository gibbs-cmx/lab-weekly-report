"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border border-transparent font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-ink text-white hover:bg-ink-soft font-semibold",
        outline: "border-[#e2e0da] bg-white text-ink-soft hover:bg-paper-soft",
        ghost: "text-ink-soft hover:bg-track",
        danger: "text-bad-fg hover:bg-bad-bg",
        dashed:
          "border-[1.5px] border-dashed border-[#cfcdc6] text-sub hover:border-sub hover:bg-white",
      },
      size: {
        default: "h-11 rounded-lg px-4 text-sm",
        sm: "h-9 rounded-md px-3 text-[13px]",
        lg: "h-12 rounded-lg px-5 text-[15px]",
        icon: "size-10 rounded-md",
        "icon-sm": "size-9 rounded-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
