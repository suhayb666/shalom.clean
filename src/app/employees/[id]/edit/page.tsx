"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// Mock employee data with all names
const mockEmployees = [
  { id: 1, name: "Aaron Silverstein", gender: "Male", date_of_birth: "1985-04-12", email: "aaron@company.com", phone: "+1 (555) 123-4567", position: "Project Manager", hire_date: "2018-05-15", status: "Active" },
  { id: 2, name: "Chris Cruz", gender: "Male", date_of_birth: "1990-07-23", email: "chris@company.com", phone: "+1 (555) 234-5678", position: "UX Designer", hire_date: "2020-02-10", status: "Active" },
  { id: 3, name: "Daniel Shachar", gender: "Male", date_of_birth: "1988-11-02", email: "daniel@company.com", phone: "+1 (555) 345-6789", position: "Software Engineer", hire_date: "2019-08-22", status: "Active" },
  { id: 4, name: "Eitan Jalali", gender: "Male", date_of_birth: "1992-01-15", email: "eitan@company.com", phone: "+1 (555) 456-7890", position: "Data Analyst", hire_date: "2021-03-05", status: "Active" },
  { id: 5, name: "Elie Noorani", gender: "Male", date_of_birth: "1993-03-20", email: "elie@company.com", phone: "+1 (555) 567-8901", position: "Marketing Specialist", hire_date: "2020-11-30", status: "Active" },
  { id: 6, name: "Etai Schachar", gender: "Male", date_of_birth: "1991-09-08", email: "etai@company.com", phone: "+1 (555) 678-9012", position: "Product Owner", hire_date: "2019-01-14", status: "Active" },
  { id: 7, name: "Jay Summers", gender: "Male", date_of_birth: "1987-12-30", email: "jay@company.com", phone: "+1 (555) 789-0123", position: "Senior Developer", hire_date: "2017-06-18", status: "Active" },
  { id: 8, name: "Joseph Sarir", gender: "Male", date_of_birth: "1989-06-17", email: "joseph@company.com", phone: "+1 (555) 890-1234", position: "DevOps Engineer", hire_date: "2022-04-25", status: "Active" },
  { id: 9, name: "Moshe Shaoulian", gender: "Male", date_of_birth: "1984-05-19", email: "moshe@company.com", phone: "+1 (555) 901-2345", position: "CTO", hire_date: "2015-09-12", status: "Active" },
  { id: 10, name: "Ronell Zahir", gender: "Male", date_of_birth: "1994-08-25", email: "ronell@company.com", phone: "+1 (555) 012-3456", position: "Junior Developer", hire_date: "2023-01-08", status: "Active" },
  { id: 11, name: "Simcha Mahfouda", gender: "Male", date_of_birth: "1986-02-14", email: "simcha@company.com", phone: "+1 (555) 123-4560", position: "QA Engineer", hire_date: "2018-07-19", status: "Active" },
  { id: 12, name: "Yehuda Beck", gender: "Male", date_of_birth: "1995-10-10", email: "yehuda@company.com", phone: "+1 (555) 234-5670", position: "UI Designer", hire_date: "2021-09-03", status: "Active" },
  { id: 13, name: "Yoni Miretsky", gender: "Male", date_of_birth: "1996-12-05", email: "yoni@company.com", phone: "+1 (555) 345-6780", position: "Frontend Developer", hire_date: "2022-08-15", status: "Active" },
  { id: 14, name: "Zev Rothenberg", gender: "Male", date_of_birth: "1983-07-22", email: "zev@company.com", phone: "+1 (555) 456-7890", position: "System Architect", hire_date: "2016-11-27", status: "Active" }
];

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  // Find employee by ID
  const employee = mockEmployees.find(emp => emp.id === id);

  // Hooks must be called unconditionally
  const [form, setForm] = useState({
    name: employee?.name ?? "",
    gender: employee?.gender ?? "",
    date_of_birth: employee?.date_of_birth ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    position: employee?.position ?? "",
    status: employee?.status ?? "Active",
  });

  if (!employee) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
        <div className="text-center py-10">
          <h2 className="text-xl font-bold text-[#7a162d]">Employee Not Found</h2>
          <p className="mt-2 text-gray-600">No employee found with ID: {id}</p>
          <Link 
            href="/employees" 
            className="mt-4 inline-block bg-[#009999] hover:bg-[#008080] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Employees
          </Link>
        </div>
      </div>
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Replace with API call to update employee
    alert("Employee updated!\n" + JSON.stringify(form, null, 2));
    router.push(`/employees/${id}`);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-black mb-6">Edit Employee: {employee.name}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium text-black">Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black placeholder-black"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
            >
              <option value="Male" className="text-black">Male</option>
              <option value="Female" className="text-black">Female</option>
              <option value="Other" className="text-black">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Position</label>
            <input
              name="position"
              value={form.position}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black placeholder-black"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black placeholder-black"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black placeholder-black"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium text-black">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ec6602] text-black"
              required
            >
              <option value="Active" className="text-black">Active</option>
              <option value="On Leave" className="text-black">On Leave</option>
              <option value="Terminated" className="text-black">Terminated</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            className="bg-[#ec6602] hover:bg-[#d45c02] text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            Update Employee
          </button>
          <button
            type="button"
            className="btn-grad"
            onClick={() => router.push(`/employees/${id}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}