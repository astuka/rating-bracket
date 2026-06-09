import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rating Bracket",
  description: "Rate your games by picking favorites in head-to-head matchups.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
