import Image from "next/image";
import { Phone, IdCard, BookOpen, Laptop, Wallet, KeyRound, Backpack, Package } from "lucide-react";
import type { ComponentType } from "react";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

export const categoryIcons: Record<string, ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  PHONE: Phone,
  ID_CARD: IdCard,
  BOOK: BookOpen,
  GADGET: Laptop,
  WALLET: Wallet,
  KEYS: KeyRound,
  BAG: Backpack,
  OTHER: Package,
};

/** Photo with a fixed aspect ratio. Falls back to a category glyph when there is no image. */
export function ItemPhoto({
  src,
  category,
  alt,
  ratio = "4 / 3",
  priority,
  className,
}: {
  src: string | null;
  category: string;
  alt: string;
  ratio?: string;
  priority?: boolean;
  className?: string;
}) {
  const Icon = categoryIcons[category] ?? Package;
  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-[6px] bg-ultra-tint", className)}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover"
          loading={priority ? undefined : "lazy"}
          priority={priority}
          unoptimized={src.startsWith("data:") || src.startsWith("blob:") || src.endsWith(".svg") || src.startsWith("/")}
        />
      ) : (
        <div role="img" aria-label={`${copy.category[category] ?? category}: no photo`} className="grid h-full w-full place-items-center text-ink-soft">
          <Icon size={36} strokeWidth={1.75} aria-hidden />
        </div>
      )}
    </div>
  );
}
