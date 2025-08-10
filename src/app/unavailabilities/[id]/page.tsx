"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

export default function ViewUnavailabilityPage() {
  const params = useParams();
  const id = parseInt(params.id as string);

  const [unavailability, setUnavailability] = useState<Unavailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUnavailability() {
      try {
        setLoading(true);
        const res = await fetch(`/api/unavailabilities/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch unavailability details");
        }
        const data: Unavailability = await res.json();
        setUnavailability(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Unknown error fetching unavailability details");
      } finally {
        setLoading(false);
      }
    }
    fetchUnavailability();
  }, [id]);

  if (loading) {
    return <div className="container mt-5 max-w-lg mx-auto p-6 text-center text-black">Loading unavailability details...</div>;
  }

  if (error || !unavailability) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto text-black">
        <div className="text-center py-10">
          <h2 className="text-xl font-bold text-[#7a162d]">Error Loading Unavailability</h2>
          <p className="mt-2 text-red-600">{error || "Unavailability record not found."}</p>
          <Link 
            href="/unavailabilities" 
            className="mt-4 inline-block bg-[#009999] hover:bg-[#008080] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Unavailabilities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-black mb-6">Unavailability Details: {unavailability.employee_name}</h1>
      
      <div className="space-y-4 text-black">
        <p><span className="font-medium">Employee Name:</span> {unavailability.employee_name}</p>
        <p><span className="font-medium">Start Date:</span> {formatDate(unavailability.start_date)}</p>
        <p><span className="font-medium">End Date:</span> {formatDate(unavailability.end_date)}</p>
        <p><span className="font-medium">Number of Days:</span> {getNumberOfDays(unavailability.start_date, unavailability.end_date)}</p>
        <p><span className="font-medium">Remarks:</span> {unavailability.remarks}</p>
      </div>

      <div className="mt-6 flex gap-2">
        <Link
          href={`/unavailabilities/${unavailability.id}/edit`}
          className="bg-[#ec6602] hover:bg-[#d45c02] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <i className="icon icon-edit"></i>
        </Link>
        <Link
          href="/unavailabilities"
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <i className="icon icon-show"></i>
        </Link>
      </div>
    </div>
  );
}