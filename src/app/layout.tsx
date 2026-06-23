import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Şipşakspor — İstanbul'un Spor Rezervasyon Platformu",
    template: "%s | Şipşakspor",
  },
  description: "İstanbul'da yoga, pilates, padel, halı saha, boks ve daha fazlası. Tek platformdan spor salonu rezervasyonu yap — Şipşakspor.",
  keywords: ["spor rezervasyon", "İstanbul spor", "yoga İstanbul", "pilates İstanbul", "padel İstanbul", "halı saha İstanbul", "spor salonu", "şipşakspor", "sipşakspor"],
  authors: [{ name: "Şipşakspor" }],
  creator: "Şipşakspor",
  metadataBase: new URL("https://sipsakspor.com"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://sipsakspor.com",
    siteName: "Şipşakspor",
    title: "Şipşakspor — İstanbul'un Spor Rezervasyon Platformu",
    description: "İstanbul'da yoga, pilates, padel, halı saha, boks ve daha fazlası. Tek platformdan spor salonu rezervasyonu yap.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Şipşakspor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Şipşakspor — İstanbul'un Spor Rezervasyon Platformu",
    description: "İstanbul'da spor salonu rezervasyonu. Yoga, pilates, padel, halı saha ve daha fazlası.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          {children}
          <Footer />
          <ChatWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
