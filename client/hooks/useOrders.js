import { useState, useCallback } from "react";
import { fetchOrders, placeOrder } from "../services/dashboard";

export function useOrders(initialLimit = 10) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (nextPage = 1, limit = initialLimit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOrders({ page: nextPage, limit });
      setData(res.data);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  const place = useCallback(async (payload) => {
    const res = await placeOrder(payload);
    await fetch(1);
    return res;
  }, [fetch]);

  return {
    data, page, total, limit: initialLimit,
    loading, error,
    fetch, place,
    totalPages: Math.ceil(total / initialLimit),
  };
}
