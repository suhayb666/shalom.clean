"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    gender: "",
    date_of_birth: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Replace with API call to create employee
    alert("Employee created!\n" + JSON.stringify(form, null, 2));
    router.push("/employees");
  }

  return (
    <div className="container mt-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-black">Add New Employee</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-black">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black placeholder-black"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
            required
          >
            <option value="" className="text-gray-500">Select gender</option>
            <option className="text-black">Male</option>
            <option className="text-black">Female</option>
            <option className="text-black">Other</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            value={form.date_of_birth}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
            required
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-grad-add flex items-center justify-center">
            Add
          </button>
          <button
            type="button"
            className="btn-grad"
            onClick={() => router.push("/employees")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}