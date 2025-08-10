"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function DashboardPage() {
  // Demo numbers – in real app fetch from API
  const totalEmployees = 42;
  const totalShiftsThisWeek = 118;
  const fillRatePct = 92;
  const unavailCount = 7;

  // Schedules → FullCalendar events
  type ApiSchedule = {
    id: number;
    employee_name: string;
    store_name: string;
    shift_name: string;
    start_time: string; // HH:MM:SS
    end_time: string;   // HH:MM:SS
    schedule_date: string; // YYYY-MM-DD
  };

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchedules() {
      try {
        setLoadingEvents(true);
        const res = await fetch("/api/schedules");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load schedules");
        }
        const data: ApiSchedule[] = await res.json();

        // Helpers to normalize dates/times coming from API
        const toDateISO = (sd: string): string => {
          const raw = String(sd);
          if (raw.includes("T")) return raw.slice(0, 10);
          const parts = raw.split("-");
          // MM-DD-YYYY → YYYY-MM-DD
          if (parts.length === 3 && parts[2].length === 4) {
            const [mm, dd, yyyy] = parts;
            return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
          }
          // Assume already YYYY-MM-DD
          return raw;
        };
        const toHHMMSS = (t: string): string => (t?.length >= 8 ? t.slice(0, 8) : `${t.slice(0, 5)}:00`);
        const toMinutes = (t: string): number => {
          const [hh, mm] = t.slice(0, 5).split(":").map((n) => parseInt(n, 10));
          return hh * 60 + mm;
        };
        const addDays = (isoDate: string, days: number): string => {
          const d = new Date(isoDate);
          d.setDate(d.getDate() + days);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        };
        const toAp = (t: string): string => {
          const [hhStr, mmStr] = t.slice(0, 5).split(":");
          let hh = parseInt(hhStr, 10);
          const mm = parseInt(mmStr, 10);
          const suffix = hh >= 12 ? "p" : "a";
          hh = hh % 12;
          if (hh === 0) hh = 12;
          const mmPart = mm === 0 ? "" : `:${mmStr}`;
          return `${hh}${mmPart}${suffix}`;
        };
        const buildTitle = (s: ApiSchedule, startTime: string, endTime: string): string => {
          const shift = (s.shift_name || "").toLowerCase();
          const st = toMinutes(startTime);
          const et = toMinutes(endTime);
          if (shift.startsWith("morning")) {
            return `Morning: ${toAp(startTime)}-${toAp(endTime)} | ${s.employee_name}`;
          }
          if (shift.startsWith("evening")) {
            return `Evening: ${toAp(startTime)}-${toAp(endTime)} | ${s.employee_name}`;
          }
          if (shift.startsWith("open")) {
            return `Open: ${toAp(startTime)}-${toAp(endTime)} | ${s.employee_name}`;
          }
          // Fallback
          return `${s.shift_name}: ${toAp(startTime)}-${toAp(endTime)} | ${s.employee_name}`;
        };

        // Count schedules per day
        const dayCounts = data.reduce<Record<string, number>>((acc, s) => {
          const d = toDateISO(s.schedule_date);
          acc[d] = (acc[d] || 0) + 1;
          return acc;
        }, {});

        // Theme colors
        const morningColor = "#ec6602"; // orange
        const eveningColor = "#009999"; // teal
        const defaultColor = "#8b5cf6"; // violet

        const events = data.map((s) => {
          const d = toDateISO(s.schedule_date);
          const startTime = toHHMMSS(s.start_time);
          const endTime = toHHMMSS(s.end_time);
          const startHHMM = startTime.substring(0, 5);
          const endHHMM = endTime.substring(0, 5);
          const title = buildTitle(s, startTime, endTime);
          // Color by shift name (morning/orange, evening/teal), fallback default
          const lower = (s.shift_name || "").toLowerCase();
          const color = lower.startsWith("morning") ? morningColor : lower.startsWith("evening") ? eveningColor : defaultColor;
          // Cross-midnight handling
          const startM = toMinutes(startTime);
          const endM = toMinutes(endTime);
          // Force the calendar to treat the start/end as pure local date-times without TZ shifts
          // by passing strings as-is (FullCalendar interprets them in local time).
          const endDate = endM <= startM ? addDays(d, 1) : d;
          return {
            id: String(s.id),
            title,
            start: `${d}T${startTime}`,
            end: `${endDate}T${endTime}`,
            backgroundColor: color,
            borderColor: color,
            display: "block" as const,
          };
        });

        setCalendarEvents(events);
        if (data.length > 0) {
          // Navigate calendar to the month of the earliest schedule so users see data immediately
          const minDate = data
            .map((s) => toDateISO(s.schedule_date))
            .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))[0];
          setInitialDate(minDate);
        }
        setEventsError(null);
      } catch (err) {
        const e = err as Error;
        setEventsError(e.message || "Unknown error");
      } finally {
        setLoadingEvents(false);
      }
    }
    loadSchedules();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Top: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={totalEmployees.toString()} color="from-indigo-500 to-purple-500" />
        <StatCard title="Shifts This Week" value={totalShiftsThisWeek.toString()} color="from-emerald-500 to-teal-500" />
        <StatCard title="Fill Rate" value={`${fillRatePct}%`} color="from-orange-500 to-amber-500" />
        <StatCard title="Unavailabilities" value={unavailCount.toString()} color="from-rose-500 to-pink-500" />
      </div>

      {/* Calendar Section */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-3 text-black">Calendar</h3>
        <div className="min-h-[640px]">
          {eventsError ? (
            <div className="text-red-600">{eventsError}</div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={initialDate}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height={640}
              selectable
              editable={false}
              events={calendarEvents}
              eventDisplay="block"
              timeZone="local"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl shadow p-4 text-white bg-gradient-to-r ${color}`}>
      <div className="text-sm opacity-90">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function QuickAction({ href, title, icon }: { href: string; title: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="border rounded-xl p-4 bg-white shadow hover:shadow-md transition flex items-center gap-3 text-black"
    >
      <div className="text-[#e2d1c3]">{icon}</div>
      <div className="font-semibold">{title}</div>
    </Link>
  );
}


