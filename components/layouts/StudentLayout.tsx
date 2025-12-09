"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Home,
  BookOpen,
  FileText,
  ClipboardList,
  CheckSquare,
  Video,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import NotificationCenter from "@/components/features/notifications/NotificationCenter";

interface StudentLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Home, label: "Dashboard", href: "/student/dashboard" },
  { icon: BookOpen, label: "Kelas Saya", href: "/student/classes" },
  { icon: FileText, label: "Materi", href: "/student/materials" },
  { icon: ClipboardList, label: "Tugas", href: "/student/assignments" },
  { icon: CheckSquare, label: "Kuis", href: "/student/quizzes" },
  { icon: Video, label: "Jadwal Live Class", href: "/student/liveClasses" },
  { icon: BarChart3, label: "Rapor/Nilai", href: "/student/grades" },
  { icon: Settings, label: "Pengaturan", href: "/student/settings" },
];

export const StudentLayout = ({ children }: StudentLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          <Link
            href="/student/dashboard"
            className="flex items-center gap-3 group"
          >
            <div className="relative w-10 h-10">
              <Image
                src="/images/logo-tutor.svg"
                alt="Tutor Nomor Satu"
                width={40}
                height={40}
                className="transition-transform group-hover:scale-110"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-900">Tutor</h1>
              <p className="text-xs text-blue-600 font-medium">Nomor Satu</p>
            </div>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kelas, materi, atau tugas..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Right side - Notification & User */}
          <div className="flex items-center gap-2">
            <NotificationCenter />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      JD
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-muted-foreground">
                      john.doe@email.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/student/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Pengaturan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)]
            w-64 border-r bg-white transition-transform duration-300
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
        >
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background py-6 px-4 lg:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; 2024 Tutor Nomor Satu. All rights reserved.</p>
          <div className="flex gap-4">
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Syarat & Ketentuan
            </Link>
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Kebijakan Privasi
            </Link>
            <Link href="/help" className="hover:text-primary transition-colors">
              Bantuan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
