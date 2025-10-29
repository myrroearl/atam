import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/providers/session-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Learnify",
  description: "Transform education with our AI-enhanced Academic Management System. Features real-time grade tracking, predictive analytics, leaderboards, and Google Classroom integration.",
  keywords: "academic management, education, AI, grade tracking, student performance, analytics",
  authors: [{ name: "Academic Management System Team" }],
  robots: "index, follow",
  openGraph: {
    title: "Academic Management System - AI-Enhanced Education Platform",
    description: "Transform education with our AI-enhanced Academic Management System. Features real-time grade tracking, predictive analytics, leaderboards, and Google Classroom integration.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Academic Management System - AI-Enhanced Education Platform",
    description: "Transform education with our AI-enhanced Academic Management System. Features real-time grade tracking, predictive analytics, leaderboards, and Google Classroom integration.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}