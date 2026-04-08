import { useState, useCallback } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  scanNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../app/services/notifications";

export function useNotifications(initialLimit = 20) {
  const [data, setData] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNotifications({ page: nextPage, limit: initialLimit });
      setData(res.data);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadCount();
      setUnreadCount(res.count);
    } catch {
      // silent — badge failure should not break layout
    }
  }, []);

  const scan = useCallback(async () => {
    await scanNotifications();
    await Promise.all([fetch(1), loadUnreadCount()]);
  }, [fetch, loadUnreadCount]);

  const markRead = useCallback(async (id) => {
    await markNotificationRead(id);
    setData(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAll = useCallback(async () => {
    await markAllNotificationsRead();
    setData(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  return {
    data, page, total, limit: initialLimit,
    unreadCount, loading, error,
    fetch, loadUnreadCount, scan, markRead, markAll,
    totalPages: Math.ceil(total / initialLimit)
  };
}
