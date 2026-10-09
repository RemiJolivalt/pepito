import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://www.biendecider.com"),
  title: "BienDecider",
  description: "Votre équipe IA pour développer votre activité : diagnostic, plan d'action et productions validées par vous.",
  applicationName: "BienDecider",
  openGraph: {
    title: "BienDecider",
    description: "Votre équipe IA pour développer votre activité, avec votre validation à chaque étape.",
    siteName: "BienDecider",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
