import { useState, useCallback } from 'react';

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type, title, message, duration = 4000) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  // Shorthand helpers
  const success = useCallback((title, message) => toast('success', title, message), [toast]);
  const error   = useCallback((title, message) => toast('error',   title, message), [toast]);
  const warning = useCallback((title, message) => toast('warning', title, message), [toast]);
  const info    = useCallback((title, message) => toast('info',    title, message), [toast]);

  return { toasts, remove, toast, success, error, warning, info };
}
