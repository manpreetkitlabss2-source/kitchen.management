import { useState, useCallback } from "react";
import { fetchConsumptionLogs, prepareDish } from "../app/services/dashboard";

export function useConsumption(initialLimit = 10) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchConsumptionLogs({ page: nextPage, limit: initialLimit });
      setData(res.data);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  const prepare = useCallback(async (payload) => {
    const res = await prepareDish(payload);
    await fetch(1); // refresh to first page after new entry
    return res;
  }, [fetch]);

  return {
    data, page, total, limit: initialLimit,
    loading, error,
    fetch, prepare,
    totalPages: Math.ceil(total / initialLimit),
  };
}
