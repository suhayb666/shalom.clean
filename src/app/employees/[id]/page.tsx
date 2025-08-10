"use client";
import Link from "next/link";
import { useParams } from "next/navigation";

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

export default function EmployeeShowPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  
  // Find employee by ID
  const employee = mockEmployees.find(emp => emp.id === id);
  
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">{employee.name}</h1>
          <div className="flex items-center">
            <span className="bg-[#009a38] text-white px-2 py-1 text-xs rounded-full mr-2">
              {employee.status}
            </span>
            <span className="text-gray-600">{employee.position}</span>
          </div>
        </div>
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-[#ec6602] mb-3 border-b pb-2">Personal Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium text-black">{employee.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium text-black">{employee.date_of_birth} ({getAge(employee.date_of_birth)} years)</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-medium text-black">{employee.email}</p>
              <p className="font-medium text-black">{employee.phone}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-[#ec6602] mb-3 border-b pb-2">Employment Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Employee ID</p>
              <p className="font-medium text-black">EMP-{employee.id.toString().padStart(4, '0')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hire Date</p>
              <p className="font-medium text-black">{employee.hire_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium text-black">Operations</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Link 
          href={`/employees/${id}/edit`} 
          className="bg-[#ec6602] hover:bg-[#d45c02] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <i className="icon icon-edit"></i>
        </Link>
        <Link 
          href="/employees" 
          className="bg-[#009999] hover:bg-[#008080] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <i className="icon icon-show"></i>
        </Link>
      </div>
    </div>
  );
}