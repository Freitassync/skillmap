import StorageService from './StorageService';
import { STORAGE_KEYS } from '../constants';

/**
 * API Client for backend communication
 * Handles all HTTP requests with authentication
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3010/api';

/**
 * HTTP Method types
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * API Client Response
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make HTTP request with authentication
 */
const request = async <T = any>(
  method: HttpMethod,
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> => {
  try {
    const token = await StorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    console.log(`[API] ${method} ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      console.error(`API Error ${response.status}:`, result);
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
      };
    }

    console.log(`[API] ${method} ${endpoint} - Success`);
    return result;
  } catch (error) {
    console.error(`[API] ${method} ${endpoint} - Error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
};

/**
 * API Client Methods
 */
const ApiClient = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
    return request<T>('GET', endpoint);
  },

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return request<T>('POST', endpoint, data);
  },

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return request<T>('PUT', endpoint, data);
  },

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
    return request<T>('DELETE', endpoint);
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },
};

export default ApiClient;
