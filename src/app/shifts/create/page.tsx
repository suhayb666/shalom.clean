"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateShiftPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    shift_name: "",
    start_time: "",
    end_time: "",
    remarks: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create shift");
      }

      router.push("/shifts");
  } catch (err) {
      const error = err as Error;
      alert("Error creating shift: " + (error.message || "Unknown error"));
    }
  }

  return (
    <div className="container mt-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-black">Add New Shift</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-black">Shift Name</label>
          <input
            name="shift_name"
            value={form.shift_name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black placeholder-black"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Start Time</label>
          <input
            type="time"
            name="start_time"
            value={form.start_time}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">End Time</label>
          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Remarks</label>
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            rows={4}
            className="w-full border px-3 py-2 rounded text-black placeholder-black"
          ></textarea>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-grad-add flex items-center justify-center">
            Add
          </button>
          <button
            type="button"
            className="btn-grad flex items-center justify-center"
            onClick={() => router.push("/shifts")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}