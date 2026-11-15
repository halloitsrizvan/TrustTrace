"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { copy } from "@/lib/copy";

/** Bottom sheet on mobile, centred dialog on wide screens. Radix handles focus trap and Escape. */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  testid,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  testid?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fade-in fixed inset-0 z-50 bg-[#141a3c]/55" />
        <Dialog.Content
          data-testid={testid}
          className="sheet-in fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-rule bg-surface px-6 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))] pt-4 sm:p-8 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[28px]"
        >
          <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-rule sm:hidden" />
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-display text-xl">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-ink-soft">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label={copy.action.close}
              className="grid size-11 shrink-0 place-items-center rounded-full text-ink hover:bg-ultra-tint"
            >
              <X size={20} strokeWidth={1.75} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
