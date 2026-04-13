/***********************
 * INGREDIENT APIs
 ***********************/

import api from "./axiosAuth";

// CREATE NEW INGREDIENT
export async function createIngredient(ingredientData) {
    try {
        // endpoint: /api/ingredients
        const response = await api.post("/api/ingredients", ingredientData);
        return response.data;
    } catch (error) {
        console.error("Error creating ingredient:", error.response?.data || error.message);
        throw error;
    }
}

// UPDATE INGREDIENT
export async function updateIngredient(ingredientData) {
    try {
        const response = await api.put("/api/ingredients", ingredientData);
        return response.data;
    } catch (error) {
        console.error("Error creating ingredient:", error.response?.data || error.message);
        throw error;
    }
}

export async function deleteIngredient(id) {
    const response = await api.delete(`/api/ingredients/${id}`);
    return response.data;
}

// FETCH ALL INGREDIENTS (Recommended for updating the table after save)
export async function fetchIngredients({ page = 1, limit = 10 } = {}) {
    try {
        const response = await api.get("/api/ingredients", { params: { page, limit } });
        return response.data;
    } catch (error) {
        console.error("Error fetching ingredients:", error);
        throw error;
    }
}

// Fetch all recipes
export async function fetchRecipes({ page = 1, limit = 10 } = {}) {
    const response = await api.get("/api/recipe", { params: { page, limit } });
    return response.data;
}

// Create recipe with its ingredient mapping
export async function createRecipe(recipeData) {
    const response = await api.post("/api/recipe", recipeData);
    return response.data;
}

export async function deleteRecipe(id) {
    const response = await api.delete(`/api/recipe/${id}`);
    return response.data;
}

// Fetch all consumption logs
export async function fetchConsumptionLogs({ page = 1, limit = 10 } = {}) {
    const response = await api.get("/api/consumption", { params: { page, limit } });
    return response.data;
}

export async function prepareDish(payload) {
    const response = await api.post("/api/consumption/prepare", payload);
    return response.data;
}

// Fetch all waste logs
export async function fetchWasteLogs({ page = 1, limit = 10 } = {}) {
    const response = await api.get("/api/waste", { params: { page, limit } });
    return response.data;
}

// Create logs 
export async function createWasteLogs(wasteLogsData) {
    const response = await api.post("/api/waste", wasteLogsData);
    return response.data;
}

// Fetch dashboard stats (single optimized backend call)
export async function fetchDashboard() {
    const response = await api.get("/api/dashboard");
    return response.data;
}

// Orders
export async function fetchOrders({ page = 1, limit = 10 } = {}) {
    const response = await api.get("/api/orders", { params: { page, limit } });
    return response.data;
}

export async function placeOrder(payload) {
    const response = await api.post("/api/orders", payload);
    return response.data;
}