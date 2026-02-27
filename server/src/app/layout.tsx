import type { Metadata } from "next";
import { Noto_Sans_Lao, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/query-provider";

const notoLao = Noto_Sans_Lao({
    variable: "--font-noto-lao",
    subsets: ["lao"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "IT Monitor - College Network",
    description: "IT monitoring system for college computers",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${notoLao.variable} ${geistMono.variable} antialiased`}
            >
                <SessionProvider>
                    <QueryProvider>
                        <AppShell>{children}</AppShell>
                        <Toaster
                            position="top-right"
                            theme="dark"
                            richColors
                            closeButton
                        />
                    </QueryProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
