import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carsa Complaints Assistant",
  description: "AI-powered complaints handling for Carsa customers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
