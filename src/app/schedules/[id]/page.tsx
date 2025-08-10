"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

export default function ViewSchedulePage() {
  const params = useParams();
  const id = parseInt(params.id as string);

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        setLoading(true);
        const res = await fetch(`/api/schedules/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch schedule details");
        }
        const data: Schedule = await res.json();
        setSchedule(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Unknown error fetching schedule details");
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, [id]);

  if (loading) {
    return <div className="container mt-5 max-w-lg mx-auto p-6 text-center text-black">Loading schedule details...</div>;
  }

  if (error || !schedule) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto text-black">
        <div className="text-center py-10">
          <h2 className="text-xl font-bold text-[#7a162d]">Error Loading Schedule</h2>
          <p className="mt-2 text-red-600">{error || "Schedule record not found."}</p>
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
      <h1 className="text-2xl font-bold text-black mb-6">Schedule Details: {schedule.employee_name} ({schedule.store_name})</h1>
      
      <div className="space-y-4 text-black">
        <p><span className="font-medium">Employee Name:</span> {schedule.employee_name}</p>
        <p><span className="font-medium">Store Name:</span> {schedule.store_name}</p>
        <p><span className="font-medium">Shift Name:</span> {schedule.shift_name}</p>
        <p><span className="font-medium">Start Time:</span> {schedule.start_time.substring(0, 5)}</p>
        <p><span className="font-medium">End Time:</span> {schedule.end_time.substring(0, 5)}</p>
        <p><span className="font-medium">Schedule Date:</span> {formatDate(schedule.schedule_date)}</p>
      </div>

      <div className="mt-6 flex gap-2">
        <Link
          href={`/schedules/${schedule.id}/edit`}
          className="bg-[#ec6602] hover:bg-[#d45c02] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <i className="icon icon-edit"></i> Edit Schedule
        </Link>
        <Link
          href="/schedules"
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <i className="icon icon-show"></i> Back to List
        </Link>
      </div>
    </div>
  );
}
