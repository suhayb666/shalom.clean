import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";

// Icons
import { IoIosPeople } from "react-icons/io";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { RiCalendarScheduleLine } from "react-icons/ri";
import EventBusyIcon from '@mui/icons-material/EventBusy';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shalom App",
  description: "Employee Scheduling System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const iconClass = "text-3xl text-[#e2d1c3]";

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} min-h-screen app-gradient`}>
        <ServiceWorkerRegister />

        {/* Sidebar */}
        <aside className="sidebar w-[250px] sidebar-gradient text-white p-5 flex-shrink-0 shadow-lg fixed top-0 left-0 h-screen overflow-y-auto">
          
          {/* Shalom App Home Button */}
          <Link 
            href="/dashboard" 
            className="btn-grad-add w-full text-center block text-lg font-bold mb-4"
          >
            Shalom App
          </Link>

          <ul className="list-none p-0 space-y-2">
            <li>
              <Link
                href="/employees"
                className="block py-2 px-4 rounded transition-colors duration-200 hover:bg-gray-700 flex items-center gap-2"
              >
                <IoIosPeople className={iconClass} />
                Employees
              </Link>
            </li>
            <li>
              <Link
                href="/shifts"
                className="block py-2 px-4 rounded transition-colors duration-200 hover:bg-gray-700 flex items-center gap-2"
              >
                <AccessTimeIcon className={iconClass} />
                Shifts
              </Link>
            </li>
            <li>
              <Link
                href="/schedules"
                className="block py-2 px-4 rounded transition-colors duration-200 hover:bg-gray-700 flex items-center gap-2"
              >
                <RiCalendarScheduleLine className={iconClass} />
                Schedules
              </Link>
            </li>
            <li>
              <Link
                href="/unavailabilities"
                className="block py-2 px-4 rounded transition-colors duration-200 hover:bg-gray-700 flex items-center gap-2"
              >
                <EventBusyIcon className={iconClass} />
                Unavailabilities
              </Link>
            </li>
          </ul>

          {/* Sidebar Footer */}
          <div className="mt-auto pt-6 border-t border-gray-700">
            <div className="flex space-x-1 mb-2">
              <div className="w-4 h-4 bg-[#ec6602] rounded"></div>
              <div className="w-4 h-4 bg-[#009999] rounded"></div>
              <div className="w-4 h-4 bg-[#7a162d] rounded"></div>
              <div className="w-4 h-4 bg-[#009a38] rounded"></div>
            </div>
            <p className="text-xs text-gray-400">Employee Scheduling System</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-[250px] p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
