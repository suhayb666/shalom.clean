"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = { id: number; name: string };
type Shift = { id: number; shift_name: string; start_time: string; end_time: string };
type Unavailability = { id: number; employee_name: string; start_date: string; end_date: string; remarks: string };

const storeNames = ["Shalom Pizza", "Shalom Grill", "Shalom Pizza/Grill"] as const;
const daysOfWeek = [
  { label: "All Sundays", value: 0 },
  { label: "All Mondays", value: 1 },
  { label: "All Tuesdays", value: 2 },
  { label: "All Wednesdays", value: 3 },
  { label: "All Thursdays", value: 4 },
  { label: "All Fridays", value: 5 },
  { label: "All Saturdays", value: 6 },
] as const;

function toHHMM(time: string) {
  return time.substring(0, 5);
}

export default function BulkCreateSchedulePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission loading

  const [form, setForm] = useState({
    employee_name: "",
    store_name: "",
    shift_name: "",
    start_time: "",
    end_time: "",
    dayOfWeek: 1 as (typeof daysOfWeek)[number]["value"],
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const [empRes, shiftRes, unavailRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/shifts"),
          fetch("/api/unavailabilities"),
        ]);
        if (!empRes.ok) throw new Error("Failed to fetch employees");
        if (!shiftRes.ok) throw new Error("Failed to fetch shifts");
        if (!unavailRes.ok) throw new Error("Failed to fetch unavailabilities");

        const [empData, shiftData, unavailData] = await Promise.all([
          empRes.json() as Promise<Employee[]>,
          shiftRes.json() as Promise<Shift[]>,
          unavailRes.json() as Promise<Unavailability[]>,
        ]);
        setEmployees(empData);
        setShifts(shiftData);
        setUnavailabilities(unavailData);
      } catch (err) {
        const e = err as Error;
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value } as typeof prev;
      if (name === "shift_name") {
        const s = shifts.find((sh) => sh.shift_name === value);
        return {
          ...updated,
          start_time: s ? toHHMM(s.start_time) : "",
          end_time: s ? toHHMM(s.end_time) : "",
        };
      }
      return updated;
    });
  }

  // All dates in chosen month for a given weekday
  const targetDates = useMemo(() => {
    const { year, month, dayOfWeek } = form;
  
    const pad = (n: number) => String(n).padStart(2, "0");
    const result: string[] = [];
  
    // Loop through all days of the month and pick those matching the target weekday
    for (let d = 1; d <= 31; d++) {
      const dateObj = new Date(year, month, d, 12, 0, 0); // <-- midday local time
      if (dateObj.getMonth() !== month) break;
      if (dateObj.getDay() === Number(dayOfWeek)) {
        result.push(`${year}-${pad(month + 1)}-${pad(d)}`);
      }
    }
  
    return result;
  }, [form.year, form.month, form.dayOfWeek]);
  


  function isEmployeeUnavailableOn(dateISO: string): string | null {
    const scheduledDate = new Date(dateISO);
    const u = unavailabilities.find((u) => {
      if (u.employee_name !== form.employee_name) return false;
      const start = new Date(u.start_date);
      const end = new Date(u.end_date);
      return scheduledDate >= start && scheduledDate <= end;
    });
    return u ? u.remarks || "Unavailable" : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true); // Set submitting to true
    const errors: { date: string; reason: string }[] = [];
    const successes: string[] = [];

    for (const date of targetDates) {
      const unavailableReason = isEmployeeUnavailableOn(date);
      if (unavailableReason) {
        errors.push({ date, reason: unavailableReason });
        continue;
      }

      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_name: form.employee_name,
          store_name: form.store_name,
          shift_name: form.shift_name,
          start_time: form.start_time,
          end_time: form.end_time,
          schedule_date: date,
        }),
      });

      if (res.ok) {
        successes.push(date);
      } else {
        const data = await res.json().catch(() => ({}));
        errors.push({ date, reason: data.error || "Failed to create schedule" });
      }
    }
    setIsSubmitting(false); // Set submitting to false after loop

    if (errors.length > 0) {
      alert(
        `Completed with warnings.\nCreated: ${successes.length}.\nSkipped: ${errors.length}.\n` +
          errors.map((e) => `${e.date}: ${e.reason}`).join("\n")
      );
    }
    else {
      alert(`Successfully created ${successes.length} schedules.`);
    }
    router.push("/schedules");
  }

  return (
    <div className="container mt-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-black">Add Bulk Schedule</h1>

      {loading ? (
        <p className="text-gray-500">Loading data...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee */}
          <div>
            <label className="block mb-1 font-medium text-black">Employee Name</label>
            <select
              name="employee_name"
              value={form.employee_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded text-black"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.name}>{employee.name}</option>
              ))}
            </select>
          </div>

          {/* Store */}
          <div>
            <label className="block mb-1 font-medium text-black">Store Name</label>
            <select
              name="store_name"
              value={form.store_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded text-black"
              required
            >
              <option value="">Select Store</option>
              {storeNames.map((store) => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>

          {/* Shift */}
          <div>
            <label className="block mb-1 font-medium text-black">Shift Name</label>
            <select
              name="shift_name"
              value={form.shift_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded text-black"
              required
            >
              <option value="">Select Shift</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.shift_name}>{shift.shift_name}</option>
              ))}
            </select>
          </div>

          {/* Times */}
          <div>
            <label className="block mb-1 font-medium text-black">Start Time</label>
            <input type="time" name="start_time" value={form.start_time} onChange={handleChange} className="w-full border px-3 py-2 rounded text-black" required readOnly />
          </div>
          <div>
            <label className="block mb-1 font-medium text-black">End Time</label>
            <input type="time" name="end_time" value={form.end_time} onChange={handleChange} className="w-full border px-3 py-2 rounded text-black" required readOnly />
          </div>

          {/* Day */}
          <div>
            <label className="block mb-1 font-medium text-black">Schedule Day</label>
            <select
              name="dayOfWeek"
              value={form.dayOfWeek}
              onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: Number(e.target.value) as any }))}
              className="w-full border px-3 py-2 rounded text-black"
              required
            >
              {daysOfWeek.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Month & Year */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block mb-1 font-medium text-black">Month</label>
              <select
                name="month"
                value={form.month}
                onChange={(e) => setForm((p) => ({ ...p, month: Number(e.target.value) }))}
                className="w-full border px-3 py-2 rounded text-black"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium text-black">Year</label>
              <input
                type="number"
                name="year"
                value={form.year}
                onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
                className="w-full border px-3 py-2 rounded text-black"
                min="2000"
                max="2100"
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            This will create schedules for all selected weekdays in the chosen month/year.
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-grad-add" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                "Add"
              )}
            </button>
            <button type="button" className="btn-grad" onClick={() => router.push("/schedules")} disabled={isSubmitting}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
