import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile header with menu button */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold">AI People Counting</span>
      </div>

      {/* Main content */}
      <main className={cn(
        "transition-all duration-300",
        "md:pl-64", // Desktop: sidebar offset
        "pt-14 md:pt-0" // Mobile: header offset
      )}>
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
