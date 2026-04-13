import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const VARIANTS = {
  success: {
    icon: CheckCircle,
    bar:  'bg-emerald-500',
    bg:   'bg-white border-emerald-200',
    icon_class: 'text-emerald-500',
    title_class: 'text-emerald-800',
    msg_class: 'text-emerald-700',
  },
  error: {
    icon: XCircle,
    bar:  'bg-red-500',
    bg:   'bg-white border-red-200',
    icon_class: 'text-red-500',
    title_class: 'text-red-800',
    msg_class: 'text-red-700',
  },
  warning: {
    icon: AlertTriangle,
    bar:  'bg-amber-500',
    bg:   'bg-white border-amber-200',
    icon_class: 'text-amber-500',
    title_class: 'text-amber-800',
    msg_class: 'text-amber-700',
  },
  info: {
    icon: Info,
    bar:  'bg-blue-500',
    bg:   'bg-white border-blue-200',
    icon_class: 'text-blue-500',
    title_class: 'text-blue-800',
    msg_class: 'text-blue-700',
  },
};

// Single toast item
const ToastItem = ({ id, type = 'info', title, message, duration = 4000, onRemove }) => {
  const [visible, setVisible] = useState(false);
  const v = VARIANTS[type] || VARIANTS.info;
  const Icon = v.icon;

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const exitTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, duration);
    return () => { clearTimeout(enterTimer); clearTimeout(exitTimer); };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  return (
    <div
      className={`
        relative flex items-start gap-3 w-80 rounded-xl border shadow-lg p-4 overflow-hidden
        transition-all duration-300 ease-out
        ${v.bg}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${v.bar}`} />

      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${v.icon_class}`} />

      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${v.title_class}`}>{title}</p>}
        {message && <p className={`text-sm mt-0.5 ${v.msg_class}`}>{message}</p>}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition mt-0.5"
      >
        <X size={15} />
      </button>
    </div>
  );
};

// Container — renders all active toasts
const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
