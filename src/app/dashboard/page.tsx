"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import Link from "next/link";
import { ClaimShiftModal } from "../components/ClaimShiftModal";
import { EmployeeRequestModal } from "../components/EmployeeRequestModal"; // Import the new modal
import { ImSpinner2 } from "react-icons/im";

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
    employee_name: string | null; // Made nullable for open shifts
    store_name: string;
    shift_name: string;
    start_time: string;
    end_time: string;
    schedule_date: string;
    status: string; // Added status
    is_open_shift: boolean; // Add is_open_shift
  };

  type ApiUnavailability = {
    id: number;
    employee_name: string;
    start_date: string;
    end_date: string;
    remarks?: string;
  };

  type EmployeeRequest = {
    request_id: number;
    requester_employee_id: number;
    request_status: string;
    schedule_id: number;
    schedule_date: string;
    shift_name: string;
    store_name: string;
  };

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false); // State for modal
  const [selectedShift, setSelectedShift] = useState<ApiSchedule | null>(null); // State for selected shift
  const [isClaimShiftModalOpen, setIsClaimShiftModalOpen] = useState(false); // State for claim shift modal
  const [selectedOpenShift, setSelectedOpenShift] = useState<ApiSchedule | null>(null); // State for selected open shift for claiming
  const [isEmployeeRequestModalOpen, setIsEmployeeRequestModalOpen] = useState(false); // State for employee request modal
  const [selectedEmployeeShift, setSelectedEmployeeShift] = useState<ApiSchedule | null>(null); // State for selected employee shift
  const [allEmployees, setAllEmployees] = useState<{
    id: number;
    name: string;
  }[]>([]); // State for all employees

  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [dynamicCalendarCategories, setDynamicCalendarCategories] = useState<string[]>(
    [] // Initialize empty, then populate based on user role
  );
  const [calendarInitialView, setCalendarInitialView] = useState<string>("dayGridMonth"); // Default view

  // Fetch logged-in user
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          // Initialize dynamicCalendarCategories based on user role
          if (data.user.role !== "admin") {
            setDynamicCalendarCategories(["morning", "evening", "unavailability", "other", "open_shift", "pending_request"]);
          } else {
            setDynamicCalendarCategories(["morning", "evening", "unavailability", "other", "open_shift"]);
          }
        } else {
          setUser(null);
          setDynamicCalendarCategories(["morning", "evening", "unavailability", "other", "open_shift"]); // Default for logged out users
        }
      } catch {
        setUser(null);
        setDynamicCalendarCategories(["morning", "evening", "unavailability", "other", "open_shift"]); // Default on error
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

        const [schedRes, unavailRes, openShiftsRes, myRequestsRes] = await Promise.all<Response[]>([
          fetch(isAdmin ? "/api/schedules" : "/api/schedules?me=true"),
          fetch(isAdmin ? "/api/unavailabilities" : "/api/unavailabilities?me=true"),
          fetch("/api/schedules?is_open_shift=true&status=open"), // Fetch open shifts
          isAdmin ? Promise.resolve(new Response(JSON.stringify([]))) : fetch(`/api/open-shift-requests?employee_id=${user.id}&status=pending`), // Fetch pending requests only for non-admins
        ]);

        if (!schedRes.ok) throw new Error("Failed to load schedules");
        if (!unavailRes.ok) throw new Error("Failed to load unavailabilities");
        if (!openShiftsRes.ok) throw new Error("Failed to load open shifts"); // Handle error for open shifts
        if (!myRequestsRes.ok && !isAdmin) throw new Error("Failed to load my requests"); // Handle error for my requests only if not admin

        const schedules: ApiSchedule[] = await schedRes.json();
        const unavailabilities: ApiUnavailability[] = await unavailRes.json();
        const openShifts: ApiSchedule[] = await openShiftsRes.json(); // Get open shifts data
        const myRequests: EmployeeRequest[] = isAdmin ? [] : await myRequestsRes.json(); // Get my requests data only if not admin

        // Dynamically add 'open_shift' category if there are open shifts
        if (openShifts.length > 0 && !dynamicCalendarCategories.includes("open_shift")) {
          setDynamicCalendarCategories(prev => [...prev, "open_shift"]);
        } else if (openShifts.length === 0 && dynamicCalendarCategories.includes("open_shift")) {
          setDynamicCalendarCategories(prev => prev.filter(cat => cat !== "open_shift"));
        }

        // Dynamically add 'pending_request' category if there are pending requests
        if (!isAdmin && myRequests.length > 0 && !dynamicCalendarCategories.includes("pending_request")) {
          setDynamicCalendarCategories(prev => [...prev, "pending_request"]);
        } else if (!isAdmin && myRequests.length === 0 && dynamicCalendarCategories.includes("pending_request")) {
          setDynamicCalendarCategories(prev => prev.filter(cat => cat !== "pending_request"));
        }

        if (isAdmin && dynamicCalendarCategories.includes("pending_request")) {
          setDynamicCalendarCategories(prev => prev.filter(cat => cat !== "pending_request"));
        }

        if (openShifts.length === 0 && dynamicCalendarCategories.includes("open_shift")) {
          setDynamicCalendarCategories(prev => prev.filter(cat => cat !== "open_shift"));
        } else if (openShifts.length > 0 && !dynamicCalendarCategories.includes("open_shift")) {
          setDynamicCalendarCategories(prev => [...prev, "open_shift"]);
        }

        if (!dynamicCalendarCategories.includes("morning")) setDynamicCalendarCategories(prev => [...prev, "morning"]);
        if (!dynamicCalendarCategories.includes("evening")) setDynamicCalendarCategories(prev => [...prev, "evening"]);
        if (!dynamicCalendarCategories.includes("unavailability")) setDynamicCalendarCategories(prev => [...prev, "unavailability"]);
        if (!dynamicCalendarCategories.includes("other")) setDynamicCalendarCategories(prev => [...prev, "other"]);

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
        const buildTitle = (s: ApiSchedule, st: string, et: string, isRequest: boolean = false) => {
          const shift = (s.shift_name || "").toLowerCase();
          let employeeName = s.employee_name || 'Unassigned';

          if (s.is_open_shift) {
            employeeName = 'OPEN SHIFT';
          } else if (isRequest) {
            employeeName = `REQUESTED by ${s.employee_name}`; // For requests where employee_name is the requester
          }

          if (shift.startsWith("morning"))
            return `Morning: ${toAp(st)}-${toAp(et)} | ${employeeName}`;
          if (shift.startsWith("evening"))
            return `Evening: ${toAp(st)}-${toAp(et)} | ${employeeName}`;
          return `${s.shift_name}: ${toAp(st)}-${toAp(et)} | ${employeeName}`;
        };

        const morningColor = "#ec6602";
        const eveningColor = "#009999"; // This is the teal/sky blue color
        const defaultColor = "#8b5cf6";
        const unavailColor = "#f43f5e";
        const openShiftColor = "#22c55e"; // Green for open shifts
        const pendingRequestColor = "#FFA500"; // Orange for pending requests

        const combinedScheduleEvents = [
          ...schedules.map((s) => {
            const d = toDateISO(s.schedule_date);
            const st = toHHMMSS(s.start_time);
            const et = toHHMMSS(s.end_time);

            let color = defaultColor;
            let category = "other";

            if (s.is_open_shift) {
              color = openShiftColor;
              category = "open_shift";
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
                is_open_shift: s.is_open_shift,
              },
            };
          }),
          ...openShifts.map((s) => {
            const d = toDateISO(s.schedule_date);
            const st = toHHMMSS(s.start_time);
            const et = toHHMMSS(s.end_time);

            const endDate = toMinutes(et) <= toMinutes(st) ? addDays(d, 1) : d;
            return {
              id: `schedule-${s.id}`,
              title: buildTitle(s, st, et),
              start: `${d}T${st}`,
              end: `${endDate}T${et}`,
              backgroundColor: openShiftColor,
              borderColor: openShiftColor,
              display: "block",
              category: "open_shift",
              extendedProps: { 
                shiftData: s,
                is_open_shift: true,
              },
            };
          }),
          ...myRequests.map((req) => {
            const d = toDateISO(req.schedule_date);
            const st = toHHMMSS("00:00:00"); // Assuming full day request for simplicity in display, adjust if needed
            const et = toHHMMSS("23:59:59"); // Assuming full day request for simplicity in display, adjust if needed

            const endDate = toMinutes(et) <= toMinutes(st) ? addDays(d, 1) : d;
            return {
              id: `request-${req.request_id}`,
              title: `REQUEST: ${req.shift_name} (${req.store_name}) - PENDING`,
              start: `${d}T${st}`,
              end: `${endDate}T${et}`,
              backgroundColor: pendingRequestColor,
              borderColor: pendingRequestColor,
              display: "block",
              category: "pending_request",
              extendedProps: { 
                requestData: req,
                is_request: true,
                schedule_id: req.schedule_id,
              },
            };
          }),
        ];

        const allEvents = [...combinedScheduleEvents, ...unavailabilities.flatMap((u) => {
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
        })];
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

  // Fetch all employees for admin reassign dropdown and employee swap shifts
  useEffect(() => {
    if (user) {
      async function fetchEmployees() {
        try {
          console.log("🔍 Fetching employees...");
          const res = await fetch("/api/employees");
          console.log("🔍 Employees API response status:", res.status);
          if (res.ok) {
            const data = await res.json();
            console.log("🔍 Employees data received:", data);
            setAllEmployees(data);
          } else {
            console.error("Failed to fetch employees, status:", res.status);
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
      if (prev.length === dynamicCalendarCategories.length - 1 && !prev.includes(cat)) {
        return [];
      }
      return dynamicCalendarCategories.filter((c) => c !== cat);
    });
  };

  const Legend = ({ isAdmin }: LegendProps) => (
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
      {/* Conditionally Add Open Shift to Legend */}
      {dynamicCalendarCategories.includes("open_shift") && (
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleCategory("open_shift")}>
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#22c55e" }}></span>
          <span>Open Shift</span>
        </div>
      )}
      {/* Conditionally Add Pending Request to Legend */}
      {!isAdmin && dynamicCalendarCategories.includes("pending_request") && (
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleCategory("pending_request")}>
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#FFA500" }}></span>
          <span>Pending Request</span>
        </div>
      )}
    </div>
  );

  // Function to refresh calendar events
  const refreshCalendarEvents = async () => {
    if (!user) return;
    setLoadingEvents(true);
    try {
      const isAdmin = user.role === "admin";
      const [schedRes, unavailRes, openShiftsRes, myRequestsRes] = await Promise.all([
        fetch(isAdmin ? "/api/schedules" : "/api/schedules?me=true"),
        fetch(isAdmin ? "/api/unavailabilities" : "/api/unavailabilities?me=true"),
        fetch("/api/schedules?is_open_shift=true&status=open"),
        fetch(isAdmin ? "/api/open-shift-requests" : `/api/open-shift-requests?employee_id=${user.id}&status=pending`),
      ]);

      if (!schedRes.ok) throw new Error("Failed to load schedules");
      if (!unavailRes.ok) throw new Error("Failed to load unavailabilities");
      if (!openShiftsRes.ok) throw new Error("Failed to load open shifts");
      if (!myRequestsRes.ok && !isAdmin) throw new Error("Failed to load my requests");

      const schedules: ApiSchedule[] = await schedRes.json();
      const unavailabilities: ApiUnavailability[] = await unavailRes.json();
      const openShifts: ApiSchedule[] = await openShiftsRes.json();
      const myRequests: EmployeeRequest[] = isAdmin ? [] : await myRequestsRes.json();

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
      const buildTitle = (s: ApiSchedule, st: string, et: string, isRequest: boolean = false) => {
        const shift = (s.shift_name || "").toLowerCase();
        let employeeName = s.employee_name || 'Unassigned';

        if (s.is_open_shift) {
          employeeName = 'OPEN SHIFT';
        } else if (isRequest) {
          employeeName = `REQUESTED by ${s.employee_name}`; // For requests where employee_name is the requester
        }

        if (shift.startsWith("morning"))
          return `Morning: ${toAp(st)}-${toAp(et)} | ${employeeName}`;
        if (shift.startsWith("evening"))
          return `Evening: ${toAp(st)}-${toAp(et)} | ${employeeName}`;
        return `${s.shift_name}: ${toAp(st)}-${toAp(et)} | ${employeeName}`;
      };

      const morningColor = "#ec6602";
      const eveningColor = "#009999";
      const defaultColor = "#8b5cf6";
      const unavailColor = "#f43f5e";
      const openShiftColor = "#22c55e"; // Green for open shifts
      const pendingRequestColor = "#FFA500"; // Orange for pending requests

      const combinedScheduleEvents = [
        ...schedules.map((s) => {
          const d = toDateISO(s.schedule_date);
          const st = toHHMMSS(s.start_time);
          const et = toHHMMSS(s.end_time);

          let color = defaultColor;
          let category = "other";

          if (s.is_open_shift) {
            color = openShiftColor;
            category = "open_shift";
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
            extendedProps: { 
              shiftData: s,
              is_open_shift: s.is_open_shift,
            },
          };
        }),
        ...openShifts.map((s) => {
          const d = toDateISO(s.schedule_date);
          const st = toHHMMSS(s.start_time);
          const et = toHHMMSS(s.end_time);

          const endDate = toMinutes(et) <= toMinutes(st) ? addDays(d, 1) : d;
          return {
            id: `schedule-${s.id}`,
            title: buildTitle(s, st, et),
            start: `${d}T${st}`,
            end: `${endDate}T${et}`,
            backgroundColor: openShiftColor,
            borderColor: openShiftColor,
            display: "block",
            category: "open_shift",
            extendedProps: { 
              shiftData: s,
              is_open_shift: true,
            },
          };
        }),
        ...myRequests.map((req) => {
          const d = toDateISO(req.schedule_date);
          const st = toHHMMSS("00:00:00"); 
          const et = toHHMMSS("23:59:59"); 

          const endDate = toMinutes(et) <= toMinutes(st) ? addDays(d, 1) : d;
          return {
            id: `request-${req.request_id}`,
            title: `REQUEST: ${req.shift_name} (${req.store_name}) - PENDING`,
            start: `${d}T${st}`,
            end: `${endDate}T${et}`,
            backgroundColor: pendingRequestColor,
            borderColor: pendingRequestColor,
            display: "block",
            category: "pending_request",
            extendedProps: { 
              requestData: req,
              is_request: true,
              schedule_id: req.schedule_id,
            },
          };
        }),
      ];

      const allEvents = [...combinedScheduleEvents, ...unavailabilities.flatMap((u) => {
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
      })];
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

  const handleEventClick = async (arg: any) => {
    if (!user) return;

    const event = arg.event;
    const shiftData: ApiSchedule = event.extendedProps.shiftData;

    if (user.role === "admin") {
      setSelectedShift(shiftData);
      setIsShiftModalOpen(true);
    } else if (shiftData && shiftData.is_open_shift) {
      setSelectedOpenShift(shiftData);
      setIsClaimShiftModalOpen(true);
    } else if (shiftData && Number(shiftData.employee_id) === Number(user.id) && !shiftData.is_open_shift) {
      // This is an assigned shift for the current employee
      setSelectedEmployeeShift(shiftData);
      setIsEmployeeRequestModalOpen(true);
    }
  };

  const handleClaimShiftSubmit = async (shiftId: number, remarks: string) => {
    try {
      const res = await fetch("/api/open-shift-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: shiftId,
          employee_id: user.id,
          remarks: remarks, // Include remarks in the request
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to request shift");
      }

      alert("Shift request submitted successfully!");
      refreshCalendarEvents(); // Refresh events after request
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert("Error submitting shift request: " + errorMessage);
      throw err; // Re-throw to allow modal to handle error state
    }
  };

  const handleCloseClaimShiftModal = () => {
    setIsClaimShiftModalOpen(false);
    setSelectedOpenShift(null);
  };

  const handleCloseShiftModal = () => {
    setIsShiftModalOpen(false);
    setSelectedShift(null);
  };

  const handleCloseEmployeeRequestModal = () => {
    setIsEmployeeRequestModalOpen(false);
    setSelectedEmployeeShift(null);
  };

  const handleSubmitTimeOff = async (shiftId: number, startDate: string, endDate: string, reason: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/employee-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: "time_off",
          employee_id: user.id,
          start_date: startDate,
          end_date: endDate,
          remarks: reason,
          schedule_id: shiftId,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit time off request");
      }
      alert("Time off request submitted successfully!");
      refreshCalendarEvents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert("Error submitting time off request: " + errorMessage);
      throw err;
    }
  };

  const handleSubmitMissShift = async (shiftId: number, reason: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/employee-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: "miss_shift",
          employee_id: user.id,
          remarks: reason,
          schedule_id: shiftId,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit miss shift request");
      }
      alert("Miss shift request submitted successfully!");
      refreshCalendarEvents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert("Error submitting miss shift request: " + errorMessage);
      throw err;
    }
  };

  const handleSubmitSwapShift = async (shiftId: number, swapWithEmployeeId: number, reason: string) => {
    if (!user) return;

    // First, get the shift details to check the date
    try {
      const shiftRes = await fetch(`/api/admin/schedules/${shiftId}`);
      if (!shiftRes.ok) {
        throw new Error("Failed to get shift details");
      }
      const shiftData = await shiftRes.json();
      
      // Check if the target employee has a shift on the same day
      const resCheck = await fetch(`/api/employee-schedules?employee_id=${swapWithEmployeeId}&date=${shiftData.schedule_date}`);
      if (!resCheck.ok) {
        const errorData = await resCheck.json();
        throw new Error(errorData.error || "Failed to check employee's schedule");
      }
      const employeeSchedule = await resCheck.json();

      if (employeeSchedule && employeeSchedule.length > 0) {
        alert("The selected employee already has a shift scheduled for this day. Cannot swap.");
        throw new Error("Employee already has a shift.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert("Error checking employee schedule: " + errorMessage);
      throw err;
    }

    try {
      const res = await fetch("/api/employee-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: "shift_swap",
          employee_id: user.id,
          schedule_id: shiftId,
          swap_with_employee_id: swapWithEmployeeId,
          remarks: reason,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit swap shift request");
      }
      alert("Swap shift request submitted successfully!");
      refreshCalendarEvents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert("Error submitting swap shift request: " + errorMessage);
      throw err;
    }
  };

  const handleReassign = async (shiftId: number, newEmployeeId: number | null) => {
    setIsReassigning(true);
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
      setIsReassigning(false);
      handleCloseShiftModal();
    }
  };

  const handleDelete = async (shiftId: number, deleteType: "this" | "all") => {
    setIsDeleting(true);
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
      setIsDeleting(false);
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
    setIsRescheduling(true);
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
      setIsRescheduling(false);
      handleCloseShiftModal();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        setCalendarInitialView("listWeek");
      } else {
        setCalendarInitialView("dayGridMonth");
      }
    }
  }, []);

  if (loadingUser) return <div className="p-6">Loading...</div>;

  const isAdmin = user?.role === "admin";

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
          <Legend isAdmin={isAdmin} />
        </div>
        <div className="min-h-[480px] sm:min-h-[640px]">
          {eventsError ? (
            <div className="text-red-600">{eventsError}</div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={calendarInitialView}
              initialDate={initialDate}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: calendarInitialView === "listWeek" || calendarInitialView === "timeGridDay" ? "listWeek,timeGridDay" : "dayGridMonth,timeGridWeek,timeGridDay",
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

      <ClaimShiftModal
        isOpen={isClaimShiftModalOpen}
        onClose={handleCloseClaimShiftModal}
        shift={selectedOpenShift}
        onSubmit={handleClaimShiftSubmit}
      />

      {user?.role !== "admin" && selectedEmployeeShift && (
        <EmployeeRequestModal
          isOpen={isEmployeeRequestModalOpen}
          onClose={handleCloseEmployeeRequestModal}
          shift={selectedEmployeeShift}
          onSubmitTimeOff={handleSubmitTimeOff}
          onSubmitMissShift={handleSubmitMissShift}
          onSubmitSwapShift={handleSubmitSwapShift}
          employees={allEmployees} // Pass all employees for the swap shift feature
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
  onReassign: (shiftId: number, newEmployeeId: number | null) => Promise<void>; // Corrected type
  onDelete: (shiftId: number, deleteType: "this" | "all") => Promise<void>;
  onReschedule: (
    shiftId: number,
    newStartTime: string,
    newEndTime: string,
    newScheduleDate: string,
    rescheduleType: "this" | "all"
  ) => Promise<void>;
}

interface LegendProps {
  isAdmin: boolean;
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
  const [isReassigning, setIsReassigning] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" style={{ backgroundColor: 'white' }}>
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
            <option value="null">Unassign (Make Open Shift)</option> {/* Updated option text */}
          </select>
          <button
            onClick={() => onReassign(shift.id, newEmployeeId === "null" ? null : parseInt(newEmployeeId))}
            className="w-full px-4 py-2 bg-[#009a38] text-white rounded-md hover:bg-[#00882f] transition-colors"
            disabled={isReassigning}
          >
            {isReassigning ? (
              <ImSpinner2 className="animate-spin h-5 w-5 text-white" />
            ) : (
              "Reassign"
            )}
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
            className="w-full px-4 py-2 bg-[#009a38] text-white rounded-md hover:bg-[#00882f] transition-colors"
            disabled={isRescheduling}
          >
            {isRescheduling ? (
              <ImSpinner2 className="animate-spin h-5 w-5 text-white" />
            ) : (
              "Reschedule"
            )}
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
            className="w-full px-4 py-2 bg-[#dc3545] text-white rounded-md hover:bg-[#c82333] transition-colors"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ImSpinner2 className="animate-spin h-5 w-5 text-white" />
            ) : (
              "Delete Shift"
            )}
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#dc3545] text-[#dc3545] rounded-md hover:bg-[#c82333] hover:text-white transition-colors"
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