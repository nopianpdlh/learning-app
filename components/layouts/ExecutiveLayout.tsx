"use client";

import { ExecutiveSidebar } from "@/components/executive-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

// Map paths to page titles
const pageTitles: Record<string, string> = {
  "/executive/dashboard": "Analytics Dashboard",
  "/executive/reports": "Laporan",
};

export default function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Get page title from path
  const getPageTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    const matchedPath = Object.keys(pageTitles).find((path) =>
      pathname.startsWith(path)
    );
    return matchedPath ? pageTitles[matchedPath] : "Executive Dashboard";
  };

  return (
    <SidebarProvider>
      <ExecutiveSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
