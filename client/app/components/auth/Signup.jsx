import { useState } from 'react';
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, AlertCircle, CheckCircle2, ChefHat } from 'lucide-react';
import { signupUser } from '../../../services/axiosAuth';

// Defined outside component so it is never recreated on re-render
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains a letter', pass: /[a-zA-Z]/.test(password) },
  ];
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <p key={c.label} className={`flex items-center gap-1.5 text-xs ${c.pass ? 'text-emerald-600' : 'text-slate-400'}`}>
          <CheckCircle2 size={11} className={c.pass ? 'text-emerald-500' : 'text-slate-300'} />
          {c.label}
        </p>
      ))}
    </div>
  );
};

// Defined outside component — prevents remount on every keystroke
const Field = ({ label, name, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
        <AlertCircle size={12} /> {error}
      </p>
    )}
  </div>
);

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', restaurantName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    if (serverError) setServerError(null);
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Full name is required.';
    if (!formData.restaurantName.trim()) e.restaurantName = 'Restaurant name is required.';
    if (!formData.email.trim()) e.email = 'Email address is required.';
    if (formData.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError(null);
    try {
      const { name, restaurantName, email, password } = formData;
      const res = await signupUser({ name, restaurantName, email, password });
      if (res.success) {
        navigate('/');
      } else {
        setServerError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Something went wrong. Please try again.';
      if (msg.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: msg }));
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name) =>
    `block w-full px-4 py-2.5 text-sm border rounded-xl shadow-sm transition focus:outline-none focus:ring-2 ${
      errors[name]
        ? 'border-red-400 focus:ring-red-300 bg-red-50'
        : 'border-slate-300 focus:ring-emerald-400 focus:border-emerald-400'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
            <ChefHat size={28} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Create Your Account</h1>
        <p className="mt-2 text-sm text-slate-500">Set up your Kitchen Pro admin account</p>
        <p className="mt-1 text-xs text-slate-400">Team members are added by you after setup</p>
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

          <form className="space-y-4" onSubmit={handleSubmit}>

            <Field label="Full Name" name="name" required error={errors.name}>
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                enterKeyHint="next"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Smith"
                className={inputClass('name')}
              />
            </Field>

            <Field label="Restaurant Name" name="restaurantName" required error={errors.restaurantName}>
              <input
                name="restaurantName"
                type="text"
                autoComplete="organization"
                required
                enterKeyHint="next"
                value={formData.restaurantName}
                onChange={handleChange}
                placeholder="The Golden Fork"
                className={inputClass('restaurantName')}
              />
            </Field>

            <Field label="Work Email" name="email" required error={errors.email}>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                enterKeyHint="next"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@restaurant.com"
                className={inputClass('email')}
              />
            </Field>

            <Field label="Password" name="password" required error={errors.password}>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  enterKeyHint="next"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className={`${inputClass('password')} pr-10`}
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
              <PasswordStrength password={formData.password} />
            </Field>

            <Field label="Confirm Password" name="confirmPassword" required error={errors.confirmPassword}>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  enterKeyHint="done"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`${inputClass('confirmPassword')} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account...</>
                  : 'Create Admin Account'
                }
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
