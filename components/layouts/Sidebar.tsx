"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  FileText,
  CheckSquare,
  Video,
  BarChart,
  Users,
  CreditCard,
  Settings,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: any;
  label: string;
  href: string;
}

const studentNav: NavItem[] = [
  { icon: Home, label: "Dashboard", href: "/student/dashboard" },
  { icon: BookOpen, label: "Kelas Saya", href: "/student/sections" },
  { icon: TrendingUp, label: "Progress Saya", href: "/student/progress" },
];

const tutorNav: NavItem[] = [
  { icon: Home, label: "Dashboard", href: "/tutor/dashboard" },
  { icon: BookOpen, label: "Kelas Saya", href: "/tutor/sections" },
];

const adminNav: NavItem[] = [
  { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Users, label: "Kelola User", href: "/admin/users" },
  { icon: BookOpen, label: "Kelola Kelas", href: "/admin/classes" },
  { icon: CreditCard, label: "Pembayaran", href: "/admin/payments" },
  { icon: BarChart, label: "Laporan", href: "/admin/reports" },
  { icon: Settings, label: "Pengaturan", href: "/admin/settings" },
];

interface SidebarProps {
  role: "admin" | "tutor" | "student";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navItems =
    role === "student" ? studentNav : role === "tutor" ? tutorNav : adminNav;

  return (
    <aside className="w-64 bg-linear-to-b from-blue-50 to-white border-r border-blue-100 min-h-screen flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-blue-100">
        <Link
          href={`/${role}/dashboard`}
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Check if current pathname starts with the href (for nested routes)
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 font-semibold"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue-100">
        <div className="text-xs text-center text-gray-500">
          <p className="font-medium">© 2025 Tutor Nomor Satu</p>
          <p className="text-gray-400">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
