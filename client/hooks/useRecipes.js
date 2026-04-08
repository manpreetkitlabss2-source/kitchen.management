import { useState, useCallback } from "react";
import { fetchRecipes, createRecipe } from "../app/services/dashboard";

export function useRecipes(initialLimit = 10) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRecipes({ page: nextPage, limit: initialLimit });
      setData(res.data);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  const add = useCallback(async (recipeData) => {
    const res = await createRecipe(recipeData);
    await fetch(page);
    return res;
  }, [fetch, page]);

  return {
    data, page, total, limit: initialLimit,
    loading, error,
    fetch, add,
    totalPages: Math.ceil(total / initialLimit),
  };
}
