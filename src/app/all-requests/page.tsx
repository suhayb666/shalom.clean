"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../lib/hooks/useUser"; // Assuming this hook provides user data
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

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
  requesting_employee_name: string | null; // For admin view
  swap_with_employee_name: string | null;
  remarks: string | null;
  admin_notes: string | null;
};

export default function AllRequestsPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useUser();
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingUser) {
      if (!user) {
        router.push("/auth"); // Redirect to login if not authenticated
        return;
      }

      const fetchRequests = async () => {
        setLoadingRequests(true);
        setError(null);
        try {
          const apiEndpoint =
            user.role === "admin"
              ? "/api/admin/employee-requests"
              : "/api/employee-requests";
          const res = await fetch(apiEndpoint);

          if (!res.ok) {
            // Try to parse error response, but handle cases where response might not be valid JSON
            let errorMessage = "Failed to fetch requests";
            try {
              const errorData = await res.json();
              errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
              // If we can't parse the error response, use the status text
              errorMessage = res.statusText || errorMessage;
            }
            throw new Error(errorMessage);
          }

          // Check if response has content before trying to parse JSON
          const text = await res.text();
          if (!text.trim()) {
            // Empty response, set empty array
            setRequests([]);
            return;
          }

          try {
            const data: EmployeeRequest[] = JSON.parse(text);
            setRequests(data);
          } catch (parseError) {
            console.error("JSON parsing error:", parseError);
            console.error("Response text:", text);
            throw new Error("Invalid response format from server");
          }
        } catch (err) {
          setError((err as Error).message || "An unknown error occurred");
          console.error("Error fetching requests:", err);
        } finally {
          setLoadingRequests(false);
        }
      };

      fetchRequests();
    }
  }, [user, loadingUser, router]);

  if (loadingUser || loadingRequests) {
    return <div className="p-6">Loading requests...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  const renderRequestDetails = (request: EmployeeRequest) => {
    switch (request.request_type) {
      case "time_off":
        return (
          <p>
            Dates:{" "}
            {request.start_date && format(new Date(request.start_date), "MMM dd, yyyy")}
            {request.end_date &&
              ` - ${format(new Date(request.end_date), "MMM dd, yyyy")}`}
          </p>
        );
      case "shift_swap":
        return (
          <>
            <p>Original Shift: {request.original_shift_name} on {request.original_shift_date && format(new Date(request.original_shift_date), "MMM dd, yyyy")}</p>
            {request.requested_shift_name && <p>Requested Shift: {request.requested_shift_name} on {request.requested_shift_date && format(new Date(request.requested_shift_date), "MMM dd, yyyy")}</p>}
            {request.swap_with_employee_name && <p>Swap With: {request.swap_with_employee_name}</p>}
          </>
        );
      case "miss_shift":
        return (
          <p>Shift: {request.original_shift_name} on {request.original_shift_date && format(new Date(request.original_shift_date), "MMM dd, yyyy")}</p>
        );
      default:
        return "—";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-black mb-6">
        {user?.role === "admin" ? "All Requests" : "My Requests"}
      </h1>

      {requests.length === 0 ? (
        <p className="text-gray-700">No requests found.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <Table>
          <TableHeader className="bg-[#009999] text-white">
          <TableRow>
          <TableHead className="py-3 px-4">Request Date</TableHead>
            {user?.role === "admin" && (
          <TableHead className="py-3 px-4">Requesting Employee</TableHead>
            )}
          <TableHead className="py-3 px-4">Type</TableHead>
          <TableHead className="py-3 px-4">Details</TableHead>
          <TableHead className="py-3 px-4">Remarks</TableHead>
          <TableHead className="py-3 px-4">Status</TableHead>
            {user?.role === "admin" && (
              <TableHead className="py-3 px-4">Actions</TableHead>
            )}
          </TableRow>
          </TableHeader>

            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium text-black">
                    {format(new Date(request.request_date), "MMM dd, yyyy")}
                  </TableCell>
                  {user?.role === "admin" && (
                    <TableCell className="text-black">{request.requesting_employee_name || "N/A"}</TableCell>
                  )}
                  <TableCell className="text-black">{(request.request_type || "N/A").replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-gray-700">{renderRequestDetails(request)}</TableCell>
                  <TableCell className="text-gray-700">{request.remarks || "—"}</TableCell>
                  <TableCell className="text-black capitalize">{request.status}</TableCell>
                  {user?.role === "admin" && (
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button className="btn-grad-add text-white" size="sm"> Approve </Button>
                          <Button className="btn-grad text-white" size="sm"> Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}