import type { Metadata } from "next";
import "./globals.css";
import HomeHeader from "@/components/home/HomeHeader";
import HomeFooter from "@/components/home/HomeFooter";

export const metadata: Metadata = {
  title: "Lost Vehicle Registry Ghana",
  description: "Search, report, and recover vehicles in Ghana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <HomeHeader />
        {children}
        <HomeFooter />
      </body>
    </html>
  );
}