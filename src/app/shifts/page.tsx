"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEye } from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";

type Shift = {
  id: number;
  shift_name: string;
  start_time: string; // HH:MM:SS format
  end_time: string;   // HH:MM:SS format
  remarks: string;
};

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchShifts() {
      try {
        setLoading(true);
        const res = await fetch("/api/shifts");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch shifts");
        }
        const data: Shift[] = await res.json();
        setShifts(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchShifts();
  }, []);

  const filtered = shifts.filter((s) =>
    s.shift_name.toLowerCase().includes(search.toLowerCase()) ||
    s.remarks.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    const confirmed = confirm("Are you sure you want to delete this shift record?");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/shifts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      const error = err as Error;
      alert("Could not delete: " + (error.message || "unknown error"));
    }
  };

  return (
    <div className="container mt-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Shifts</h1>
        <Link
          href="/shifts/create"
          className="inline-block bg-[#009a38] hover:bg-[#00882f] text-white px-4 py-2 rounded-lg transition"
        >
          Add New Shift
        </Link>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input
          aria-label="Search shifts"
          placeholder="Search by shift name or remarks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-grow max-w-md placeholder-black text-black"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">Loading shifts...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">Error: {error}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#009999] text-white">
              <tr>
                <th className="text-left py-3 px-4">Sr. No.</th>
                <th className="text-left py-3 px-4">Shift Name</th>
                <th className="text-left py-3 px-4">Start Time</th>
                <th className="text-left py-3 px-4">End Time</th>
                <th className="text-left py-3 px-4">Remarks</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((shift, index) => (
                <tr
                  key={shift.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-black">{index + 1}</td>
                  <td className="py-3 px-4 font-medium text-black">{shift.shift_name}</td>
                  <td className="py-3 px-4 text-black">{shift.start_time.substring(0, 5)}</td>
                  <td className="py-3 px-4 text-black">{shift.end_time.substring(0, 5)}</td>
                  <td className="py-3 px-4 text-black">{shift.remarks}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <Link href={`/shifts/${shift.id}`} className="px-2 py-1 rounded text-sm transition flex items-center justify-center text-[#009999] hover:opacity-80" aria-label={`View ${shift.shift_name}`}>
                      <FaEye size={16} />
                    </Link>
                    <Link href={`/shifts/${shift.id}/edit`} className="px-2 py-1 rounded text-sm transition flex items-center justify-center text-[#ec6602] hover:opacity-80" aria-label={`Edit ${shift.shift_name}`}>
                      <MdEdit size={16} />
                    </Link>
                    <button onClick={() => handleDelete(shift.id)} className="text-[#7a162d] px-2 py-1 rounded text-sm transition flex items-center justify-center hover:opacity-80" aria-label={`Delete ${shift.shift_name}`}>
                      <MdDelete size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 px-4 text-center text-gray-500"
                  >
                    No shift records match your search.
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
            Showing {filtered.length} of {shifts.length} shift records
          </p>
        )}
      </div>
    </div>
  );
}