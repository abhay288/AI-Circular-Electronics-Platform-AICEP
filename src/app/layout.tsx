import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EcoIntel — Intelligence for the Circular Electronics Economy",
  description:
    "AI-powered platform for detecting, reconstructing and extending the lifecycle of electronic components through Computer Vision, Machine Learning and Digital Product Passports.",
  keywords: [
    "Circular Electronics",
    "AI Component Detection",
    "PCB Reconstruction",
    "Precious Metal Intelligence",
    "Blockchain Component Passport",
    "Polygon Network",
    "Deep Tech AI",
    "E-Waste Recycling",
  ],
  openGraph: {
    title: "EcoIntel — Intelligence for the Circular Electronics Economy",
    description:
      "AI-powered operating platform to detect, diagnose, and recover maximum value from electronic waste sustainably.",
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
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} scroll-smooth`}
    >
      <body className="bg-[#F8FAFC] text-[#0F172A] antialiased min-h-screen relative">
        {children}
      </body>
    </html>
  );
}
