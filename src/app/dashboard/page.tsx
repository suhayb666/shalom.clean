"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
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
    employee_id: number | null; // Added employee_id
    employee_name: string;
    store_name: string;
    shift_name: string;
    start_time: string;
    end_time: string;
    schedule_date: string;
    status: string; // Added status
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
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false); // State for modal
  const [selectedShift, setSelectedShift] = useState<ApiSchedule | null>(null); // State for selected shift
  const [allEmployees, setAllEmployees] = useState<{
    id: number;
    name: string;
  }[]>([]); // State for all employees

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

  // Fetch all employees for admin reassign dropdown
  useEffect(() => {
    if (user?.role === "admin") {
      async function fetchEmployees() {
        try {
          const res = await fetch("/api/employees");
          if (res.ok) {
            const data = await res.json();
            setAllEmployees(data);
          } else {
            console.error("Failed to fetch employees");
          }
        } catch (err) {
          console.error("Error fetching employees:", err);
        }
      }
      fetchEmployees();
    }
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

  // Function to refresh calendar events
  const refreshCalendarEvents = async () => {
    if (!user) return;
    setLoadingEvents(true);
    try {
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
        const employeeName = s.employee_name || (s.employee_id === null && s.status === 'open' ? 'Open' : 'Unassigned');

        if (shift.startsWith("morning"))
          return `Morning: ${toAp(st)}-${toAp(et)} | ${employeeName}`;
        if (shift.startsWith("evening"))
          return `Evening: ${toAp(st)}-${toAp(et)} | ${employeeName}`;
        if (shift.startsWith("open"))
          return `Open: ${toAp(st)}-${toAp(et)} | ${employeeName}`;
        return `${s.shift_name}: ${toAp(st)}-${toAp(et)} | ${employeeName}`;
      };

      const morningColor = "#ec6602";
      const eveningColor = "#009999";
      const defaultColor = "#8b5cf6";
      const unavailColor = "#f43f5e";
      const openShiftColor = "#10b981"; // A distinct color for open shifts

      const scheduleEvents = schedules.map((s) => {
        const d = toDateISO(s.schedule_date);
        const st = toHHMMSS(s.start_time);
        const et = toHHMMSS(s.end_time);

        let color = defaultColor;
        let category = "other";

        if (s.employee_id === null && s.status === 'open') {
            color = openShiftColor;
            category = "open";
        } else if ((s.shift_name || "").toLowerCase().startsWith("morning")) {
            color = morningColor;
            category = "morning";
        } else if ((s.shift_name || "").toLowerCase().startsWith("evening")) {
            color = eveningColor;
            category = "evening";
        }

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
          extendedProps: { // Store original shift data
            shiftData: s,
          },
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
  };

  const handleEventClick = (arg: any) => {
    if (user?.role === "admin") {
      const shiftData: ApiSchedule = arg.event.extendedProps.shiftData;
      setSelectedShift(shiftData);
      setIsShiftModalOpen(true);
    }
  };

  const handleCloseShiftModal = () => {
    setIsShiftModalOpen(false);
    setSelectedShift(null);
  };

  const handleReassign = async (shiftId: number, newEmployeeId: number) => {
    try {
      const res = await fetch(`/api/admin/schedules/${shiftId}/reassign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_employee_id: newEmployeeId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reassign shift");
      }
      alert("Shift reassigned successfully!");
      refreshCalendarEvents(); // Refresh events after reassign
    } catch (err) {
      alert((err as Error).message);
    } finally {
      handleCloseShiftModal();
    }
  };

  const handleDelete = async (shiftId: number, deleteType: "this" | "all") => {
    if (deleteType === "all") {
      alert("Deleting all recurring events is not yet implemented. Deleting this event only.");
    }
    try {
      const res = await fetch(`/api/admin/schedules/${shiftId}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete shift");
      }
      alert("Shift deleted successfully!");
      refreshCalendarEvents(); // Refresh events after delete
    } catch (err) {
      alert((err as Error).message);
    } finally {
      handleCloseShiftModal();
    }
  };

  const handleReschedule = async (
    shiftId: number,
    newStartTime: string,
    newEndTime: string,
    newScheduleDate: string,
    rescheduleType: "this" | "all"
  ) => {
    if (rescheduleType === "all") {
      alert("Rescheduling all recurring events is not yet implemented. Rescheduling this event only.");
    }
    try {
      const res = await fetch(`/api/admin/schedules/${shiftId}/reschedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_start_time: newStartTime,
          new_end_time: newEndTime,
          new_schedule_date: newScheduleDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reschedule shift");
      }
      alert("Shift rescheduled successfully!");
      refreshCalendarEvents(); // Refresh events after reschedule
    } catch (err) {
      alert((err as Error).message);
    } finally {
      handleCloseShiftModal();
    }
  };

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
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
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
              eventClick={handleEventClick} // Make events clickable
            />
          )}
        </div>
      </div>

      {user?.role === "admin" && selectedShift && (
        <ShiftManagementModal
          isOpen={isShiftModalOpen}
          onClose={handleCloseShiftModal}
          shift={selectedShift}
          employees={allEmployees}
          onReassign={handleReassign}
          onDelete={handleDelete}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  );
}

// Shift Management Modal Component
interface ShiftManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ApiSchedule;
  employees: { id: number; name: string }[];
  onReassign: (shiftId: number, newEmployeeId: number) => Promise<void>;
  onDelete: (shiftId: number, deleteType: "this" | "all") => Promise<void>;
  onReschedule: (
    shiftId: number,
    newStartTime: string,
    newEndTime: string,
    newScheduleDate: string,
    rescheduleType: "this" | "all"
  ) => Promise<void>;
}

function ShiftManagementModal({
  isOpen,
  onClose,
  shift,
  employees,
  onReassign,
  onDelete,
  onReschedule,
}: ShiftManagementModalProps) {
  const [newEmployeeId, setNewEmployeeId] = useState<string>("");
  const [newStartTime, setNewStartTime] = useState<string>(shift.start_time.substring(0, 5));
  const [newEndTime, setNewEndTime] = useState<string>(shift.end_time.substring(0, 5));
  const [newScheduleDate, setNewScheduleDate] = useState<string>(shift.schedule_date);
  const [rescheduleType, setRescheduleType] = useState<"this" | "all">("this");
  const [deleteType, setDeleteType] = useState<"this" | "all">("this");

  useEffect(() => {
    if (isOpen && shift) {
      setNewEmployeeId(shift.employee_id?.toString() || "");
      setNewStartTime(shift.start_time.substring(0, 5));
      setNewEndTime(shift.end_time.substring(0, 5));
      setNewScheduleDate(shift.schedule_date);
      setRescheduleType("this");
      setDeleteType("this");
    }
  }, [isOpen, shift]);

  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-black">Manage Shift: {shift.shift_name}</h2>
        <p className="mb-4 text-gray-700">Date: {new Date(shift.schedule_date).toLocaleDateString()}</p>

        {/* Reassign Shift */}
        <div className="mb-4 p-3 border rounded-md bg-gray-50">
          <h3 className="font-semibold text-black mb-2">Reassign Shift</h3>
          <select
            value={newEmployeeId}
            onChange={(e) => setNewEmployeeId(e.target.value)}
            className="w-full border px-3 py-2 rounded mb-2 text-black"
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
            <option value="null">Unassign (Make Open)</option>
          </select>
          <button
            onClick={() => onReassign(shift.id, newEmployeeId === "null" ? null : parseInt(newEmployeeId))}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Reassign
          </button>
        </div>

        {/* Reschedule Shift */}
        <div className="mb-4 p-3 border rounded-md bg-gray-50">
          <h3 className="font-semibold text-black mb-2">Reschedule Shift</h3>
          <input
            type="date"
            value={newScheduleDate}
            onChange={(e) => setNewScheduleDate(e.target.value)}
            className="w-full border px-3 py-2 rounded mb-2 text-black"
          />
          <input
            type="time"
            value={newStartTime}
            onChange={(e) => setNewStartTime(e.target.value)}
            className="w-full border px-3 py-2 rounded mb-2 text-black"
          />
          <input
            type="time"
            value={newEndTime}
            onChange={(e) => setNewEndTime(e.target.value)}
            className="w-full border px-3 py-2 rounded mb-4 text-black"
          />
          {/* Reschedule Type Radio Buttons */}
          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center text-black">
              <input
                type="radio"
                name="rescheduleType"
                value="this"
                checked={rescheduleType === "this"}
                onChange={() => setRescheduleType("this")}
                className="mr-2"
              />
              This event only
            </label>
            <label className="flex items-center text-black">
              <input
                type="radio"
                name="rescheduleType"
                value="all"
                checked={rescheduleType === "all"}
                onChange={() => setRescheduleType("all")}
                className="mr-2"
                disabled // Disable 'all' for now
              />
              All future events (Not yet implemented)
            </label>
          </div>
          <button
            onClick={() =>
              onReschedule(shift.id, newStartTime, newEndTime, newScheduleDate, rescheduleType)
            }
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Reschedule
          </button>
        </div>

        {/* Delete Shift */}
        <div className="mb-4 p-3 border rounded-md bg-gray-50">
          <h3 className="font-semibold text-black mb-2">Delete Shift</h3>
          {/* Delete Type Radio Buttons */}
          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center text-black">
              <input
                type="radio"
                name="deleteType"
                value="this"
                checked={deleteType === "this"}
                onChange={() => setDeleteType("this")}
                className="mr-2"
              />
              This event only
            </label>
            <label className="flex items-center text-black">
              <input
                type="radio"
                name="deleteType"
                value="all"
                checked={deleteType === "all"}
                onChange={() => setDeleteType("all")}
                className="mr-2"
                disabled // Disable 'all' for now
              />
              All future events (Not yet implemented)
            </label>
          </div>
          <button
            onClick={() => onDelete(shift.id, deleteType)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Shift
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
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