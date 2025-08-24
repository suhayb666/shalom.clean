"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { IoIosPeople } from "react-icons/io";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { RiCalendarScheduleLine } from "react-icons/ri";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import LoginIcon from "@mui/icons-material/Login";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";

export default function SidebarWrapper() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  const iconClass = "text-2xl text-[#e2d1c3]";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setChecking(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/auth");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="hidden md:flex w-[250px] sidebar-gradient p-5 flex-shrink-0 shadow-lg fixed top-0 left-0 h-screen overflow-y-auto">
      <div className="flex flex-col h-full">
        <Link
          href="/dashboard"
          className="btn-grad-add w-full text-center block text-lg font-bold mb-2 text-sidebar-foreground"
        >
          Shalom App
        </Link>

        {user && (
          <p className="text-sm text-sidebar-foreground mb-4">
            Welcome, <span className="font-semibold">{user.name}</span>
          </p>
        )}

        {user?.role === "admin" && (
          <ul className="list-none p-0 space-y-2 mb-6">
            <li>
              <Link href="/employees" className="nav-link">
                <IoIosPeople className={iconClass} /> Employees
              </Link>
            </li>
            <li>
              <Link href="/shifts" className="nav-link">
                <AccessTimeIcon className={iconClass} /> Shifts
              </Link>
            </li>
            <li>
              <Link href="/schedules" className="nav-link">
                <RiCalendarScheduleLine className={iconClass} /> Schedules
              </Link>
            </li>
            <li>
              <Link href="/unavailabilities" className="nav-link">
                <EventBusyIcon className={iconClass} /> Unavailabilities
              </Link>
            </li>
          </ul>
        )}

        {!checking && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <ul className="list-none p-0 space-y-2">
              {!user ? (
                <li>
                  <Link href="/auth" className="nav-link">
                    <LoginIcon className={iconClass} /> Login / Sign Up
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href="/profile" className="nav-link">
                      <AccountCircleIcon className={iconClass} /> Profile
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="w-full text-left py-2 px-4 rounded transition-colors duration-200 hover:bg-red-600 flex items-center gap-2 disabled:opacity-50 text-sidebar-foreground"
                    >
                      <LogoutIcon className={iconClass} />
                      {loading ? "Logging out..." : "Logout"}
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-gray-700">
          <div className="flex space-x-1 mb-2">
            <div className="w-4 h-4 bg-[#ec6602] rounded"></div>
            <div className="w-4 h-4 bg-[#009999] rounded"></div>
            <div className="w-4 h-4 bg-[#7a162d] rounded"></div>
            <div className="w-4 h-4 bg-[#009a38] rounded"></div>
          </div>
          <p className="text-xs text-sidebar-foreground">Employee Scheduling System</p>
        </div>
      </div>
    </aside>
  );
}