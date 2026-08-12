import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Space_Mono } from "next/font/google";
import { PwaRegistration } from "./components/PwaRegistration";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const labelFont = Space_Mono({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
    metadataBase: new URL("https://baylayer-labs.amitcodecraft.chatgpt.site"),
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
  themeColor: "#0c1b33",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${labelFont.variable}`}>
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
