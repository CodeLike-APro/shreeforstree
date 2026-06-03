import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "shreeforstree",
    template: "%s | shreeforstree",
  },
  description:
    "Handcrafted, made-to-measure women's clothing tailored to your story. Explore our exclusive collection of custom ethnic, fusion, and contemporary designs — where every stitch is personal.",
  keywords: [
    "custom women's clothing",
    "tailored outfits",
    "handmade fashion",
    "ethnic wear",
    "made to measure",
  ],
  openGraph: {
    title: "shreeforstree",
    description:
      "Handcrafted, made-to-measure women's clothing tailored to your story.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {children}
      </body>
    </html>
  );
}
