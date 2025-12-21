"use client";

import { StudentSidebar } from "@/components/student-sidebar";
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
  "/student/dashboard": "Dashboard",
  "/student/sections": "Kelas Saya",
  "/student/programs": "Cari Program",
  "/student/materials": "Materi",
  "/student/assignments": "Tugas",
  "/student/quizzes": "Kuis",
  "/student/liveClasses": "Live Class",
  "/student/grades": "Rapor/Nilai",
  "/student/settings": "Pengaturan",
  "/student/profile": "Profil Saya",
  "/student/payments": "Riwayat Pembayaran",
  "/student/payment": "Pembayaran",
  "/student/invoice": "Invoice",
};

interface StudentLayoutProps {
  children: React.ReactNode;
}

export const StudentLayout = ({ children }: StudentLayoutProps) => {
  const pathname = usePathname();

  // Get page title from path
  const getPageTitle = () => {
    // Check exact match first
    if (pageTitles[pathname]) return pageTitles[pathname];
    // Check if any key starts with current path
    const matchedPath = Object.keys(pageTitles).find((path) =>
      pathname.startsWith(path)
    );
    return matchedPath ? pageTitles[matchedPath] : "Student Portal";
  };

  return (
    <SidebarProvider>
      <StudentSidebar />
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
            © 2022-{new Date().getFullYear()} Tutor Nomor Satu. Student Portal -
            All rights reserved.
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
};
