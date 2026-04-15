import { useState } from 'react';
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, AlertCircle, ChefHat } from 'lucide-react';
import { loginUser } from '../../../services/axiosAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    if (serverError) setServerError(null);
  };

  const validate = () => {
    const e = {};
    if (!formData.email.trim()) e.email = 'Email address is required.';
    if (!formData.password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError(null);
    try {
      const res = await loginUser({ email: formData.email, password: formData.password });
      if (res.success) {
        navigate('/');
      } else {
        setServerError(res.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Something went wrong. Please try again.';
      // Map specific messages to field-level errors
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account')) {
        setErrors({ email: msg });
      } else if (msg.toLowerCase().includes('password')) {
        setErrors({ password: msg });
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
            <ChefHat size={28} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Kitchen Pro</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to your management portal</p>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl border border-slate-100">

          {/* Server error banner */}
          {serverError && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                enterKeyHint="next"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@restaurant.com"
                className={`block w-full px-4 py-2.5 text-sm border rounded-xl shadow-sm transition focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-red-400 focus:ring-red-300 bg-red-50'
                    : 'border-slate-300 focus:ring-emerald-400 focus:border-emerald-400'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`block w-full px-4 py-2.5 pr-10 text-sm border rounded-xl shadow-sm transition focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-400 focus:ring-red-300 bg-red-50'
                      : 'border-slate-300 focus:ring-emerald-400 focus:border-emerald-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
                : 'Sign In'
              }
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-slate-400">New to Kitchen Pro?</span></div>
          </div>

          <div className="mt-4">
            <Link
              to="/signup"
              className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              Create Admin Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
