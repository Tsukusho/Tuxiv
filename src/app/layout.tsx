// /src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tuxiv",
  description: "An image posting application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const isLoggedIn = !!token; // トークンがあればtrue

  return (
    <html lang="en">
      <body className={inter.className}>
        <Header isLoggedIn={isLoggedIn} />
        {children}
      </body>
    </html>
  );
}