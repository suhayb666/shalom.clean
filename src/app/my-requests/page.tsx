"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EmployeeRequest = {
  id: number;
  request_type: string;
  status: string;
  request_date: string;
  start_date: string | null;
  end_date: string | null;
  original_shift_name: string | null;
  original_shift_date: string | null;
  requested_shift_name: string | null;
  requested_shift_date: string | null;
  swap_with_employee_name: string | null;
  remarks: string | null;
  admin_notes: string | null;
};

type Shift = { id: number; shift_name: string; schedule_date: string; start_time: string; end_time: string; employee_name: string; store_name: string; };

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [employeeShifts, setEmployeeShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState("time_off"); // 'time_off', 'miss_shift', 'shift_swap'
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    original_shift_id: "",
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchRequestsAndShifts() {
      try {
        setLoading(true);
        const [reqRes, shiftRes] = await Promise.all([
          fetch("/api/employee-requests"),
          fetch("/api/schedules?me=true"), // Fetch employee's own schedules
        ]);

        if (!reqRes.ok) throw new Error(`Failed to fetch requests: ${reqRes.statusText}`);
        if (!shiftRes.ok) throw new Error(`Failed to fetch shifts: ${shiftRes.statusText}`);

        const reqData: EmployeeRequest[] = await reqRes.json();
        const shiftData: Shift[] = await shiftRes.json();

        setRequests(reqData);
        setEmployeeShifts(shiftData);
      } catch (err) {
        setError((err as Error).message || "Unknown error fetching data.");
      } finally {
        setLoading(false);
      }
    }
    fetchRequestsAndShifts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: any = {
      request_type: formType,
      remarks: formData.remarks,
    };

    if (formType === "time_off") {
      payload.start_date = formData.start_date;
      payload.end_date = formData.end_date;
    } else if (formType === "miss_shift" || formType === "shift_swap") {
      payload.original_shift_id = formData.original_shift_id ? parseInt(formData.original_shift_id) : null;
    }
    // For shift_swap, you might need to add requested_shift_id or swap_with_employee_id here later

    try {
      const res = await fetch("/api/employee-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit request.");
      }

      alert("Request submitted successfully!");
      // Refresh requests after submission
      setRequests((prev) => [res.json(), ...prev]); // This is simplified, real implementation should re-fetch
      setFormData({
        start_date: "",
        end_date: "",
        original_shift_id: "",
        remarks: "",
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="p-6">Loading requests...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-black">My Requests</h1>

      {/* Request Submission Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Submit a New Request</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="request_type">
            Request Type:
          </label>
          <select
            id="request_type"
            name="request_type"
            value={formType}
            onChange={(e) => setFormType(e.target.value as any)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="time_off">Time Off</option>
            <option value="miss_shift">Miss One Shift</option>
            <option value="shift_swap">Shift Swap</option>
          </select>
        </div>

        <form onSubmit={handleSubmitRequest} className="space-y-4">
          {formType === "time_off" && (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="start_date">
                  Start Date:
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end_date">
                  End Date:
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </>
          )}

          {(formType === "miss_shift" || formType === "shift_swap") && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="original_shift_id">
                Select Shift:
              </label>
              <select
                id="original_shift_id"
                name="original_shift_id"
                value={formData.original_shift_id}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select a shift</option>
                {employeeShifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.shift_name} on {new Date(shift.schedule_date).toLocaleDateString()} ({shift.start_time} - {shift.end_time})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Additional fields for shift swap might go here */}

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="remarks">
              Remarks (optional):
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>

      {/* Existing Requests List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">My Submitted Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">You have not submitted any requests yet.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="border p-4 rounded-md shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-black capitalize">{req.request_type.replace(/_/g, " ")}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-gray-700">Requested On: {new Date(req.request_date).toLocaleDateString()}</p>
                {req.start_date && req.end_date && (
                  <p className="text-gray-700">Time Off: {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</p>
                )}
                {req.original_shift_name && (
                  <p className="text-gray-700">Original Shift: {req.original_shift_name} on {new Date(req.original_shift_date!).toLocaleDateString()}</p>
                )}
                {req.requested_shift_name && (
                  <p className="text-gray-700">Requested Shift: {req.requested_shift_name} on {new Date(req.requested_shift_date!).toLocaleDateString()}</p>
                )}
                {req.swap_with_employee_name && (
                  <p className="text-gray-700">Swap With: {req.swap_with_employee_name}</p>
                )}
                {req.remarks && (
                  <p className="text-gray-700">Remarks: {req.remarks}</p>
                )}
                {req.admin_notes && (
                  <p className="text-gray-700 font-medium">Admin Notes: {req.admin_notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
