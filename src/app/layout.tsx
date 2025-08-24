import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import ClientWrapper from "./components/ClientWrapper"; // ✅ client wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shalom App",
  description: "Employee Scheduling System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} min-h-screen app-gradient`}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
