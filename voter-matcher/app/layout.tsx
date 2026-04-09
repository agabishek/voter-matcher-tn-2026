import type { Metadata } from "next";
import { Inter, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { ConfigProvider } from "@/lib/configProvider";
import { LanguageProvider } from "@/lib/languageProvider";
import { ConfigLoader } from "@/lib/configLoader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-noto-sans-tamil",
  subsets: ["tamil"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "உங்கள் அரசியல் பொருத்தம் | Voter Matcher – TN 2026",
  description: "Find which party aligns with your policy preferences",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#0f0f13',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Voter Matcher',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loader = new ConfigLoader();
  const config = loader.load();

  return (
    <html
      lang="ta"
      className={`${inter.variable} ${notoSansTamil.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <ConfigProvider config={config}>
          <LanguageProvider>{children}</LanguageProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
