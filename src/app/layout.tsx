import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "EcoIntel | Intelligence for the Circular Electronics Economy",
  description:
    "AI-powered operating platform for detecting, diagnosing, reconstructing, and recovering value from electronic waste intelligently.",
  keywords: [
    "Circular Electronics",
    "AI Component Detection",
    "PCB Reconstruction",
    "Precious Metal Intelligence",
    "Blockchain Component Passport",
    "Polygon Network",
    "Deep Tech AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} scroll-smooth`}
    >
      <body className="bg-[#F8FAFC] text-[#0F172A] font-sans antialiased min-h-screen relative selection:bg-[#2563EB]/10">
        {children}
      </body>
    </html>
  );
}
