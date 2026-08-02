import type { Metadata } from "next";
import { Cairo, Playfair_Display } from "next/font/google";
import "./globals.css";
import Drawers from "@/components/Drawers";
import BackButton from "@/components/BackButton";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "كليوباترا للذهب - Cleopatra Gold",
  description: "المتجر الإلكتروني الفخم للذهب والمجوهرات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${playfair.variable}`}>
      <body>
        {children}
        <Drawers />
        <BackButton />
      </body>
    </html>
  );
}
