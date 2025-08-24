'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  position: string;
  role: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User> & { password?: string }>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch user on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setForm(data.user);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const res = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      setMessage('✅ Profile updated successfully!');
    } else {
      setMessage(`❌ ${data.error || 'Update failed'}`);
    }
  };

  if (loading) return <p className="p-6 text-gray-800">Loading...</p>;

  return (
    <div className="p-8 max-w-2xl mx-auto text-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">My Profile</h1>

      {message && (
        <div className="mb-4 text-center text-sm font-medium text-gray-800">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white shadow-lg rounded-xl p-6"
      >
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">
            Email (read-only)
          </label>
          <input
            type="email"
            value={form.email || ''}
            disabled
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">
            Phone
          </label>
          <input
            type="text"
            name="phone"
            value={form.phone || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">
            Gender
          </label>
          <input
            type="text"
            name="gender"
            value={form.gender || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">
            Date of Birth
          </label>
          <input
            type="date"
            name="date_of_birth"
            value={form.date_of_birth?.slice(0, 10) || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">
            Position
          </label>
          <input
            type="text"
            name="position"
            value={form.position || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">
            New Password
          </label>
          <input
            type="password"
            name="password"
            value={form.password || ''}
            onChange={handleChange}
            placeholder="Leave blank to keep current"
            className="w-full px-4 py-2 border rounded-lg text-gray-900"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium"
          style={{
            background: '#14b8a6'
          }}
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
