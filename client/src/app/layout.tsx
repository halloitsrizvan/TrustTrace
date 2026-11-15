import type { Metadata, Viewport } from "next";
import { Archivo, Atkinson_Hyperlegible, Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { copy } from "@/lib/copy";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});
const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-malayalam",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${copy.app.name}: lost and found on one board`, template: `%s | ${copy.app.name}` },
  description:
    "Report lost and found items on one campus board. We match them and check the owner with a blind proof before anything is handed back.",
  applicationName: copy.app.name,
  openGraph: {
    title: copy.app.name,
    description: "Lost it or found it? Start on one board.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F4FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1130" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${body.variable} ${malayalam.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-2xl focus:bg-ultra focus:px-4 focus:py-2 focus:text-on-ultra"
        >
          {copy.nav.skip}
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
