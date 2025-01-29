"use client";

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
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          <Sidebar className="border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarContent>
              <div className="flex h-14 items-center border-b border-border/40 px-6">
                <h1 className="text-xl font-semibold tracking-tight">
                  VerifyAI
                </h1>
              </div>
              <SidebarMenu className="px-4 py-2">
                <SidebarMenuItem>
                  <Link href="/" passHref legacyBehavior>
                    <SidebarMenuButton
                      tooltip="Home"
                      className={`group flex w-full items-center gap-x-3 rounded-md px-3 py-2 text-base font-medium ${
                        pathname === "/"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <Home className="h-6 w-6 shrink-0 opacity-70 group-hover:opacity-100" />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/dashboard" passHref legacyBehavior>
                    <SidebarMenuButton
                      tooltip="Dashboard"
                      className={`group flex w-full items-center gap-x-3 rounded-md px-3 py-2 text-base font-medium ${
                        pathname === "/dashboard"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <LayoutDashboard className="h-6 w-6 shrink-0 opacity-70 group-hover:opacity-100" />
                      <span>Dashboard</span>
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
