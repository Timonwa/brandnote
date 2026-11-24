import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
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
  title: "Brandnote",
  description: "Your brand profile, voice and customers, set up from your website.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider>
          <header className="border-b border-stone-200 bg-white">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Brandnote
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                {/* Show reads the session, so it streams in behind a boundary (Cache Components). */}
                <Suspense>
                  <Show when="signed-out">
                    <Link href="/sign-in" className="text-stone-600 hover:text-stone-900">
                      Sign in
                    </Link>
                    <Link
                      href="/sign-up"
                      className="rounded-full bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700"
                    >
                      Get started
                    </Link>
                  </Show>
                  <Show when="signed-in">
                    <Link href="/workspace" className="text-stone-600 hover:text-stone-900">
                      Workspace
                    </Link>
                    <UserButton />
                  </Show>
                </Suspense>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}
