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
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'; // Icon for My Requests

interface SidebarWrapperProps {
  isMobile?: boolean;
  onNavigate?: () => void; // Callback to close mobile sheet
}

export default function SidebarWrapper({ isMobile = false, onNavigate }: SidebarWrapperProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  const iconClass = isMobile ? "text-2xl text-gray-600" : "text-2xl text-[#e2d1c3]";

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
      onNavigate?.(); // Close mobile sheet if provided
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = () => {
    onNavigate?.(); // Close mobile sheet when navigating
  };

  // Mobile version (for use inside Sheet)
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-white p-5 min-h-screen">
        {/* App Title */}
        <Link
          href="/dashboard"
          onClick={handleLinkClick}
          className="text-center block text-xl font-bold mb-4 text-gray-900 hover:text-blue-600 transition-colors"
        >
          Shalom App
        </Link>

        {/* User Greeting */}
        {user && (
          <p className="text-sm text-gray-600 mb-6">
            Welcome, <span className="font-semibold">{user.name}</span>
          </p>
        )}

        {/* Navigation Items */}
        <div className="flex-1">
          {user?.role === "admin" && (
            <ul className="list-none p-0 space-y-2 mb-6">
              <li>
                <Link href="/employees" onClick={handleLinkClick} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 text-gray-800 font-medium transition-all duration-200">
                  <IoIosPeople className={iconClass} /> Employees
                </Link>
              </li>
              <li>
                <Link href="/shifts" onClick={handleLinkClick} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 text-gray-800 font-medium transition-all duration-200">
                  <AccessTimeIcon className={iconClass} /> Shifts
                </Link>
              </li>
              <li>
                <Link href="/schedules" onClick={handleLinkClick} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 text-gray-800 font-medium transition-all duration-200">
                  <RiCalendarScheduleLine className={iconClass} /> Schedules
                </Link>
              </li>
              <li>
                <Link href="/unavailabilities" onClick={handleLinkClick} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 text-gray-800 font-medium transition-all duration-200">
                  <EventBusyIcon className={iconClass} /> Unavailabilities
                </Link>
              </li>
            </ul>
          )}

          {!checking && user && (
            <ul className="list-none p-0 space-y-2 mb-6">
              <li>
                <Link href="/all-requests" onClick={handleLinkClick} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 text-gray-800 font-medium transition-all duration-200">
                  <PlaylistAddCheckIcon className={iconClass} /> Requests
                </Link>
              </li>
            </ul>
          )}

          {!checking && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <ul className="list-none p-0 space-y-2">
                {!user ? (
                  <li>
                    <Link href="/auth" onClick={handleLinkClick} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 text-gray-800 font-medium transition-all duration-200">
                      <LoginIcon className={iconClass} /> Login / Sign Up
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link href="/profile" onClick={handleLinkClick} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 text-gray-800 font-medium transition-all duration-200">
                        <AccountCircleIcon className={iconClass} /> Profile
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full text-left py-3 px-4 rounded transition-colors duration-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 disabled:opacity-50 text-gray-700"
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
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-gray-200">
          <div className="flex space-x-1 mb-2">
            <div className="w-4 h-4 bg-[#ec6602] rounded"></div>
            <div className="w-4 h-4 bg-[#009999] rounded"></div>
            <div className="w-4 h-4 bg-[#7a162d] rounded"></div>
            <div className="w-4 h-4 bg-[#009a38] rounded"></div>
          </div>
          <p className="text-xs text-gray-600">
            Employee Scheduling System
          </p>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <aside className="flex w-full sidebar-gradient p-5 flex-shrink-0 shadow-lg h-full overflow-y-auto">
      <div className="flex flex-col h-full w-full">
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

        {/* Navigation Items */}
        <div className="flex-1">
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

          {!checking && user && (
            <ul className="list-none p-0 space-y-2 mb-6">
              <li>
                <Link href="/all-requests" className="nav-link">
                  <PlaylistAddCheckIcon className={iconClass} /> Requests
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
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-gray-700">
          <div className="flex space-x-1 mb-2">
            <div className="w-4 h-4 bg-[#ec6602] rounded"></div>
            <div className="w-4 h-4 bg-[#009999] rounded"></div>
            <div className="w-4 h-4 bg-[#7a162d] rounded"></div>
            <div className="w-4 h-4 bg-[#009a38] rounded"></div>
          </div>
          <p className="text-xs text-sidebar-foreground">
            Employee Scheduling System
          </p>
        </div>
      </div>
    </aside>
  );
}