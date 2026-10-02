"use client";

import { useAuth } from "../../lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Building2, 
  FileText, 
  Calendar, 
  Settings, 
  LogOut,
  Menu,
  FolderKanban,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = () => {
    if (user) {
      fetchApi('/notifications/unread-count')
        .then((res: any) => setUnreadCount(res.count))
        .catch(console.error);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else {
      fetchUnreadCount();
      // Polling could be added here if needed, but for now we fetch on mount
    }
  }, [user, isLoading, router, pathname]); // Re-fetch when pathname changes (e.g. visiting notifications page)

  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const getNavigation = () => {
    const baseNav = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    ];

    if (user.systemRole !== "ADMIN" && user.systemRole !== "CEO") {
      baseNav.push({ name: "My Tasks", href: "/dashboard/tasks", icon: CheckSquare });
    } else {
      baseNav.push({ name: "All Tasks", href: "/dashboard/tasks", icon: CheckSquare });
    }

    baseNav.push({ name: "Reports", href: "/dashboard/reports", icon: FileText });

    if (["MANAGER", "DIRECTOR", "CEO"].includes(user.systemRole)) {
      baseNav.splice(baseNav.findIndex(n => n.name === "Reports"), 0, { name: "Team Tasks", href: "/dashboard/team", icon: Users });
    }

    if (["DIRECTOR", "CEO"].includes(user.systemRole)) {
      baseNav.splice(3, 0, { name: "Directorate", href: "/dashboard/directorate", icon: Building2 });
    }

    if (user.systemRole === "ADMIN") {
      baseNav.push({ name: "Organization", href: "/dashboard/organization", icon: Settings });
    }

    return baseNav;
  };

  const navigation = getNavigation();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <div className="hidden w-64 overflow-y-auto border-r bg-white md:block">
        <div className="flex h-16 items-center px-6 border-b">
          <img src="/logo.png" alt="Nisir Logo" className="h-8 object-contain mr-3" />
          <span className="text-lg font-bold text-slate-800">Nisir Tasker</span>
        </div>
        <div className="p-4">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-500">{user.systemRole}</p>
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-500"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
            
            <button
              onClick={logout}
              className="flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
              Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-8">
          <div className="flex items-center md:hidden">
            <img src="/logo.png" alt="Nisir Logo" className="h-6 object-contain mr-2" />
            <span className="text-lg font-bold text-slate-800">Nisir Tasker</span>
          </div>
          <div className="hidden md:block text-sm text-slate-500 font-medium">
            {/* Can display breadcrumbs or page title here in future */}
          </div>
          
          <div className="flex items-center space-x-4 ml-auto">
            <Link href="/dashboard/notifications" className="relative p-2 text-slate-400 hover:text-slate-500">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
