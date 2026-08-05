import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeWatcher } from "@/components/layout/ThemeWatcher";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),

  title: {
    default: "Raadhe Label — Garment Production & Order Management",
    template: "%s | Raadhe Label",
  },
  description:
    "Raadhe Label Production System — Manage bulk garment orders, boutique tailoring, client profiles, invoices, agreements, shop floor, and HRMS from a single platform.",
  keywords: [
    "garment production system",
    "bulk stitching management",
    "boutique order management",
    "tailor management software",
    "fashion production ERP",
    "invoice generator tailoring",
    "Raadhe Label",
    "Radhe Vastraz",
  ],
  authors: [{ name: "Raadhe Label — Radhe Vastraz" }],
  creator: "Raadhe Label",
  publisher: "Radhe Vastraz",
  applicationName: "Raadhe Label Production System",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    type: "website",
    siteName: "Raadhe Label Production System",
    title: "Raadhe Label — Garment Production & Order Management",
    description:
      "End-to-end garment production management: bulk orders, boutique tailoring, clients, invoices, payments, shop floor tracking, and HRMS.",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "Raadhe Label" }],
  },
  twitter: {
    card: "summary",
    title: "Raadhe Label — Production System",
    description:
      "Bulk stitching & boutique order management for Raadhe Label part of Radhe Vastraz.",
    images: ["/icon.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeWatcher />
        <AppLayout>{children}</AppLayout>
        <Toaster richColors position="top-right" swipeDirections={['top', 'right', 'bottom', 'left']} />
      </body>
    </html>
  );
}
