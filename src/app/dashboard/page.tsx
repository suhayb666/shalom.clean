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

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Load stats from unified API
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

  // Load schedules
  useEffect(() => {
    async function loadSchedules() {
      try {
        setLoadingEvents(true);
        const res = await fetch("/api/schedules");
        if (!res.ok) throw new Error("Failed to load schedules");
        const data: ApiSchedule[] = await res.json();

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
        const toHHMMSS = (t: string) => (t?.length >= 8 ? t.slice(0, 8) : `${t.slice(0, 5)}:00`);
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
          if (shift.startsWith("morning")) return `Morning: ${toAp(st)}-${toAp(et)} | ${s.employee_name}`;
          if (shift.startsWith("evening")) return `Evening: ${toAp(st)}-${toAp(et)} | ${s.employee_name}`;
          if (shift.startsWith("open")) return `Open: ${toAp(st)}-${toAp(et)} | ${s.employee_name}`;
          return `${s.shift_name}: ${toAp(st)}-${toAp(et)} | ${s.employee_name}`;
        };

        const morningColor = "#ec6602";
        const eveningColor = "#009999";
        const defaultColor = "#8b5cf6";

        const events = data.map((s) => {
          const d = toDateISO(s.schedule_date);
          const st = toHHMMSS(s.start_time);
          const et = toHHMMSS(s.end_time);
          const color = (s.shift_name || "").toLowerCase().startsWith("morning")
            ? morningColor
            : (s.shift_name || "").toLowerCase().startsWith("evening")
            ? eveningColor
            : defaultColor;
          const endDate = toMinutes(et) <= toMinutes(st) ? addDays(d, 1) : d;
          return {
            id: String(s.id),
            title: buildTitle(s, st, et),
            start: `${d}T${st}`,
            end: `${endDate}T${et}`,
            backgroundColor: color,
            borderColor: color,
            display: "block",
          };
        });

        setCalendarEvents(events);
        if (data.length > 0) {
          const minDate = data.map((s) => toDateISO(s.schedule_date)).sort()[0];
          setInitialDate(minDate);
        }
        setEventsError(null);
      } catch (err) {
        setEventsError((err as Error).message || "Unknown error");
      } finally {
        setLoadingEvents(false);
      }
    }
    loadSchedules();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={totalEmployees.toString()} color="from-indigo-500 to-purple-500" />
        <StatCard title="Shifts This Week" value={totalShiftsThisWeek.toString()} color="from-emerald-500 to-teal-500" />
        <StatCard title="Fill Rate" value={`${fillRatePct}%`} color="from-orange-500 to-amber-500" />
        <StatCard title="Unavailabilities" value={unavailCount.toString()} color="from-rose-500 to-pink-500" />
      </div>

      {/* Calendar */}
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
