"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Schedule = {
  id: number;
  employee_name: string;
  store_name: string;
  shift_name: string;
  start_time: string; // HH:MM:SS format
  end_time: string;   // HH:MM:SS format
  schedule_date: string; // YYYY-MM-DD format
};

type Employee = {
  id: number;
  name: string;
};

type Shift = {
  id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
};

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  
  const [form, setForm] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [errorEmployees, setErrorEmployees] = useState<string | null>(null);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [errorShifts, setErrorShifts] = useState<string | null>(null);

  const storeNames = ["Shalom Pizza", "Shalom Grill", "Shalom Pizza/Grill"];

  useEffect(() => {
    async function fetchData() {
      // Fetch current Schedule
      try {
        setLoading(true);
        const res = await fetch(`/api/schedules/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch schedule details");
        }
        const data: Schedule = await res.json();
        setForm({
          ...data,
          schedule_date: data.schedule_date ? data.schedule_date.split('T')[0] : '', // Format date for input type="date", handle null
        });
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Unknown error fetching schedule details");
      } finally {
        setLoading(false);
      }

      // Fetch Employees
      try {
        setLoadingEmployees(true);
        const res = await fetch("/api/employees");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch employees");
        }
        const data: Employee[] = await res.json();
        setEmployees(data);
      } catch (err) {
        const error = err as Error;
        setErrorEmployees(error.message || "Unknown error fetching employees");
      } finally {
        setLoadingEmployees(false);
      }

      // Fetch Shifts
      try {
        setLoadingShifts(true);
        const res = await fetch("/api/shifts");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch shifts");
        }
        const data: Shift[] = await res.json();
        setShifts(data);
      } catch (err) {
        const error = err as Error;
        setErrorShifts(error.message || "Unknown error fetching shifts");
      } finally {
        setLoadingShifts(false);
      }
    }
    fetchData();
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    if (form) {
      setForm((prevForm) => {
        if (!prevForm) return prevForm;
        let updated: Schedule = { ...(prevForm as Schedule), [name]: value } as Schedule;
        if (name === "shift_name") {
          const selectedShift = shifts.find(shift => shift.shift_name === value);
          updated = {
            ...updated,
            start_time: selectedShift ? selectedShift.start_time.substring(0, 5) : "",
            end_time: selectedShift ? selectedShift.end_time.substring(0, 5) : "",
          };
        }
        return updated;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update schedule");
      }

      router.push("/schedules");
    } catch (err) {
      const error = err as Error;
      alert("Error updating schedule: " + (error.message || "Unknown error"));
    }
  }

  if (loading || loadingEmployees || loadingShifts) {
    return <div className="container mt-5 max-w-lg mx-auto p-6 text-center text-black">Loading schedule details...</div>;
  }

  if (error || errorEmployees || errorShifts || !form) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto text-black">
        <div className="text-center py-10">
          <h2 className="text-xl font-bold text-[#7a162d]">Error Loading Schedule</h2>
          <p className="mt-2 text-red-600">{error || errorEmployees || errorShifts || "Schedule record not found."}</p>
          <Link 
            href="/schedules" 
            className="mt-4 inline-block bg-[#009999] hover:bg-[#008080] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <i className="icon icon-show"></i> Back to Schedules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-black mb-6">Edit Schedule for: {form.employee_name}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium text-black">Employee Name</label>
            <select
              name="employee_name"
              value={form.employee_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.name} className="text-black">
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Store Name</label>
            <select
              name="store_name"
              value={form.store_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
            >
              {storeNames.map((store) => (
                <option key={store} value={store} className="text-black">
                  {store}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Shift Name</label>
            <select
              name="shift_name"
              value={form.shift_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
            >
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.shift_name} className="text-black">
                  {shift.shift_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Schedule Date</label>
            <input
              type="date"
              name="schedule_date"
              value={form.schedule_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Start Time</label>
            <input
              type="time"
              name="start_time"
              value={form.start_time.substring(0, 5)}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
              readOnly
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">End Time</label>
            <input
              type="time"
              name="end_time"
              value={form.end_time.substring(0, 5)}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
              readOnly
            />
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            className="bg-[#ec6602] hover:bg-[#d45c02] text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            Update Schedule
          </button>
          <button
            type="button"
            className="btn-grad"
            onClick={() => router.push("/schedules")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
