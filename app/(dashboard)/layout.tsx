import type { Metadata } from "next";
import { Geist, Geist_Mono,  } from "next/font/google";
import "../globals.css";

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  
} from '@clerk/nextjs';
import LeftSideBar from "@/components/layout/LeftSideBar";
import TopBar from "@/components/layout/TopBar";
import { ToasterProvider } from "@/lib/ToasterProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Borcelle - Admin Dashboard",
  description: "Admin dashboard to manage Borcelle's data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ToasterProvider />
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            
          <div className="lg:hidden">
    <TopBar />
  </div>

  <div className="flex">
    {/* Show sidebar only on large screens */}
    <div className="hidden lg:block">
      <LeftSideBar />
    </div>

    {/* Main content area */}
    <main className="flex-1">{children}</main>
  </div>
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
