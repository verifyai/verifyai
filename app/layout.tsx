import type { Metadata } from 'next';
import './globals.css';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Home, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VerifyAI - Website Verification',
  description: 'AI-powered website verification and analysis',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
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
                      <span>Home</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/dashboard" passHref legacyBehavior>
                    <SidebarMenuButton tooltip="Dashboard">
                      <LayoutDashboard className="h-10 w-10" />
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
