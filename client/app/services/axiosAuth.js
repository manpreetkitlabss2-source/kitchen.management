import axios from "axios";

// Base API URL (change to your backend)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Token storage key
const TOKEN_KEY = "auth_token";

/***********************
 * TOKEN STORAGE
 ***********************/

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
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
        if (error.response && error.response.status === 401) {
            console.log("Unauthorized - logging out");
            removeToken();

            // Optional redirect
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

/***********************
 * AUTH APIs
 ***********************/

// LOGIN
export async function loginUser(email, password) {
    try {
        const response = await api.post("/auth/login", {
            email,
            password,
        });

        const token = response.data.token;

        if (token) {
            setToken(token);
        }

        return response.data;
    } catch (error) {
        console.error("Login error:", error.response?.data || error.message);
        throw error;
    }
}

// SIGNUP
export async function signupUser(name, restaurantName, email, password) {
    try {
        const response = await api.post("/auth/signup", {
            name, restaurantName, email, password,
        });

        const token = response.data.token;

        if (token) {
            setToken(token);
        }

        return response.data;
    } catch (error) {
        console.error("Signup error:", error.response?.data || error.message);
        throw error;
    }
}

// LOGOUT
export function logoutUser() {
    removeToken();
    window.location.href = "/login";
}

/***********************
 * GENERIC API CALL
 * Use this for future requests
 ***********************/

export async function fetchUserProfile() {
    try {
        const response = await api.get("/profile");
        return response.data;
    } catch (error) {
        console.error("Profile fetch error:", error);
        throw error;
    }
}

export default api;
