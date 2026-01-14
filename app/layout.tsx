import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEREO",
  description: "Brutalist Void Calendar for ADHD Night-Owl Entrepreneurs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>{children}</Providers>
        <span
          className="fixed bottom-4 right-4 font-mono font-light text-xs"
          style={{ color: '#525252' }}
        >
          v0.5.0
        </span>
      </body>
    </html>
  );
}
