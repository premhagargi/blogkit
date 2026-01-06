"use client";

import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { SiteHeader } from "@/components/layout/header";
import { MainSidebar } from "@/modules/workspace/layouts/main-sidebar";
import { workspaceSidebarData } from "@/modules/workspace/data/sidebar-content";
import { pageManagementSidebarData } from "@/modules/blogs/data/sidebar-content";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const workspaceSlug = pathname.split("/")[1];

  const isPageRoute =
    pathname.includes("/pages/") || pathname.includes("/blogs/");

  const sidebarSections = (
    isPageRoute ? pageManagementSidebarData : workspaceSidebarData
  ).map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      url: item.url.startsWith("/settings")
        ? `/${workspaceSlug}${item.url}`
        : item.url,
    })),
  }));

  return (
    <div className="flex h-screen flex-col">
      <SiteHeader />
      <SidebarProvider className="flex flex-1 min-h-0">
        <MainSidebar sections={sidebarSections} />
        <SidebarInset className="flex-1 overflow-y-auto">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
