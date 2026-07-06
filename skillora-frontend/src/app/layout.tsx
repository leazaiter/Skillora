import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers"; // Import your new provider wrapper
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Updated metadata from the stock "Create Next App" template strings
export const metadata: Metadata = {
  title: "Skillora | AI-Powered Career Growth Platform",
  description: "Unlock deep, interactive AI career insight tools and tailored roadmaps.",
};
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Wrapping children allows NextAuth hooks to be used anywhere on the client */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}