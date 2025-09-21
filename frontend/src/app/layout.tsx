import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WabiSabi Lens - Tea Ceremony Tool Analyzer",
  description:
    "お道具にカメラをかざすだけで、AIが瞬時に名称・由来・季節の取り合わせを解説します。",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSerifJP.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Script
          id="hydration-fix"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // ブラウザ拡張機能による属性を一時的に除去
              if (typeof window !== 'undefined') {
                const extensionAttrs = ['cz-shortcut-listen', 'data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'];
                extensionAttrs.forEach(attr => {
                  if (document.body && document.body.hasAttribute(attr)) {
                    document.body.removeAttribute(attr);
                  }
                });
              }
            `,
          }}
        />
        <LanguageProvider>
          <AuthProvider>
            <ChatProvider>{children}</ChatProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
