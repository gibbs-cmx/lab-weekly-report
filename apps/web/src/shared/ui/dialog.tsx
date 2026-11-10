"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const Dialog = DialogPrimitive.Root;

const overlayClass =
  "fixed inset-0 z-50 bg-ink/32 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0";

const closeClass =
  "flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-track focus-visible:ring-4 focus-visible:ring-ring/20";

function DialogCloseButton({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Close aria-label="닫기" className={cn(closeClass, className)}>
      <XIcon className="size-[18px]" />
    </DialogPrimitive.Close>
  );
}

/** 가운데 모달 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className={overlayClass} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white text-sm shadow-[0_24px_64px_rgba(21,23,26,0.24)] duration-150 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && <DialogCloseButton className="absolute top-4 right-4" />}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

/** 오른쪽에서 열리는 패널 */
function DrawerContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className={overlayClass} />
      <DialogPrimitive.Popup
        data-slot="drawer-content"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[560px] max-w-full flex-col bg-paper-soft text-sm shadow-[-24px_0_48px_rgba(21,23,26,0.16)] duration-200 outline-none data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-4 overflow-y-auto px-7 pt-7 pb-5", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex justify-end gap-2 border-t border-line-soft bg-paper-soft px-7 py-4",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title className={cn("pr-10 text-lg font-semibold", className)} {...props} />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-[13px] leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DrawerContent,
};
