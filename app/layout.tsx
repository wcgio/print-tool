import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "图片转换A4、A3、A5",
  description: "将图片转换为A4、A3、A5纸张大小的PDF文件",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
