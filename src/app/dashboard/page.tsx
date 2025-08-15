"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Link from "next/link";

export default function DashboardPage() {
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

  // NEW: hidden categories state
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  // Load stats
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard stats");
        const data = await res.json();

        setTotalEmployees(data.totalEmployees || 0);
        setTotalShiftsThisWeek(data.totalShiftsThisWeek || 0);
        setFillRatePct(data.fillRatePct || 0);
        setUnavailCount(data.unavailCount || 0);
      } catch (err) {
        console.error("Error loading stats:", err);
      }
    }
    loadStats();
  }, []);

  // Load schedules + unavailabilities
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoadingEvents(true);

        const [schedRes, unavailRes] = await Promise.all([
          fetch("/api/schedules"),
          fetch("/api/unavailabilities"),
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
        const unavailColor = "#f43f5e"; // rose-500

        // Schedule events
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

        // Unavailability events - one per day
        const unavailEvents = unavailabilities.flatMap((u) => {
          const startDate = toDateISO(u.start_date);
          const endDate = toDateISO(u.end_date);

          let currentDate = startDate;
          const events: any[] = [];

          while (currentDate <= endDate) {
            events.push({
              id: `unavail-${u.id}-${currentDate}`,
              title: `Unavailable: ${u.employee_name}${
                u.remarks ? ` (${u.remarks})` : ""
              }`,
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
          const minDate = allEvents
            .map((e) => e.start.slice(0, 10))
            .sort()[0];
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
  }, []);

// Toggle category visibility (reversed logic: show only clicked category)
const toggleCategory = (cat: string) => {
  setHiddenCategories((prev) => {
    // If we are already showing only this category, reset to show all
    if (prev.length === calendarEventsCategories.length - 1 && !prev.includes(cat)) {
      return [];
    }
    // Otherwise, hide all except the clicked one
    return calendarEventsCategories.filter((c) => c !== cat);
  });
};

// List of all possible categories for easy reference
const calendarEventsCategories = ["morning", "evening", "unavailability", "other"];


  // Legend JSX
  const Legend = () => (
    <div className="flex items-center gap-4 text-sm text-black">
      <div
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => toggleCategory("morning")}
      >
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#ec6602" }}></span>
        <span>Morning shift</span>
      </div>
      <div
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => toggleCategory("evening")}
      >
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#009999" }}></span>
        <span>Evening shift</span>
      </div>
      <div
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => toggleCategory("unavailability")}
      >
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#f43f5e" }}></span>
        <span>Unavailability</span>
      </div>
      <div
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => toggleCategory("other")}
      >
        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#8b5cf6" }}></span>
        <span>Other shifts</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/employees">
          <StatCard
            title="Total Employees"
            value={totalEmployees.toString()}
            color="from-indigo-500 to-purple-500"
          />
        </Link>
        <StatCard
          title="Shifts This Week"
          value={totalShiftsThisWeek.toString()}
          color="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Fill Rate"
          value={`${fillRatePct}%`}
          color="from-orange-500 to-amber-500"
        />
        <Link href="/unavailabilities">
          <StatCard
            title="Unavailabilities"
            value={unavailCount.toString()}
            color="from-rose-500 to-pink-500"
          />
        </Link>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-black">Calendar</h3>
          <Legend />
        </div>
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
              events={calendarEvents.filter(
                (e) => !hiddenCategories.includes(e.category)
              )}
              eventDisplay="block"
              timeZone="local"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className={`rounded-xl shadow p-4 text-white bg-gradient-to-r ${color}`}
    >
      <div className="text-sm opacity-90">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  icon,
}: {
  href: string;
  title: string;
  icon: React.ReactNode;
}) {
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
