"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OpenShift = {
  id: number;
  store_name: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  schedule_date: string;
  assigned_employee_name?: string; // Will be null for open shifts, but useful for admin view
};

export default function OpenShiftsPage() {
  const [openShifts, setOpenShifts] = useState<OpenShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingShiftId, setSubmittingShiftId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchOpenShifts() {
      try {
        setLoading(true);
        const res = await fetch("/api/open-shifts");
        if (!res.ok) {
          throw new Error(`Failed to fetch open shifts: ${res.statusText}`);
        }
        const data: OpenShift[] = await res.json();
        setOpenShifts(data);
      } catch (err) {
        setError((err as Error).message || "Unknown error fetching open shifts.");
      } finally {
        setLoading(false);
      }
    }
    fetchOpenShifts();
  }, []);

  async function handleRequestToFill(shiftId: number) {
    setSubmittingShiftId(shiftId);
    try {
      const res = await fetch(`/api/open-shifts/${shiftId}/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to request shift ${shiftId}.`);
      }

      alert("Shift request submitted successfully!");
      // Refresh the list of open shifts
      setOpenShifts((prev) => prev.filter((shift) => shift.id !== shiftId));
    } catch (err) {
      alert((err as Error).message);
      setError((err as Error).message);
    } finally {
      setSubmittingShiftId(null);
    }
  }

  if (loading) {
    return <div className="p-6">Loading open shifts...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Open Shifts</h1>

      {openShifts.length === 0 ? (
        <p className="text-gray-600">No open shifts available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {openShifts.map((shift) => (
            <div key={shift.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <h2 className="text-lg font-semibold text-black">{shift.shift_name} at {shift.store_name}</h2>
              <p className="text-gray-700">Date: {new Date(shift.schedule_date).toLocaleDateString()}</p>
              <p className="text-gray-700">Time: {shift.start_time} - {shift.end_time}</p>
              <button
                onClick={() => handleRequestToFill(shift.id)}
                disabled={submittingShiftId === shift.id}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingShiftId === shift.id ? "Requesting..." : "Request to Fill"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
