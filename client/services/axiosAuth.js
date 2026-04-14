import axios from "axios";
import { saveRole, removeRole } from "../utils/permissions";

// Base API URL (change to your backend)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Token storage key
const TOKEN_KEY = "auth_token";

/***********************
 * TOKEN STORAGE
 ***********************/

export function setToken(token) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
}

/***********************
 * AXIOS INSTANCE
 ***********************/

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

/***********************
 * REQUEST INTERCEPTOR
 * Automatically attach token
 * for future authorization
 ***********************/

api.interceptors.request.use(
    (config) => {
        const token = getToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/***********************
 * RESPONSE INTERCEPTOR
 * Handle expired token globally
 ***********************/

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/api/auth/login');

        if (error.response && error.response.status === 401 && !isLoginRequest) {
            console.log("Unauthorized - logging out");
            removeToken();
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

/***********************
 * AUTH APIs
 ***********************/

// LOGIN
export async function loginUser({ email, password }) {
    try {
        const response = await api.post("/api/auth/login", {
            email,
            password,
        });

        const token = response.data.token;

        if (token) {
            setToken(token);
        }

        // Save role for frontend permission checks
        if (response.data.user?.role) {
            saveRole(response.data.user.role);
        }

        return response.data;
    } catch (error) {
        console.error("Login error:", error.response?.data || error.message);
        throw error;
    }
}

// SIGNUP
export async function signupUser({ name, restaurantName, email, password }) {
    try {
        const response = await api.post("/api/auth/signup", {
            name, restaurantName, email, password,
        });

        const token = response.data.token;

        if (token) {
            setToken(token);
        }

        // Signup always creates an admin — save role so sidebar renders correctly
        saveRole('admin');

        return response.data;
    } catch (error) {
        console.error("Signup error:", error.response?.data || error.message);
        throw error;
    }
}

// LOGOUT
export function logoutUser() {
    removeToken();
    removeRole();
    window.location.href = "/login";
}

/***********************
 * GENERIC API CALL
 * Use this for future requests
 ***********************/

export async function fetchUserProfile() {
    try {
        const response = await api.get("/api/auth/me");
        return response.data;
    } catch (error) {
        console.error("Profile fetch error:", error);
        throw error;
    }
}

export default api;
