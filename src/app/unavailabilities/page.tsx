"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEye } from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";

type Unavailability = {
  id: number;
  employee_name: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  remarks: string;
};

function getNumberOfDays(startDateString: string, endDateString: string): number {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

export default function UnavailabilitiesPage() {
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchUnavailabilities() {
      try {
        setLoading(true);
        const res = await fetch("/api/unavailabilities");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch unavailabilities");
        }
        const data: Unavailability[] = await res.json();
        setUnavailabilities(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchUnavailabilities();
  }, []);

  const filtered = unavailabilities.filter((u) =>
    u.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    u.remarks.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    const confirmed = confirm("Are you sure you want to delete this unavailability record?");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/unavailabilities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setUnavailabilities((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      const error = err as Error;
      alert("Could not delete: " + (error.message || "unknown error"));
    }
  };

  return (
    <div className="container mt-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Unavailabilities</h1>
        <Link
          href="/unavailabilities/create"
          className="inline-block bg-[#009a38] hover:bg-[#00882f] text-white px-4 py-2 rounded-lg transition"
        >
          Add New Unavailability
        </Link>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input
          aria-label="Search unavailabilities"
          placeholder="Search by employee name or remarks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-grow max-w-md placeholder-black text-black"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-[#f43f5e] text-lg font-semibold animate-pulse">Loading Please Wait...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">Error: {error}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#f43f5e] text-white">
              <tr>
                <th className="text-left py-3 px-4">Sr. No.</th>
                <th className="text-left py-3 px-4">Employee Name</th>
                <th className="text-left py-3 px-4">Start Date</th>
                <th className="text-left py-3 px-4">End Date</th>
                <th className="text-left py-3 px-4">Number of Days</th>
                <th className="text-left py-3 px-4">Remarks</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((unavailability, index) => (
                <tr
                  key={unavailability.id}
                  className="hover:bg-[#fecdd3] transition-colors"
                >
                  <td className="py-3 px-4 text-black">{index + 1}</td>
                  <td className="py-3 px-4 font-medium text-black">{unavailability.employee_name}</td>
                  <td className="py-3 px-4 text-black">{formatDate(unavailability.start_date)}</td>
                  <td className="py-3 px-4 text-black">{formatDate(unavailability.end_date)}</td>
                  <td className="py-3 px-4 text-black">{getNumberOfDays(unavailability.start_date, unavailability.end_date)}</td>
                  <td className="py-3 px-4 text-black">{unavailability.remarks}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <Link
                      href={`/unavailabilities/${unavailability.id}`}
                      className="px-2 py-1 rounded text-sm transition flex items-center justify-center text-[#009999] hover:opacity-80"
                      aria-label={`View ${unavailability.employee_name}'s unavailability`}
                    >
                      <FaEye size={16} />
                    </Link>
                    <Link
                      href={`/unavailabilities/${unavailability.id}/edit`}
                      className="px-2 py-1 rounded text-sm transition flex items-center justify-center text-[#ec6602] hover:opacity-80"
                      aria-label={`Edit ${unavailability.employee_name}'s unavailability`}
                    >
                      <MdEdit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(unavailability.id)}
                      className="text-[#7a162d] px-2 py-1 rounded text-sm transition flex items-center justify-center hover:opacity-80"
                      aria-label={`Delete ${unavailability.employee_name}'s unavailability`}
                    >
                      <MdDelete size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 px-4 text-center text-gray-500"
                  >
                    No unavailability records match your search.
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
            Showing {filtered.length} of {unavailabilities.length} unavailability records
          </p>
        )}
      </div>
    </div>
  );
}