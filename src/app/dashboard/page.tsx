"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [totalShiftsThisWeek, setTotalShiftsThisWeek] = useState<number>(0);
  const [fillRatePct, setFillRatePct] = useState<number>(0);
  const [unavailCount, setUnavailCount] = useState<number>(0);

  type ApiSchedule = {
    id: number;
    employee_name: string;
    store_name: string;
    shift_name: string;
    start_time: string;
    end_time: string;
    schedule_date: string;
  };

  type ApiUnavailability = {
    id: number;
    employee_name: string;
    start_date: string;
    end_date: string;
    remarks?: string;
  };

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const calendarEventsCategories = ["morning", "evening", "unavailability", "other"];

  // Fetch logged-in user
  useEffect(() => {
    async function fetchUser() {
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
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  // Load stats
  useEffect(() => {
    if (!user) return;
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard stats");
        const data = await res.json();

        if (user.role === "admin") {
          setTotalEmployees(data.totalEmployees || 0);
          setTotalShiftsThisWeek(data.totalShiftsThisWeek || 0);
          setFillRatePct(data.fillRatePct || 0);
          setUnavailCount(data.unavailCount || 0);
        } else {
          setTotalShiftsThisWeek(data.userShiftsThisWeek || 0);
          setUnavailCount(data.userUnavailCount || 0);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      }
    }
    loadStats();
  }, [user]);

  // Load schedules + unavailabilities
  useEffect(() => {
    if (!user) return;
    async function loadEvents() {
      try {
        setLoadingEvents(true);

        const isAdmin = user.role === "admin";

        const [schedRes, unavailRes] = await Promise.all([
          fetch(isAdmin ? "/api/schedules" : "/api/schedules?me=true"),
          fetch(isAdmin ? "/api/unavailabilities" : "/api/unavailabilities?me=true"),
        ]);

        if (!schedRes.ok) throw new Error("Failed to load schedules");
        if (!unavailRes.ok) throw new Error("Failed to load unavailabilities");

        const schedules: ApiSchedule[] = await schedRes.json();
        const unavailabilities: ApiUnavailability[] = await unavailRes.json();

        const toDateISO = (sd: string) => {
          const raw = String(sd);
          if (raw.includes("T")) return raw.slice(0, 10);
          const parts = raw.split("-");
          if (parts.length === 3 && parts[2].length === 4) {
            const [mm, dd, yyyy] = parts;
            return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
          }
          return raw;
        };
        const toHHMMSS = (t: string) =>
          t?.length >= 8 ? t.slice(0, 8) : `${t.slice(0, 5)}:00`;
        const toMinutes = (t: string) => {
          const [hh, mm] = t.slice(0, 5).split(":").map(Number);
          return hh * 60 + mm;
        };
        const addDays = (isoDate: string, days: number) => {
          const d = new Date(isoDate);
          d.setDate(d.getDate() + days);
          return d.toISOString().slice(0, 10);
        };
        const toAp = (t: string) => {
          const [hhStr, mmStr] = t.slice(0, 5).split(":");
          let hh = parseInt(hhStr, 10);
          const mm = parseInt(mmStr, 10);
          const suffix = hh >= 12 ? "p" : "a";
          hh = hh % 12 || 12;
          return `${hh}${mm ? `:${mmStr}` : ""}${suffix}`;
        };
        const buildTitle = (s: ApiSchedule, st: string, et: string) => {
          const shift = (s.shift_name || "").toLowerCase();
          if (shift.startsWith("morning"))
            return `Morning: ${toAp(st)}-${toAp(et)} | ${s.employee_name}`;
          if (shift.startsWith("evening"))
            return `Evening: ${toAp(st)}-${toAp(et)} | ${s.employee_name}`;
          if (shift.startsWith("open"))
            return `Open: ${toAp(st)}-${toAp(et)} | ${s.employee_name}`;
          return `${s.shift_name}: ${toAp(st)}-${toAp(et)} | ${s.employee_name}`;
        };

        const morningColor = "#ec6602";
        const eveningColor = "#009999";
        const defaultColor = "#8b5cf6";
        const unavailColor = "#f43f5e";

        const scheduleEvents = schedules.map((s) => {
          const d = toDateISO(s.schedule_date);
          const st = toHHMMSS(s.start_time);
          const et = toHHMMSS(s.end_time);
          const color = (s.shift_name || "").toLowerCase().startsWith("morning")
            ? morningColor
            : (s.shift_name || "").toLowerCase().startsWith("evening")
            ? eveningColor
            : defaultColor;
          const category =
            color === morningColor
              ? "morning"
              : color === eveningColor
              ? "evening"
              : "other";
          const endDate = toMinutes(et) <= toMinutes(st) ? addDays(d, 1) : d;
          return {
            id: `schedule-${s.id}`,
            title: buildTitle(s, st, et),
            start: `${d}T${st}`,
            end: `${endDate}T${et}`,
            backgroundColor: color,
            borderColor: color,
            display: "block",
            category,
          };
        });

        const unavailEvents = unavailabilities.flatMap((u) => {
          const startDate = toDateISO(u.start_date);
          const endDate = toDateISO(u.end_date);

          let currentDate = startDate;
          const events: any[] = [];

          while (currentDate <= endDate) {
            events.push({
              id: `unavail-${u.id}-${currentDate}`,
              title: `Unavailable: ${u.employee_name}${u.remarks ? ` (${u.remarks})` : ""}`,
              start: currentDate,
              end: addDays(currentDate, 1),
              allDay: true,
              backgroundColor: unavailColor,
              borderColor: unavailColor,
              display: "block",
              category: "unavailability",
            });

            currentDate = addDays(currentDate, 1);
          }

          return events;
        });

        const allEvents = [...scheduleEvents, ...unavailEvents];
        setCalendarEvents(allEvents);

        if (allEvents.length > 0) {
          const minDate = allEvents.map((e) => e.start.slice(0, 10)).sort()[0];
          setInitialDate(minDate);
        }

        setEventsError(null);
      } catch (err) {
        setEventsError((err as Error).message || "Unknown error");
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, [user]);

  const toggleCategory = (cat: string) => {
    setHiddenCategories((prev) => {
      if (prev.length === calendarEventsCategories.length - 1 && !prev.includes(cat)) {
        return [];
      }
      return calendarEventsCategories.filter((c) => c !== cat);
    });
  };

  const Legend = () => (
    <div className="flex items-center gap-4 text-sm text-black flex-wrap">
      <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleCategory("morning")}>
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#ec6602" }}></span>
        <span>Morning</span>
      </div>
      <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleCategory("evening")}>
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#009999" }}></span>
        <span>Evening</span>
      </div>
      <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleCategory("unavailability")}>
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#f43f5e" }}></span>
        <span>Unavailability</span>
      </div>
      <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleCategory("other")}>
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#8b5cf6" }}></span>
        <span>Other</span>
      </div>
    </div>
  );

  if (loadingUser) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Stats */}
      {user?.role === "admin" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link href="/employees">
            <StatCard title="Total Employees" value={totalEmployees.toString()} color="indigo-purple" />
          </Link>
          <StatCard title="Shifts This Week" value={totalShiftsThisWeek.toString()} color="emerald-teal" />
          <StatCard title="Fill Rate" value={`${fillRatePct}%`} color="orange-amber" />
          <Link href="/unavailabilities">
            <StatCard title="Unavailabilities" value={unavailCount.toString()} color="rose-pink" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Your Shifts This Week" value={totalShiftsThisWeek.toString()} color="emerald-teal" />
          <StatCard title="Your Unavailabilities" value={unavailCount.toString()} color="rose-pink" />
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <h3 className="font-semibold text-black">Calendar</h3>
          <Legend />
        </div>
        <div className="min-h-[480px] sm:min-h-[640px]">
          {eventsError ? (
            <div className="text-red-600">{eventsError}</div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={typeof window !== "undefined" && window.innerWidth < 768 ? "listWeek" : "dayGridMonth"}
              initialDate={initialDate}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right:
                  typeof window !== "undefined" && window.innerWidth < 768
                    ? "listWeek,timeGridDay"
                    : "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height="auto"
              selectable
              editable={false}
              events={calendarEvents.filter((e) => !hiddenCategories.includes(e.category))}
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
  const gradientStyles = {
    'indigo-purple': {
      background: 'linear-gradient(to right, #6366f1, #8b5cf6)'
    },
    'emerald-teal': {
      background: 'linear-gradient(to right, #10b981, #14b8a6)'
    },
    'orange-amber': {
      background: 'linear-gradient(to right, #f97316, #f59e0b)'
    },
    'rose-pink': {
      background: 'linear-gradient(to right, #f43f5e, #ec4899)'
    }
  } as const;

  return (
    <div 
      className="rounded-xl shadow p-4 text-white"
      style={gradientStyles[color as keyof typeof gradientStyles]}
    >
      <div className="text-sm opacity-90">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}