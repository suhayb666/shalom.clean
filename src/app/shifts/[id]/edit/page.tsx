"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Shift = {
  id: number;
  shift_name: string;
  start_time: string; // HH:MM:SS format
  end_time: string;   // HH:MM:SS format
  remarks: string;
};

export default function EditShiftPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  
  const [form, setForm] = useState<Shift | null>(null);
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
        setForm(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Unknown error fetching shift details");
      } finally {
        setLoading(false);
      }
    }
    fetchShift();
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    if (form) {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update shift");
      }

      router.push("/shifts");
    } catch (err) {
      const error = err as Error;
      alert("Error updating shift: " + (error.message || "Unknown error"));
    }
  }

  if (loading) {
    return <div className="container mt-5 max-w-lg mx-auto p-6 text-center text-black">Loading shift details...</div>;
  }

  if (error || !form) {
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
      <h1 className="text-2xl font-bold text-black mb-6">Edit Shift: {form.shift_name}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium text-black">Shift Name</label>
            <input
              name="shift_name"
              value={form.shift_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black placeholder-black"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Start Time</label>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">End Time</label>
            <input
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black placeholder-black"
            ></textarea>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            className="bg-[#ec6602] hover:bg-[#d45c02] text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            Update Shift
          </button>
          <button
            type="button"
            className="btn-grad"
            onClick={() => router.push("/shifts")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}