import { useState, useCallback } from "react";
import { fetchWasteLogs, createWasteLogs } from "../services/dashboard";

export function useWaste(initialLimit = 10) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (nextPage = 1, limit = initialLimit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWasteLogs({ page: nextPage, limit });
      setData(res.data);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  const log = useCallback(async (wasteData) => {
    const res = await createWasteLogs(wasteData);
    await fetch(1); // refresh to first page after new entry
    return res;
  }, [fetch]);

  return {
    data, page, total, limit: initialLimit,
    loading, error,
    fetch, log,
    totalPages: Math.ceil(total / initialLimit),
  };
}
