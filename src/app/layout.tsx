import type { Metadata } from "next";
import { TRPCProvider } from "./providers";
import "./globals.css";

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
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
