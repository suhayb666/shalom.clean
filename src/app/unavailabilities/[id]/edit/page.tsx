"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Unavailability = {
  id: number;
  employee_name: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  remarks: string;
};

type Employee = {
  id: number;
  name: string;
};

export default function EditUnavailabilityPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  
  const [form, setForm] = useState<Unavailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [errorEmployees, setErrorEmployees] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUnavailability() {
      try {
        setLoading(true);
        const res = await fetch(`/api/unavailabilities/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch unavailability");
        }
        const data: Unavailability = await res.json();
        setForm({
          ...data,
          start_date: data.start_date.split('T')[0], // Format date for input type="date"
          end_date: data.end_date.split('T')[0],   // Format date for input type="date"
        });
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Unknown error fetching unavailability");
      } finally {
        setLoading(false);
      }
    }

    async function fetchEmployees() {
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
    }
    
    fetchUnavailability();
    fetchEmployees();
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
      const res = await fetch(`/api/unavailabilities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update unavailability");
      }

      router.push("/unavailabilities");
    } catch (err) {
      const error = err as Error;
      alert("Error updating unavailability: " + (error.message || "Unknown error"));
    }
  }

  if (loading || loadingEmployees) {
    return <div className="container mt-5 max-w-lg mx-auto p-6 text-center text-black">Loading unavailability details...</div>;
  }

  if (error || errorEmployees || !form) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto text-black">
        <div className="text-center py-10">
          <h2 className="text-xl font-bold text-[#7a162d]">Error Loading Unavailability</h2>
          <p className="mt-2 text-red-600">{error || errorEmployees}</p>
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
      <h1 className="text-2xl font-bold text-black mb-6">Edit Unavailability: {form.employee_name}</h1>
      
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
            <label className="block mb-2 font-medium text-black">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">End Date</label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
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
            Update Unavailability
          </button>
          <button
            type="button"
            className="btn-grad"
            onClick={() => router.push("/unavailabilities")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}