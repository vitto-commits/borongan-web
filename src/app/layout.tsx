import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Borongan Citizen Portal",
  description: "Official citizen services portal — Borongan City, Eastern Samar",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Borongan",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#F5F7FA] min-h-screen">
        {children}
      </body>
    </html>
  );
}
