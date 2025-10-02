"use client";

import { useState, useEffect } from "react";
import { ImSpinner2 } from "react-icons/im";

interface EmployeeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: {
    id: number;
    shift_name: string;
    store_name: string;
    schedule_date: string;
    start_time: string;
    end_time: string;
    employee_name: string;
    employee_id: number | null;
  } | null;
  employees: { id: number; name: string }[];
  onSubmitTimeOff: (shiftId: number, startDate: string, endDate: string, reason: string) => Promise<void>;
  onSubmitMissShift: (shiftId: number, reason: string) => Promise<void>;
  onSubmitSwapShift: (shiftId: number, swapEmployeeId: number, reason: string) => Promise<void>;
}

export function EmployeeRequestModal({
  isOpen,
  onClose,
  shift,
  employees,
  onSubmitTimeOff,
  onSubmitMissShift,
  onSubmitSwapShift,
}: EmployeeRequestModalProps) {
  const [activeTab, setActiveTab] = useState<"timeoff" | "miss" | "swap">("timeoff");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time Off form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeOffReason, setTimeOffReason] = useState("");

  // Miss Shift form state
  const [missShiftReason, setMissShiftReason] = useState("");

  // Swap Shift form state
  const [swapEmployeeId, setSwapEmployeeId] = useState("");
  const [swapReason, setSwapReason] = useState("");

  useEffect(() => {
    if (isOpen && shift) {
      // Reset all form states when modal opens
      // Convert ISO date to YYYY-MM-DD format for date inputs
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      setStartDate(formatDateForInput(shift.schedule_date));
      setEndDate(formatDateForInput(shift.schedule_date));
      setTimeOffReason("");
      setMissShiftReason("");
      setSwapEmployeeId("");
      setSwapReason("");
      setActiveTab("timeoff");
      
      // Debug: Log employees data
      console.log("🔍 EmployeeRequestModal - Employees data:", employees);
      console.log("🔍 EmployeeRequestModal - Shift employee_id:", shift.employee_id);
    }
  }, [isOpen, shift, employees]);

  if (!isOpen || !shift) return null;

  const handleSubmitTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !timeOffReason.trim()) {
      alert("Please fill in all required fields for time off request.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitTimeOff(shift.id, startDate, endDate, timeOffReason);
      onClose();
    } catch (error) {
      console.error("Error submitting time off request:", error);
      alert("Failed to submit time off request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitMissShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missShiftReason.trim()) {
      alert("Please provide a reason for missing the shift.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitMissShift(shift.id, missShiftReason);
      onClose();
    } catch (error) {
      console.error("Error submitting miss shift request:", error);
      alert("Failed to submit miss shift request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSwapShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapEmployeeId || !swapReason.trim()) {
      alert("Please select an employee and provide a reason for the swap request.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitSwapShift(shift.id, parseInt(swapEmployeeId), swapReason);
      onClose();
    } catch (error) {
      console.error("Error submitting swap shift request:", error);
      alert("Failed to submit swap shift request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'white' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black">Shift Request</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Shift Information */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-black mb-2">Selected Shift</h3>
          <p className="text-gray-700">
            <span className="font-medium">{shift.shift_name}</span> at{" "}
            <span className="font-medium">{shift.store_name}</span>
          </p>
          <p className="text-gray-700">
            Date:{" "}
            <span className="font-medium">
              {new Date(shift.schedule_date).toLocaleDateString()}
            </span>
          </p>
          <p className="text-gray-700">
            Time:{" "}
            <span className="font-medium">
              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
            </span>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("timeoff")}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "timeoff"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Time Off
          </button>
          <button
            onClick={() => setActiveTab("miss")}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "miss"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Miss One Shift
          </button>
          <button
            onClick={() => setActiveTab("swap")}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "swap"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Swap Shifts
          </button>
        </div>

        {/* Time Off Section */}
        {activeTab === "timeoff" && (
          <form onSubmit={handleSubmitTimeOff} className="space-y-4">
            <h3 className="text-lg font-semibold text-black mb-4">Request Time Off</h3>
            <p className="text-gray-600 text-sm mb-4">
              Request time off for the selected shift or for a specified number of days.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-black mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-black mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="timeOffReason" className="block text-sm font-medium text-black mb-1">
                Reason for Time Off *
              </label>
              <textarea
                id="timeOffReason"
                value={timeOffReason}
                onChange={(e) => setTimeOffReason(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                placeholder="Please provide a reason for your time off request..."
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-grad px-4 py-2"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-grad-add px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting && <ImSpinner2 className="animate-spin" size={16} />}
                Submit Request
              </button>
            </div>
          </form>
        )}

        {/* Miss One Shift Section */}
        {activeTab === "miss" && (
          <form onSubmit={handleSubmitMissShift} className="space-y-4">
            <h3 className="text-lg font-semibold text-black mb-4">Miss One Shift</h3>
            <p className="text-gray-600 text-sm mb-4">
              Request to miss the selected shift with a reason.
            </p>

            <div>
              <label htmlFor="missShiftReason" className="block text-sm font-medium text-black mb-1">
                Reason for Missing Shift *
              </label>
              <textarea
                id="missShiftReason"
                value={missShiftReason}
                onChange={(e) => setMissShiftReason(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                placeholder="Please provide a reason for missing this shift..."
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-grad px-4 py-2"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-grad-add px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting && <ImSpinner2 className="animate-spin" size={16} />}
                Submit Request
              </button>
            </div>
          </form>
        )}

        {/* Swap Shifts Section */}
        {activeTab === "swap" && (
          <form onSubmit={handleSubmitSwapShift} className="space-y-4">
            <h3 className="text-lg font-semibold text-black mb-4">Swap Shifts</h3>
            <p className="text-gray-600 text-sm mb-4">
              Request to swap the selected shift with another employee.
            </p>

            <div>
              <label htmlFor="swapEmployee" className="block text-sm font-medium text-black mb-1">
                Select Employee to Swap With *
              </label>
              <select
                id="swapEmployee"
                value={swapEmployeeId}
                onChange={(e) => setSwapEmployeeId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                required
              >
                <option value="">Choose an employee...</option>
                {employees
                  .filter((emp) => emp.id !== shift.employee_id) // Exclude current employee
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="swapReason" className="block text-sm font-medium text-black mb-1">
                Reason for Swap *
              </label>
              <textarea
                id="swapReason"
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                placeholder="Please provide a reason for the shift swap request..."
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> The system will verify that the selected employee doesn't have a conflicting shift on the requested date.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-grad px-4 py-2"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-grad-add px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting && <ImSpinner2 className="animate-spin" size={16} />}
                Submit Request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}