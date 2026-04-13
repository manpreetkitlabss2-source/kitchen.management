import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { createUser, getUsers, hardDeleteUser } from '../../../services/users';
import { getRole, can } from '../../../utils/permissions';

const CREATABLE_ROLES = {
  admin:   ['manager', 'chef', 'inventory_staff'],
  manager: ['chef', 'inventory_staff'],
};

const ROLE_LABELS = {
  manager:         'Manager',
  chef:            'Chef',
  inventory_staff: 'Inventory Staff',
};

const roleBadgeClass = {
  admin:           'bg-purple-100 text-purple-700',
  manager:         'bg-blue-100 text-blue-700',
  chef:            'bg-emerald-100 text-emerald-700',
  inventory_staff: 'bg-orange-100 text-orange-700',
};

const defaultForm = { name: '', email: '', password: '', role: '' };

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [toast, setToast] = useState(null);

  // Hard-delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // user object
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const callerRole = getRole();
  const assignableRoles = CREATABLE_ROLES[callerRole] || [];

  if (!can('user:create')) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        You do not have permission to manage users.
      </div>
    );
  }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) return showToast('error', 'Please select a role');
    setFormLoading(true);
    try {
      await createUser(formData);
      showToast('success', `User "${formData.name}" created successfully`);
      setFormData(defaultForm);
      loadUsers();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (user) => {
    setDeleteTarget(user);
    setDeleteConfirmText('');
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteConfirmText('');
  };

  const handleHardDelete = async (e) => {
    e.preventDefault();
    if (deleteConfirmText !== deleteTarget.name) return;
    setDeleteLoading(true);
    try {
      await hardDeleteUser(deleteTarget.id);
      showToast('success', `User "${deleteTarget.name}" and all their data permanently deleted`);
      closeDeleteModal();
      loadUsers();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Hard-delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Permanently Delete User</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 space-y-1">
              <p className="font-semibold">The following will be permanently deleted:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>User account: <strong>{deleteTarget.name}</strong></li>
                <li>All their ingredients and recipes</li>
                <li>All consumption and waste logs</li>
                <li>All notifications and batches</li>
                <li>All orders placed by this user</li>
              </ul>
            </div>

            <form onSubmit={handleHardDelete} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Type <strong className="text-red-600">{deleteTarget.name}</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deleteTarget.name}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmText !== deleteTarget.name || deleteLoading}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteLoading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Trash2 size={14} /> Delete Permanently</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="text-emerald-600" size={22} />
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <UserPlus size={18} className="text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-800">Create New User</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="user@example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Min. 8 characters" minLength={8}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select name="role" value={formData.role} onChange={handleChange} required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">Select a role...</option>
                  {assignableRoles.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={formLoading}
                className="w-full bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {formLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><UserPlus size={16} /> Create User</>
                }
              </button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-800">
                {callerRole === 'admin' ? 'All Users' : 'Users You Created'}
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No users created yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${roleBadgeClass[user.role] || 'bg-slate-100 text-slate-600'}`}>
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openDeleteModal(user)}
                            title="Permanently delete user and all their data"
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
