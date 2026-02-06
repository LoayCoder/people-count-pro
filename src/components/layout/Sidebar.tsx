import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Camera,
  Settings2,
  MonitorPlay,
  FileVideo,
  Bell,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Cameras", href: "/cameras", icon: Camera },
  { name: "Configurator", href: "/configurator", icon: Settings2 },
  { name: "Live Monitoring", href: "/live", icon: MonitorPlay },
  { name: "Recorded Analysis", href: "/recorded", icon: FileVideo },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Reports", href: "/reports", icon: FileText },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

const roleColors: Record<string, string> = {
  admin: "bg-destructive/20 text-destructive",
  operator: "bg-primary/20 text-primary",
  viewer: "bg-muted text-muted-foreground",
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile, role, signOut } = useAuth();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Users className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">AI People</span>
            <span className="text-xs text-muted-foreground">Counting System</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          const link = (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 h-6 w-1 rounded-r-full bg-primary" />
              )}
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.name} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Bottom navigation */}
      <div className="border-t border-sidebar-border p-3">
        {bottomNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          const link = (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.name} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}

        {/* User profile section */}
        {profile && (
          <>
            <Separator className="my-3" />
            <div className={cn("flex items-center gap-3 px-3", collapsed && "justify-center")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <Users className="h-4 w-4 text-primary" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profile.full_name || "User"}
                  </p>
                  {role && (
                    <Badge variant="outline" className={cn("text-xs", roleColors[role])}>
                      {role}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Logout button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className={cn(
            "mt-2 w-full text-sidebar-foreground hover:text-destructive",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="mt-2 w-full justify-center text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
