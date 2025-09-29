import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// API configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Create axios instance
const apiClient: AxiosInstance = axios.create(API_CONFIG);

// Request interceptor
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Log request details
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data
    });

    // Add timestamp to request
    config.metadata = { startTime: new Date() };

    // Add authentication headers if available
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration
    const duration = response.config.metadata?.startTime 
      ? new Date().getTime() - response.config.metadata.startTime.getTime()
      : 0;

    // Log successful response
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      duration: `${duration}ms`,
      data: response.data
    });

    return response;
  },
  (error: AxiosError) => {
    // Calculate request duration if available
    const duration = error.config?.metadata?.startTime 
      ? new Date().getTime() - error.config.metadata.startTime.getTime()
      : 0;

    // Log error response
    console.error(`[API Error] ${error.response?.status || 'Network Error'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      duration: `${duration}ms`,
      message: error.message,
      response: error.response?.data
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear auth token and redirect to login if needed
      localStorage.removeItem('auth_token');
      console.warn('[API] Unauthorized access - token cleared');
    }

    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.warn('[API] Access forbidden - insufficient permissions');
    }

    if (error.response?.status >= 500) {
      // Server error - could show a global notification
      console.error('[API] Server error - please try again later');
    }

    return Promise.reject(error);
  }
);

// Add typing for metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}

export default apiClient;