import axios from 'axios';
import { APP_CONFIG } from '../config';

const API_BASE = APP_CONFIG.API_BASE_URL;

// Set global timeout
axios.defaults.timeout = APP_CONFIG.API_TIMEOUT;

// Add a response interceptor
axios.interceptors.response.use(
    (response) => {
        if (import.meta.env.MODE === 'development') {
            console.log(`[API Response] ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (import.meta.env.MODE === 'development') {
            console.error('[API Error]', error.response?.data || error.message);
        }

        // Handle 401: Auto-logout
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return new Promise(() => { });
        }

        // Handle Retry Logic (Status 5xx or Network Error)
        if (
            (error.code === 'ERR_NETWORK' || (error.response && error.response.status >= 500 && error.response.status < 600)) &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

            if (originalRequest._retryCount <= 2) {
                const delay = Math.pow(2, originalRequest._retryCount) * 300; // Exponential backoff: 600ms, 1200ms
                await new Promise(resolve => setTimeout(resolve, delay));
                return axios(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

// Add a request interceptor to attach token
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (import.meta.env.MODE === 'development') {
            console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Stocks
export const getStocks = (params) => axios.get(`${API_BASE}/stocks`, { params });
export const getStock = (symbol) => axios.get(`${API_BASE}/stocks/${symbol}`);
export const getStockHistory = (symbol) => axios.get(`${API_BASE}/stocks/${symbol}/history`);
export const getTrendingQuestions = (symbol) => axios.get(`${API_BASE}/stocks/${symbol}/trending`);
export const getSectors = () => axios.get(`${API_BASE}/stocks/sectors`);

// Questions
export const getQuestions = (params) => axios.get(`${API_BASE}/questions`, { params });
export const getQuestion = (id) => axios.get(`${API_BASE}/questions/${id}`);
export const createQuestion = (data) => axios.post(`${API_BASE}/questions`, data);
export const createAnswer = (questionId, content) => axios.post(`${API_BASE}/questions/${questionId}/answers`, { content });
export const upvoteQuestion = (id) => axios.put(`${API_BASE}/questions/${id}/upvote`);
export const downvoteQuestion = (id) => axios.put(`${API_BASE}/questions/${id}/downvote`);
export const upvoteAnswer = (id) => axios.put(`${API_BASE}/questions/answers/${id}/upvote`);
export const downvoteAnswer = (id) => axios.put(`${API_BASE}/questions/answers/${id}/downvote`);
export const acceptAnswer = (questionId, answerId) => axios.put(`${API_BASE}/questions/${questionId}/answers/${answerId}/accept`);

// Predictions
export const getPredictions = (params) => axios.get(`${API_BASE}/predictions`, { params });
export const createPrediction = (data) => axios.post(`${API_BASE}/predictions`, data);
export const getUserPredictions = (userId) => axios.get(`${API_BASE}/predictions/user/${userId}`);
export const getPredictionStats = () => axios.get(`${API_BASE}/predictions/stats`);

// Users
export const getLeaderboard = (limit) => axios.get(`${API_BASE}/users/leaderboard`, { params: { limit } });
export const getUserProfile = (userId) => axios.get(`${API_BASE}/users/${userId}`);
export const getUserStats = (userId) => axios.get(`${API_BASE}/users/${userId}/stats`);
export const updateProfile = (data) => axios.put(`${API_BASE}/users/profile`, data);
export const getUserCount = () => axios.get(`${API_BASE}/users/count`);

// Social
export const followUser = (id) => axios.post(`${API_BASE}/social/follow/${id}`);
export const unfollowUser = (id) => axios.delete(`${API_BASE}/social/follow/${id}`);
export const getFeed = (page = 1) => axios.get(`${API_BASE}/social/feed`, { params: { page } });
export const getNotifications = () => axios.get(`${API_BASE}/social/notifications`);
export const markNotificationRead = (id) => axios.put(`${API_BASE}/social/notifications/${id}/read`);
export const markAllNotificationsRead = () => axios.put(`${API_BASE}/social/notifications/read-all`);

// Portfolio & Trading
export const getPortfolio = () => axios.get(`${API_BASE}/portfolio`);
export const executeTrade = (tradeData) => axios.post(`${API_BASE}/portfolio/trade`, tradeData);
export const getTradeHistory = () => axios.get(`${API_BASE}/portfolio/history`);
export const getWatchlist = () => axios.get(`${API_BASE}/portfolio/watchlist`);
export const toggleWatchlist = (stockId) => axios.post(`${API_BASE}/portfolio/watchlist/${stockId}`);
export const getDiversification = (userId) => axios.get(`${API_BASE}/analytics/diversification/${userId}`);

// Auth
// Auth
export const login = (email, password) => axios.post(`${API_BASE}/auth/login`, { email, password });
export const register = (username, email, password) => axios.post(`${API_BASE}/auth/register`, { username, email, password });
export const getCurrentUser = () => axios.get(`${API_BASE}/auth/me`);
export const verifyEmail = (email, otp) => axios.post(`${API_BASE}/auth/verify-email`, { email, otp });
export const loginOTPInit = (email) => axios.post(`${API_BASE}/auth/login-otp-init`, { email });
export const loginOTPVerify = (email, otp) => axios.post(`${API_BASE}/auth/login-otp-verify`, { email, otp });
export const forgotPassword = (email) => axios.post(`${API_BASE}/auth/forgot-password`, { email });
export const resetPassword = (data) => axios.post(`${API_BASE}/auth/reset-password`, data);
