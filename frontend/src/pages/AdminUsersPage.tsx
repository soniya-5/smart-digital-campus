import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Shield,
  Building,
  CheckCircle,
  UserPlus,
} from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/common/Modal';
import { User } from '../types';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Edit Role Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('STUDENT');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Create Staff Account Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    phone: '',
  });
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);
  const [createStaffLoading, setCreateStaffLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(search ? { search } : {}),
        ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
      });

      const res = await api.get<User[]>(`/admin/users?${params.toString()}`);
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    api.get('/admin/departments').then((res) => {
      if (res.success && res.data) setDepartments(res.data);
    });
  }, [roleFilter]);

  const handleOpenEditRole = (u: User) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setSelectedDeptId(u.departmentId || '');
    setShowModal(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setModalLoading(true);

    try {
      const res = await api.patch(`/admin/users/${selectedUser.id}/role`, {
        role: newRole,
        departmentId: selectedDeptId || null,
      });

      if (res.success) {
        setShowModal(false);
        fetchUsers();
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setStaffSuccess(null);
    setCreateStaffLoading(true);

    try {
      const res = await api.post('/admin/staff', staffForm);
      if (res.success) {
        setStaffSuccess('Staff account created successfully!');
        setStaffForm({
          name: '',
          email: '',
          password: '',
          departmentId: '',
          phone: '',
        });
        fetchUsers();
        setTimeout(() => {
          setShowStaffModal(false);
          setStaffSuccess(null);
        }, 1500);
      } else {
        setStaffError(res.error || 'Failed to create staff account.');
      }
    } catch {
      setStaffError('An error occurred while creating staff account.');
    } finally {
      setCreateStaffLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User & Access Control Management</h1>
          <p className="mt-1 text-xs text-slate-500">
            Administrator panel to audit users, assign departments, and provision staff authorization
          </p>
        </div>

        <button
          onClick={() => {
            setStaffError(null);
            setStaffSuccess(null);
            setShowStaffModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold shadow-md shadow-royal-600/20 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Create Staff Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, student ID, or email..."
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
          />
          <button
            onClick={fetchUsers}
            className="px-4 py-1.5 bg-royal-600 text-white font-bold rounded-xl"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="all">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="STAFF">Maintenance Staff</option>
            <option value="ADMIN">Administrators</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading user directory...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Reward Points</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'STAFF'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-royal-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {u.studentId || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {u.department?.name || '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-700 font-mono">
                      {u.points} pts
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditRole(u)}
                        className="px-3 py-1 bg-royal-50 hover:bg-royal-100 text-royal-700 font-semibold rounded-lg text-xs transition"
                      >
                        Manage Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Manage Role: ${selectedUser?.name}`}
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role *</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="STUDENT">Student (Standard User)</option>
              <option value="STAFF">Staff / Maintenance Personnel</option>
              <option value="ADMIN">Administrator (Full Access)</option>
            </select>
          </div>

          {newRole === 'STAFF' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Department *
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-5 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-bold"
            >
              {modalLoading ? 'Saving...' : 'Update User Role'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Staff Account Modal */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        title="Create Staff / Maintenance Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          {staffError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {staffError}
            </div>
          )}
          {staffSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {staffSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              placeholder="e.g. John Spark"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Email Address *</label>
            <input
              type="email"
              required
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
              placeholder="e.g. j.spark@campus.edu"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Password * (Min 8 chars)</label>
            <input
              type="password"
              required
              minLength={8}
              value={staffForm.password}
              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
              placeholder="••••••••"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department / Specialization *</label>
            <select
              required
              value={staffForm.departmentId}
              onChange={(e) => setStaffForm({ ...staffForm, departmentId: e.target.value })}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/20"
            >
              <option value="">Select Department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone (Optional)</label>
            <input
              type="text"
              value={staffForm.phone}
              onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
              placeholder="e.g. 555-0101"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-royal-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowStaffModal(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStaffLoading}
              className="px-5 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {createStaffLoading ? 'Creating Account...' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
