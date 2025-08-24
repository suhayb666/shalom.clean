"use client";

import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import SidebarWrapper from "./SidebarWrapper";
import ServiceWorkerRegister from "./ServiceWorkerRegister";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        {children}
      </main>
    );
  }

  return (
    <>
      <ServiceWorkerRegister />

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <SidebarWrapper />
        </div>

        <div className="flex-1 flex flex-col" style={{ marginLeft: "250px" }}>
          {/* Mobile header */}
          <div className="md:hidden">
            <header className="flex justify-between items-center bg-white border-b px-4 py-3 shadow-sm">
              <span className="font-bold text-indigo-600">Shalom App</span>
              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2">
                    <Menu className="h-6 w-6 text-gray-700" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-4">
                  <div className="font-medium text-gray-700 mb-4">Menu</div>
                  <Link href="/dashboard" className="block py-2">
                    Dashboard
                  </Link>
                  <Link href="/profile" className="block py-2">
                    Profile
                  </Link>
                  <Link href="/logout" className="block py-2">
                    Logout
                  </Link>
                </SheetContent>
              </Sheet>
            </header>
          </div>

          {/* Main content (children only rendered once) */}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </>
  );
}