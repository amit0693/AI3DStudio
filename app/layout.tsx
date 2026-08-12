import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegistration } from "./components/PwaRegistration";
import "./globals.css";

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
      default: "BayLayer Labs | Ideas, made local.",
      template: "%s | BayLayer Labs",
    },
    description:
      "Shop useful, personalized 3D prints or request a custom print made locally in the Bay Area.",
    applicationName: "BayLayer Labs",
    manifest: "/manifest.webmanifest",
    keywords: [
      "3D printing Bay Area",
      "custom 3D prints",
      "local prototyping",
      "personalized gifts",
    ],
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      title: "BayLayer Labs | Ideas, made local.",
      description:
        "Useful, personalized 3D prints and custom prototypes made in the Bay Area.",
      images: [{ url: "/og.png", width: 1672, height: 941 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "BayLayer Labs | Ideas, made local.",
      description:
        "Useful, personalized 3D prints and custom prototypes made in the Bay Area.",
      images: ["/og.png"],
    },
};

export const viewport: Viewport = {
  themeColor: "#14251c",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
