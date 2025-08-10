"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Shift = {
  id: number;
  shift_name: string;
  start_time: string; // HH:MM:SS format
  end_time: string;   // HH:MM:SS format
  remarks: string;
};

export default function ViewShiftPage() {
  const params = useParams();
  const id = parseInt(params.id as string);

  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShift() {
      try {
        setLoading(true);
        const res = await fetch(`/api/shifts/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch shift details");
        }
        const data: Shift = await res.json();
        setShift(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Unknown error fetching shift details");
      } finally {
        setLoading(false);
      }
    }
    fetchShift();
  }, [id]);

  if (loading) {
    return <div className="container mt-5 max-w-lg mx-auto p-6 text-center text-black">Loading shift details...</div>;
  }

  if (error || !shift) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto text-black">
        <div className="text-center py-10">
          <h2 className="text-xl font-bold text-[#7a162d]">Error Loading Shift</h2>
          <p className="mt-2 text-red-600">{error || "Shift record not found."}</p>
          <Link 
            href="/shifts" 
            className="mt-4 inline-block bg-[#009999] hover:bg-[#008080] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <i className="icon icon-show"></i> Back to Shifts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-black mb-6">Shift Details: {shift.shift_name}</h1>
      
      <div className="space-y-4 text-black">
        <p><span className="font-medium">Shift Name:</span> {shift.shift_name}</p>
        <p><span className="font-medium">Start Time:</span> {shift.start_time.substring(0, 5)}</p>
        <p><span className="font-medium">End Time:</span> {shift.end_time.substring(0, 5)}</p>
        <p><span className="font-medium">Remarks:</span> {shift.remarks}</p>
      </div>

      <div className="mt-6 flex gap-2">
        <Link
          href={`/shifts/${shift.id}/edit`}
          className="bg-[#ec6602] hover:bg-[#d45c02] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <i className="icon icon-edit"></i> Edit Shift
        </Link>
        <Link
          href="/shifts"
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <i className="icon icon-show"></i> Back to List
        </Link>
      </div>
    </div>
  );
}