import type { Metadata } from "next";
import {
  Playfair_Display,
  Inter,
  Cormorant_Garamond,
  League_Spartan,
} from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const Cormorant = Cormorant_Garamond({
  variable: "--font-serif-alt",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const league = League_Spartan({
  variable: "--font-label",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "shreeforstree",
    template: "%s | shreeforstree",
  },
  description:
    "Handcrafted, made-to-order women's clothing tailored to your story. Explore our exclusive collection of custom ethnic, fusion, and contemporary designs — where every stitch is personal.",
  keywords: [
    "custom women's clothing",
    "tailored outfits",
    "handmade fashion",
    "ethnic wear",
    "made to order clothing",
  ],
  openGraph: {
    title: "shreeforstree",
    description:
      "Handcrafted, made-to-order women's clothing tailored to your story.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${playfair.variable} ${inter.variable} ${Cormorant.variable} ${league.variable} min-h-full flex flex-col font-body`}
      >
        {children}
      </body>
    </html>
  );
}
