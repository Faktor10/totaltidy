import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { TRPCProvider } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "TotalTidy",
  description: "Capture-first home inventory for busy parents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <TRPCProvider>
          {children}
          <BottomNav />
        </TRPCProvider>
      </body>
    </html>
  );
}
