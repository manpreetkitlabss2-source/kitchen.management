import { useState, useCallback } from "react";
import { fetchIngredients, createIngredient, updateIngredient } from "../services/dashboard";

export function useIngredients(initialLimit = 10) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIngredients({ page: nextPage, limit: initialLimit });
      setData(res.data);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  const add = useCallback(async (ingredientData) => {
    const res = await createIngredient(ingredientData);
    await fetch(page);
    return res;
  }, [fetch, page]);

  const update = useCallback(async (ingredientData) => {
    const res = await updateIngredient(ingredientData);
    await fetch(page);
    return res;
  }, [fetch, page]);

  return {
    data, page, total, limit: initialLimit,
    loading, error,
    fetch, add, update,
    totalPages: Math.ceil(total / initialLimit),
  };
}
