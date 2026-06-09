import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskFlow — Secure Task Management",
  description: "Collaborative task management with secure authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased bg-slate-50 text-slate-900`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
