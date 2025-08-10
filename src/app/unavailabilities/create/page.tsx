"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Employee = {
  id: number;
  name: string;
};

export default function CreateUnavailabilityPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    employee_name: "",
    start_date: "",
    end_date: "",
    remarks: "",
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [errorEmployees, setErrorEmployees] = useState<string | null>(null);

  useEffect(() => {
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
    fetchEmployees();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/unavailabilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create unavailability");
      }

      router.push("/unavailabilities");
    } catch (err) {
      const error = err as Error;
      alert("Error creating unavailability: " + (error.message || "Unknown error"));
    }
  }

  return (
    <div className="container mt-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-black">Add New Unavailability</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-black">Employee Name</label>
          {loadingEmployees ? (
            <p className="text-gray-500">Loading employees...</p>
          ) : errorEmployees ? (
            <p className="text-red-600">Error: {errorEmployees}</p>
          ) : (
            <select
              name="employee_name"
              value={form.employee_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded text-black"
              required
            >
              <option value="" className="text-gray-500">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.name} className="text-black">
                  {employee.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">End Date</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
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
            onClick={() => router.push("/unavailabilities")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}