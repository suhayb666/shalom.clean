"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImSpinner2 } from "react-icons/im";

type Employee = {
  id: number;
  name: string;
};

type Shift = {
  id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
};

type Unavailability = {
  id: number;
  employee_name: string;
  start_date: string;
  end_date: string;
  remarks: string;
};

export default function CreateSchedulePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    employee_name: "",
    store_name: "",
    shift_name: "",
    start_time: "",
    end_time: "",
    schedule_date: "",
    is_open_shift: false, // Add is_open_shift to form state
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [errorEmployees, setErrorEmployees] = useState<string | null>(null);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [errorShifts, setErrorShifts] = useState<string | null>(null);
  const [loadingUnavailabilities, setLoadingUnavailabilities] = useState(true);
  const [errorUnavailabilities, setErrorUnavailabilities] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const storeNames = ["Shalom Pizza", "Shalom Grill", "Shalom Pizza/Grill"];

  useEffect(() => {
    async function fetchData() {
      // Fetch Employees
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

      // Fetch Shifts
      try {
        setLoadingShifts(true);
        const res = await fetch("/api/shifts");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch shifts");
        }
        const data: Shift[] = await res.json();
        setShifts(data);
      } catch (err) {
        const error = err as Error;
        setErrorShifts(error.message || "Unknown error fetching shifts");
      } finally {
        setLoadingShifts(false);
      }

      // Fetch Unavailabilities
      try {
        setLoadingUnavailabilities(true);
        const res = await fetch("/api/unavailabilities");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch unavailabilities");
        }
        const data: Unavailability[] = await res.json();
        setUnavailabilities(data);
      } catch (err) {
        const error = err as Error;
        setErrorUnavailabilities(error.message || "Unknown error fetching unavailabilities");
      }
      finally {
        setLoadingUnavailabilities(false);
      }
    }
    fetchData(); // This call needs to be inside the useEffect's callback
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prevForm) => {
      const newForm = { ...prevForm, [name]: value };
      if (name === "shift_name") {
        const selectedShift = shifts.find(shift => shift.shift_name === value);
        if (selectedShift) {
          newForm.start_time = selectedShift.start_time.substring(0, 5);
          newForm.end_time = selectedShift.end_time.substring(0, 5);
        } else {
          newForm.start_time = "";
          newForm.end_time = "";
        }
      } else if (name === "employee_name" && value === "OPEN_SHIFT") {
        newForm.employee_name = value; // Set employee_name to "OPEN_SHIFT" (the value from the option)
        newForm.is_open_shift = true;
      } else if (name === "employee_name" && prevForm.is_open_shift === true && value !== "OPEN_SHIFT") {
        // If an employee is selected after previously selecting open shift
        newForm.is_open_shift = false;
      }
      return newForm;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // If it's an open shift, no unavailability check is needed.
    if (!form.is_open_shift) {
      // Check for employee unavailability
      const scheduledDate = new Date(form.schedule_date);
      const unavailableEmployee = unavailabilities.find(unavail => {
        const unavailStartDate = new Date(unavail.start_date);
        const unavailEndDate = new Date(unavail.end_date);
        
        return (
          unavail.employee_name === form.employee_name &&
          scheduledDate >= unavailStartDate &&
          scheduledDate <= unavailEndDate
        );
      });

      if (unavailableEmployee) {
        alert(`Employee ${form.employee_name} is unavailable on ${form.schedule_date} due to: ${unavailableEmployee.remarks}`);
        return;
      }
    }

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create schedule");
      }

      router.push("/schedules");
    } catch (err) {
      const error = err as Error;
      alert("Error creating schedule: " + (error.message || "Unknown error"));
    }
    finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mt-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-black">Add New Schedule</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-black">Employee Name</label>
          {loadingEmployees || loadingShifts || loadingUnavailabilities ? (
            <p className="text-gray-500">Loading data...</p>
          ) : errorEmployees || errorShifts || errorUnavailabilities ? (
            <p className="text-red-600">Error: {errorEmployees || errorShifts || errorUnavailabilities}</p>
          ) : (
            <select
              name="employee_name"
              value={form.employee_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded text-black"
              required={!form.is_open_shift} // Make employee name required only if not an open shift
            >
              <option value="" className="text-gray-500">Select Employee</option>
              <option value="OPEN_SHIFT" className="text-black">Open Shift</option> {/* Added Open Shift option */}
              {employees.map((employee) => (
                <option key={employee.id} value={employee.name} className="text-black">
                  {employee.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Store Name</label>
          <select
            name="store_name"
            value={form.store_name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
            required
          >
            <option value="" className="text-gray-500">Select Store</option>
            {storeNames.map((store) => (
              <option key={store} value={store} className="text-black">
                {store}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Shift Name</label>
          {loadingShifts ? (
            <p className="text-gray-500">Loading shifts...</p>
          ) : errorShifts ? (
            <p className="text-red-600">Error: {errorShifts}</p>
          ) : (
            <select
              name="shift_name"
              value={form.shift_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded text-black"
              required
            >
              <option value="" className="text-gray-500">Select Shift</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.shift_name} className="text-black">
                  {shift.shift_name}
                </option>
              ))}
            </select>
          )}
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
            readOnly // Start time should be populated by shift selection
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
            readOnly // End time should be populated by shift selection
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-black">Schedule Date</label>
          <input
            type="date"
            name="schedule_date"
            value={form.schedule_date}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-black"
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-grad-add flex items-center justify-center"
            disabled={submitting}
          >
            {submitting ? (
              <ImSpinner2 className="animate-spin h-5 w-5 text-white" />
            ) : (
              "Add"
            )}
          </button>
          <button
            type="button"
            className="btn-grad flex items-center justify-center"
            onClick={() => router.push("/schedules")}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
