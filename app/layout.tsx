import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Sovereign Vault — Forensic R&D Evidence",
  description:
    "Cryptographically verified R&D tax credit evidence for HMRC, IRS, and FTA compliance."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0a0f1a] text-white antialiased">{children}</body>
    </html>
  );
}

