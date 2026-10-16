import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { SITE_CONFIG } from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${SITE_CONFIG.name} | Criador de Currículos com IA — R$ 0,50 por currículo`,
  description: SITE_CONFIG.description,
  keywords: [
    "currículo com IA",
    "fazer currículo online",
    "gerador de currículo pdf",
    "currículo ats",
    "currículo primeiro emprego",
    "currículo profissional barato",
  ],
  authors: [{ name: SITE_CONFIG.name }],
  robots: "index, follow",
  openGraph: {
    title: `${SITE_CONFIG.name} — Seu próximo currículo começa aqui`,
    description: SITE_CONFIG.tagline,
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
