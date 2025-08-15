"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEye } from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";

type Employee = {
  id: number;
  name: string;
  gender: string;
  date_of_birth: string; // ISO date
  position: string;
  email?: string;
  phone?: string;
};

function getAge(dateString: string) {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        const res = await fetch("/api/employees");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch employees");
        }
        const data: Employee[] = await res.json();
        setEmployees(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    const confirmed = confirm("Are you sure you want to delete this employee?");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      const error = err as Error;
      alert("Could not delete: " + (error.message || "unknown error"));
    }
  };

  return (
    <div className="container mt-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Employee Directory</h1>
        <Link
          href="/employees/create"
          className="inline-block bg-[#009a38] hover:bg-[#bfe6cd] text-white px-4 py-2 rounded-lg transition"
        >
          Add New Employee
        </Link>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input
          aria-label="Search employees"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-grow max-w-md placeholder-black text-black"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-[#009999] text-lg font-semibold animate-pulse">Loading Please Wait...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">Error: {error}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#009999] text-white">
              <tr>
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Gender</th>
                <th className="text-left py-3 px-4">Date of Birth</th>
                <th className="text-left py-3 px-4">Age</th>
                <th className="text-left py-3 px-4">Designation</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-[#bfe6cd] transition-colors"
                >
                  <td className="py-3 px-4 text-black">{employee.id}</td>
                  <td className="py-3 px-4 font-medium text-black">{employee.name}</td>
                  <td className="py-3 px-4 text-black">{employee.gender}</td>
                  <td className="py-3 px-4 text-black">{formatDate(employee.date_of_birth)}</td>
                  <td className="py-3 px-4 text-black">
                    {getAge(employee.date_of_birth)}
                  </td>
                  <td className="py-3 px-4 text-black">{employee.position}</td>
                  <td className="py-3 px-4 text-black">{employee.email ?? "—"}</td>
                  <td className="py-3 px-4 text-black">{employee.phone ?? "—"}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <Link
                      href={`/employees/${employee.id}`}
                      className="px-2 py-1 rounded text-sm transition flex items-center justify-center text-[#009999] hover:opacity-80"
                      aria-label={`View ${employee.name}`}
                    >
                      <FaEye size={16} />
                    </Link>
                    <Link
                      href={`/employees/${employee.id}/edit`}
                      className="px-2 py-1 rounded text-sm transition flex items-center justify-center text-[#ec6602] hover:opacity-80"
                      aria-label={`Edit ${employee.name}`}
                    >
                      <MdEdit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="text-[#7a162d] px-2 py-1 rounded text-sm transition flex items-center justify-center hover:opacity-80"
                      aria-label={`Delete ${employee.name}`}
                    >
                      <MdDelete size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 px-4 text-center text-gray-500"
                  >
                    No employees match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 text-center">
        {!loading && !error && (
          <p className="text-gray-600">
            Showing {filtered.length} of {employees.length} employees
          </p>
        )}
      </div>
    </div>
  );
}
