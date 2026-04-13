import { useState, useEffect } from 'react';
import { UserCircle, Trash2, AlertTriangle, Info } from 'lucide-react';
import api from '../../../services/axiosAuth';
import { selfDeleteAccount } from '../../../services/users';
import { removeToken } from '../../../services/axiosAuth';
import { removeRole, getRole } from '../../../utils/permissions';

const ROLE_LABELS = {
  admin:           'Admin',
  manager:         'Manager',
  chef:            'Chef',
  inventory_staff: 'Inventory Staff',
};

const ROLE_COLORS = {
  admin:           'bg-purple-100 text-purple-700',
  manager:         'bg-blue-100 text-blue-700',
  chef:            'bg-emerald-100 text-emerald-700',
  inventory_staff: 'bg-orange-100 text-orange-700',
};

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const currentRole = getRole();
  const isAdmin = currentRole === 'admin';

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setProfile(res.data))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (confirmText !== 'DELETE MY ACCOUNT') return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await selfDeleteAccount();
      removeToken();
      removeRole();
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account. Please try again.');
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
    </div>
  );

  if (error) return (
    <div className="flex justify-center py-20 text-red-500 text-sm">{error}</div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <UserCircle className="text-emerald-600" size={22} />
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-3xl font-bold text-emerald-600">
              {profile.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[profile.role] || 'bg-slate-100 text-slate-600'}`}>
            {ROLE_LABELS[profile.role] || profile.role}
          </span>
        </div>

        <div className="space-y-4">
          <Field label="Full Name"    value={profile.name} />
          <Field label="Email"        value={profile.email} />
          <Field label="Restaurant"   value={profile.restaurantName || '—'} />
          <Field label="Member Since" value={new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
        </div>
      </div>

      {/* Danger zone — admin only */}
      {isAdmin ? (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
            </div>
            {!showDeleteSection && (
              <button
                onClick={() => setShowDeleteSection(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 size={13} />
                Delete Account
              </button>
            )}
          </div>

          {showDeleteSection && (
            <div className="px-6 py-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 space-y-1">
                <p className="font-semibold">This will permanently delete:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  <li>Your admin account</li>
                  <li>All your ingredients, recipes, and logs</li>
                  <li>All your notifications, batches, and orders</li>
                </ul>
                <p className="text-xs mt-2 font-medium">Users you created will remain but will no longer have a creator reference.</p>
              </div>

              <p className="text-sm text-slate-600">
                Type <strong className="text-red-600">DELETE MY ACCOUNT</strong> to confirm.
              </p>

              <form onSubmit={handleDeleteAccount} className="space-y-3">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                />

                {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowDeleteSection(false); setConfirmText(''); setDeleteError(null); }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={confirmText !== 'DELETE MY ACCOUNT' || deleteLoading}
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
          )}
        </div>
      ) : (
        /* Non-admin: inform them they cannot self-delete */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-3">
          <Info size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500">
            Account deletion is managed by your admin. Contact your administrator if you need your account removed.
          </p>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
    <span className="text-sm font-medium text-slate-500">{label}</span>
    <span className="text-sm font-semibold text-slate-800">{value}</span>
  </div>
);

export default ProfilePage;
