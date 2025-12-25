"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  IconDashboard,
  IconBook,
  IconUsers,
  IconFileText,
  IconClipboardList,
  IconWriting,
  IconReportAnalytics,
  IconVideo,
  IconMessage,
  IconSettings,
  IconLogout,
  IconDotsVertical,
  IconUserCircle,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";

// Menu items grouped by category
const menuGroups = [
  {
    label: "Main",
    items: [
      { icon: IconDashboard, label: "Dashboard", path: "/tutor/dashboard" },
    ],
  },
  {
    label: "Teaching",
    items: [
      { icon: IconBook, label: "My Sections", path: "/tutor/sections" },
      { icon: IconUsers, label: "Students", path: "/tutor/students" },
      { icon: IconFileText, label: "Materials", path: "/tutor/materials" },
    ],
  },
  {
    label: "Assessment",
    items: [
      {
        icon: IconClipboardList,
        label: "Assignments",
        path: "/tutor/assignments",
      },
      { icon: IconWriting, label: "Quizzes", path: "/tutor/quizzes" },
      { icon: IconReportAnalytics, label: "Grading", path: "/tutor/grading" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: IconVideo, label: "Live Classes", path: "/tutor/liveClasses" },
      { icon: IconMessage, label: "Forum", path: "/tutor/forum" },
    ],
  },
  // {
  //   label: "Settings",
  //   items: [{ icon: IconSettings, label: "Settings", path: "/tutor/settings" }],
  // },
];

export function TutorSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  // User state - fetch from session
  const [user, setUser] = useState({
    name: "Loading...",
    email: "",
    avatar: "",
  });

  // Fetch real user data from Supabase session
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser({
          name:
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "Tutor",
          email: authUser.email || "",
          avatar: authUser.user_metadata?.avatar_url || "",
        });
      }
    };
    fetchUser();
  }, []);

  // Generate initials from name
  const getInitials = (name: string) => {
    if (!name || name === "Loading...") return "...";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Header with Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link
                href="/tutor/dashboard"
                className="flex items-center gap-3"
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <div className="relative w-8 h-8 shrink-0">
                  <Image
                    src="/images/logo-tutor.svg"
                    alt="Tutor Nomor Satu"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-blue-900">
                    Tutor
                  </span>
                  <span className="text-xs text-blue-600 font-medium -mt-1">
                    Nomor Satu
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content - Menu Groups */}
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.path ||
                    pathname.startsWith(item.path + "/");
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link
                          href={item.path}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer - User Menu */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                  <IconDotsVertical className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/tutor/profile"
                      className="cursor-pointer"
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <IconUserCircle className="mr-2 h-4 w-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 cursor-pointer"
                >
                  <IconLogout className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
