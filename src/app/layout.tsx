import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
export const dynamic = 'force-dynamic'
export const revalidate = 0

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "InvoiceNaija",
  description: "Invoice management app for Nigerian businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#006B3C" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
