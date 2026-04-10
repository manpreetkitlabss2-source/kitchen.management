import { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';
import api from '../../../services/axiosAuth';

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

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setProfile(res.data))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        {/* Avatar */}
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

        {/* Details */}
        <div className="space-y-4">
          <Field label="Full Name"        value={profile.name} />
          <Field label="Email"            value={profile.email} />
          <Field label="Restaurant"       value={profile.restaurantName || '—'} />
          <Field label="Member Since"     value={new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
        </div>
      </div>
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
