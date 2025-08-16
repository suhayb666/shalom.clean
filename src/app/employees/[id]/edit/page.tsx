"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    gender: "",
    date_of_birth: "",
    age: "",
    designation: "",
    email: "",
    phone: ""
  });

  // Fetch existing employee data
  useEffect(() => {
    async function fetchEmployee() {
      try {
        const res = await fetch(`/api/employees/${id}`);
        if (!res.ok) throw new Error("Failed to fetch employee");
        const data = await res.json();
        setForm({
          name: data.name || "",
          gender: data.gender || "",
          date_of_birth: data.date_of_birth || "",
          age: data.age?.toString() || "",
          designation: data.designation || "",
          email: data.email || "",
          phone: data.phone || ""
        });
        setLoading(false);
      } catch (error) {
        console.error(error);
        alert(`Failed to fetch employee (id: ${id})`);
      }
    }
    if (id) fetchEmployee();
  }, [id]);

  // Function to calculate age from DOB
  function calculateAge(dob: string) {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;

    if (name === "date_of_birth") {
      setForm({
        ...form,
        date_of_birth: value,
        age: calculateAge(value)
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Failed to update employee");
      alert("Employee updated successfully!");
      router.push("/employees");
    } catch (error) {
      console.error(error);
      alert("Error updating employee");
    }
  }

  if (loading) return <p className="text-black">Loading...</p>;

  return (
    <div className="container mt-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-black">Edit Employee</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-black">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
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
            <option value="">Select gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
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
        <div>
          <label className="block mb-1 font-medium text-black">Age</label>
          <input
            type="number"
            name="age"
            value={form.age}
            readOnly
            className="w-full border px-3 py-2 rounded text-black bg-gray-100"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Designation</label>
          <input
            name="designation"
            value={form.designation}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Phone</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-grad-add flex items-center justify-center">
            Save
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
