interface ClaimShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: {
    id: number;
    shift_name: string;
    store_name: string;
    schedule_date: string;
    start_time: string;
    end_time: string;
  } | null;
  onSubmit: (shiftId: number, remarks: string) => Promise<void>;
}

import { useState, useEffect } from "react";

export function ClaimShiftModal({
  isOpen,
  onClose,
  shift,
  onSubmit,
}: ClaimShiftModalProps) {
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRemarks(""); // Clear remarks when modal opens
    }
  }, [isOpen]);

  if (!isOpen || !shift) return null;

  const handleSubmitInternal = async () => {
    if (!shift) return;
    setIsSubmitting(true);
    try {
      await onSubmit(shift.id, remarks);
      onClose();
    } catch (error) {
      console.error("Error submitting claim:", error);
      alert("Failed to submit shift request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" style={{ backgroundColor: 'white' }}>
        <h2 className="text-xl font-bold mb-4 text-black">Claim Open Shift</h2>
        <p className="mb-2 text-gray-700">
          Shift: <span className="font-semibold">{shift.shift_name}</span> at{" "}
          <span className="font-semibold">{shift.store_name}</span>
        </p>
        <p className="mb-4 text-gray-700">
          Date:{" "}
          <span className="font-semibold">
            {new Date(shift.schedule_date).toLocaleDateString()}
          </span>{" "}
          Time:{" "}
          <span className="font-semibold">
            {shift.start_time.substring(0, 5)} -{" "}
            {shift.end_time.substring(0, 5)}
          </span>
        </p>

        <div className="mb-4">
          <label htmlFor="remarks" className="block mb-1 font-medium text-black">
            Remarks (optional)
          </label>
          <textarea
            id="remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="w-full border px-3 py-2 rounded text-black"
            placeholder="Enter any remarks for your request..."
          ></textarea>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn-grad px-4 py-2"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitInternal}
            className="btn-grad-add px-4 py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
