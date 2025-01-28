import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Home, LayoutDashboard } from "lucide-react";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VerifyAI - Website Verification",
  description: "AI-powered website verification and analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <div className="p-4">
                <h1 className="text-xl font-bold">VerifyAI</h1>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/" passHref legacyBehavior>
                    <SidebarMenuButton tooltip="Home">
                      <Home className="h-10 w-10" />
                      <span className="text-xl">Home</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/dashboard" passHref legacyBehavior>
                    <SidebarMenuButton tooltip="Dashboard">
                      <LayoutDashboard className="h-10 w-10" />
                      <span className="text-xl">Dashboard</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
