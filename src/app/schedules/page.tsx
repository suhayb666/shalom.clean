"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEye } from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";

type Schedule = {
  id: number;
  employee_name: string | null;
  store_name: string;
  shift_name: string;
  start_time: string; // HH:MM:SS format
  end_time: string;   // HH:MM:SS format
  schedule_date: string; // YYYY-MM-DD format
};

function formatDate(dateString: string) {
  // Avoid timezone shifts by formatting the raw string
  const raw = String(dateString);
  const base = raw.includes('T') ? raw.slice(0, 10) : raw;
  const parts = base.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    // YYYY-MM-DD → MM-DD-YYYY
    const [yyyy, mm, dd] = parts;
    return `${mm.padStart(2, '0')}-${dd.padStart(2, '0')}-${yyyy}`;
  }
  if (parts.length === 3 && parts[2].length === 4) {
    // MM-DD-YYYY already
    const [mm, dd, yyyy] = parts;
    return `${mm.padStart(2, '0')}-${dd.padStart(2, '0')}-${yyyy}`;
  }
  return base;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    async function fetchSchedules() {
      try {
        setLoading(true);
        const res = await fetch("/api/schedules");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch schedules");
        }
        const data: Schedule[] = await res.json();
        setSchedules(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, []);

  function toISODate(d: string): string {
    const raw = String(d);
    if (raw.includes("T")) return raw.slice(0, 10);
    const parts = raw.split("-");
    if (parts.length === 3 && parts[2].length === 4) {
      // MM-DD-YYYY → YYYY-MM-DD
      const [mm, dd, yyyy] = parts;
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return raw; // assume YYYY-MM-DD
  }

  const filtered = schedules.filter((s) => {
    const matchesSearch = (
      s.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.store_name.toLowerCase().includes(search.toLowerCase()) ||
      s.shift_name.toLowerCase().includes(search.toLowerCase())
    );
    if (!filterDate) return matchesSearch;
    // Compare normalized dates exactly (no timezone shenanigans)
    return toISODate(s.schedule_date) === filterDate;
  });

  const handleDelete = async (id: number) => {
    const confirmed = confirm("Are you sure you want to delete this schedule record?");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      const error = err as Error;
      alert("Could not delete: " + (error.message || "unknown error"));
    }
  };

  return (
    <div className="container mt-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Schedules</h1>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <Link
            href="/schedules/create"
            className="inline-block bg-[#009a38] hover:bg-[#00882f] text-white px-4 py-2 rounded-lg transition text-center"
          >
            Add New Schedule
          </Link>
          <Link
            href="/schedules/bulk-create"
            className="inline-block bg-[#009a38] hover:bg-[#00882f] text-white px-4 py-2 rounded-lg transition text-center"
          >
            Add Bulk Schedule
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <input
          aria-label="Search schedules"
          placeholder="Search by employee, store, or shift..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-grow max-w-md placeholder-black text-black"
        />
          <input
          type="date"
          aria-label="Filter by date"
          value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          className="border rounded px-3 py-2 text-black"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-[#009999] text-lg font-semibold animate-pulse">Loading Please Wait...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">Error: {error}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#009999] text-white">
              <tr>
                <th className="text-left py-3 px-4">Sr. No.</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Employee Name</th>
                <th className="text-left py-3 px-4">Store Name</th>
                <th className="text-left py-3 px-4">Shift Name</th>
                <th className="text-left py-3 px-4">Start Time</th>
                <th className="text-left py-3 px-4">End Time</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((schedule, index) => (
                <tr
                  key={schedule.id}
                  className="hover:bg-[#bfe6cd] transition-colors"

                >
                  <td className="py-3 px-4 text-black">{index + 1}</td>
                  <td className="py-3 px-4 text-black">{formatDate(schedule.schedule_date)}</td>
                  <td className="py-3 px-4 font-medium text-black">{schedule.employee_name || "Open Shift"}</td>
                  <td className="py-3 px-4 text-black">{schedule.store_name}</td>
                  <td className="py-3 px-4 text-black">{schedule.shift_name}</td>
                  <td className="py-3 px-4 text-black">{schedule.start_time.substring(0, 5)}</td> {/* Display HH:MM */}
                  <td className="py-3 px-4 text-black">{schedule.end_time.substring(0, 5)}</td>   {/* Display HH:MM */}
                  <td className="py-3 px-4 flex gap-2">
                    <Link
                      href={`/schedules/${schedule.id}`}
                      className="px-2 py-1 rounded text-sm transition flex items-center justify-center text-[#009999] hover:opacity-80"
                      aria-label={`View ${schedule.employee_name || "Open Shift"}'s schedule`}
                    >
                      <FaEye size={16} />
                    </Link>
                    <Link
                      href={`/schedules/${schedule.id}/edit`}
                      className="px-2 py-1 rounded text-sm transition flex items-center justify-center text-[#ec6602] hover:opacity-80"
                      aria-label={`Edit ${schedule.employee_name || "Open Shift"}'s schedule`}
                    >
                      <MdEdit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="text-[#7a162d] px-2 py-1 rounded text-sm transition flex items-center justify-center hover:opacity-80"
                      aria-label={`Delete ${schedule.employee_name || "Open Shift"}'s schedule`}
                    >
                      <MdDelete size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 px-4 text-center text-gray-500"
                  >
                    No schedule records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 text-center">
        {!loading && !error && (
          <p className="text-gray-600">
            Showing {filtered.length} of {schedules.length} schedule records
          </p>
        )}
      </div>
    </div>
  );
}
