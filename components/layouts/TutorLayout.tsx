"use client";

import { TutorSidebar } from "@/components/tutor-sidebar";
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
import NotificationCenter from "@/components/features/notifications/NotificationCenter";

// Map paths to page titles
const pageTitles: Record<string, string> = {
  "/tutor/dashboard": "Dashboard",
  "/tutor/sections": "My Sections",
  "/tutor/students": "Students",
  "/tutor/materials": "Materials",
  "/tutor/assignments": "Assignments",
  "/tutor/quizzes": "Quizzes",
  "/tutor/grading": "Grading",
  "/tutor/liveClasses": "Live Classes",
  "/tutor/forum": "Forum",
  "/tutor/settings": "Settings",
  "/tutor/profile": "Profile Settings",
};

interface TutorLayoutProps {
  children: React.ReactNode;
}

export function TutorLayout({ children }: TutorLayoutProps) {
  const pathname = usePathname();

  // Get page title from path
  const getPageTitle = () => {
    // Check exact match first
    if (pageTitles[pathname]) return pageTitles[pathname];
    // Check if any key starts with current path
    const matchedPath = Object.keys(pageTitles).find((path) =>
      pathname.startsWith(path)
    );
    return matchedPath ? pageTitles[matchedPath] : "Tutor Panel";
  };

  return (
    <SidebarProvider>
      <TutorSidebar />
      <SidebarInset>
        {/* Header with sidebar trigger, breadcrumb, and notifications */}
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

          {/* Spacer to push notifications to the right */}
          <div className="flex-1" />

          {/* Notification Bell */}
          <NotificationCenter />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>

        {/* Footer */}
        <footer className="border-t py-4 px-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 Tutor Nomor Satu. Tutor Panel - All rights reserved.
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
