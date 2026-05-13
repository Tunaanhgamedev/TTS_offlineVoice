import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "VietVoiceAI | Nền tảng AI Voice Offline chuyên nghiệp",
  description: "Chuyển văn bản thành giọng nói tiếng Việt tự nhiên, không giới hạn credit, chạy offline hoàn toàn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${outfit.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
