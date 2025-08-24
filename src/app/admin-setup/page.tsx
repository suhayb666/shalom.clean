'use client';

import { useState } from 'react';

interface Employee {
  id: number;
  name: string;
  currentEmail: string | null;
  generatedEmail: string;
  originalEmail?: string;
}

interface PreviewResponse {
  message: string;
  employees: Employee[];
}

interface SetupResponse {
  message: string;
  updated: number;
  employees: Employee[];
  errors?: Array<{ name: string; error: string }>;
}

export default function AdminSetup() {
  const [preview, setPreview] = useState<Employee[]>([]);
  const [setupResult, setSetupResult] = useState<SetupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePreview = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/setup-user-ids');
      const data: PreviewResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch preview');
      }

      setPreview(data.employees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!window.confirm('⚠️ This will set emails and default passwords for all employees. Are you sure?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/setup-user-ids', {
        method: 'POST',
      });
      const data: SetupResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to setup user IDs');
      }

      setSetupResult(data);
      // Refresh preview after setup
      await handlePreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup user IDs');
    } finally {
      setLoading(false);
    }
  };

  // Helper to detect duplicates
  const isDuplicate = (email: string) =>
    preview.filter(e => e.generatedEmail === email).length > 1;

  // Helper to compute status
  const getStatus = (employee: Employee): string => {
    if (!employee.currentEmail) return 'New';
    return employee.currentEmail && !employee.originalEmail ? 'Needs Password' : 'Skip';
  };

  return (
    <div className="fixed inset-0 ml-64 p-6 bg-gradient-to-br from-emerald-500 via-teal-500 via-60% to-rose-500 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">
            Employee User ID Setup
          </h1>
          <p className="text-white/90 mb-4">
            This tool generates <code>firstname.lastname@shalom.com</code> for all employees.
          </p>
          <p className="text-white/90 mb-6">
            All employees will be assigned the system default password.
          </p>

          <div className="flex gap-4">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Preview Changes'}
            </button>

            {preview.length > 0 && (
              <button
                onClick={handleSetup}
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Execute Setup'}
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-400 rounded-lg p-4 mb-6">
            <p className="text-red-100 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Setup Result */}
        {setupResult && (
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-400 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-green-100 mb-4">Setup Complete!</h2>
            <p className="text-green-100 mb-4">{setupResult.message}</p>
            <p className="text-green-100">Updated {setupResult.updated} employees</p>
            <p className="text-green-100 mt-2 italic">
              All users have been assigned the system default password.
            </p>
            {setupResult.errors && setupResult.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="text-red-200 font-medium mb-2">Errors:</h3>
                {setupResult.errors.map((err, index) => (
                  <p key={index} className="text-red-200 text-sm">
                    {err.name}: {err.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview Table */}
        {preview.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <h2 className="text-xl font-bold text-white">
                Email Preview ({preview.length} employees)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-white font-medium">ID</th>
                    <th className="px-6 py-3 text-left text-white font-medium">Employee Name</th>
                    <th className="px-6 py-3 text-left text-white font-medium">Current Email</th>
                    <th className="px-6 py-3 text-left text-white font-medium">Generated Email</th>
                    <th className="px-6 py-3 text-left text-white font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {preview.map((employee) => (
                    <tr key={employee.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-white">{employee.id}</td>
                      <td className="px-6 py-4 text-white font-medium">{employee.name}</td>
                      <td className="px-6 py-4 text-white/70">
                        {employee.currentEmail || (
                          <span className="text-gray-400 italic">No email</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white font-mono bg-black/20 rounded">
                        {employee.generatedEmail}
                        {isDuplicate(employee.generatedEmail) && (
                          <span className="ml-2 text-red-400 text-sm font-bold">⚠️ Duplicate</span>
                        )}
                        {setupResult?.errors?.some(e => e.name === employee.name) && (
                          <span className="ml-2 text-red-400 text-sm font-bold">Error</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const status = getStatus(employee);
                          if (status === 'New')
                            return <span className="text-green-300">New</span>;
                          if (status === 'Needs Password')
                            return <span className="text-yellow-300">Needs Password</span>;
                          return <span className="text-gray-300">Skip</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {preview.length === 0 && !loading && !error && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
            <p className="text-white/70 text-lg">Click "Preview Changes" to see what emails will be generated</p>
          </div>
        )}
      </div>
    </div>
  );
}
