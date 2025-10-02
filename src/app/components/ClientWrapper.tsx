"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import SidebarWrapper from "@/components/SidebarWrapper";
import dynamic from "next/dynamic";

const ServiceWorkerRegister = dynamic(() => import("@/components/ServiceWorkerRegister"), { ssr: false });

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Auth pages → simple centered layout
  if (pathname.startsWith("/auth")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ServiceWorkerRegister />
        {children}
      </div>
    );
  }

  const handleSheetClose = () => {
    setIsSheetOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ServiceWorkerRegister />

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-[250px] bg-[#12355B]">
        <SidebarWrapper />
      </div>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#12355B] text-white flex items-center px-4 z-50">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <button aria-label="Open Menu">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="p-0 w-[280px] max-w-[80vw] border-0 bg-white shadow-2xl"
            
          >
            <SidebarWrapper 
              isMobile={true} 
              onNavigate={handleSheetClose} 
            />
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-bold">Shalom App</span>
      </div>

      {/* Page Content */}
      <div className="flex-1 flex flex-col md:ml-[250px]">
        <main className="flex-1 p-6 pt-20 md:pt-6">{children}</main>
      </div>
    </div>
  );
}