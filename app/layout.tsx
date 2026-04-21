'use client';

import { SessionProvider } from "next-auth/react";
import "./globals.css";

import Navbar from "@/components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="font-sans transition-colors duration-300">
      <body className="bg-[#F8F9FA] dark:bg-gray-900">
        <SessionProvider>
          <Navbar />
          <main className="pt-20">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}

