import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
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
  title: "MNQ / MES Trading Journal",
  description: "ICT-style futures journal: log sessions, track adherence, review setups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
      </html>
    </ClerkProvider>
  );
}
