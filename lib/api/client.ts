/**
 * Centralized API Client
 * Wrapper for fetch with token injection and global error handling
 */

import { createError, handleApiError } from '@/lib/api/error-handler';
import { env } from '@/lib/env';

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: HeadersInit;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  requiresAuth?: boolean;
};

export type ApiResponse<T = unknown> = {
  data: T;
  status: number;
  headers: Headers;
};

/**
 * Centralized API client
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || env.NEXT_PUBLIC_APP_URL;
  }

  /**
   * Get auth token from Supabase session
   */
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') {
      // Server-side: get from cookies
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } else {
      // Client-side: get from Supabase client
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): string {
    const url = new URL(endpoint, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Make API request
   */
  async request<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      requiresAuth = true,
    } = options;

    // Build URL
    const url = this.buildURL(endpoint, params);

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Add body if present
    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw createError.internal(
          errorData.message || `API request failed: ${response.statusText}`,
          { status: response.status, endpoint }
        );
      }

      // Parse response
      const data = await response.json().catch(() => ({}));

      return {
        data: data as T,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw createError.internal('Network error: Unable to reach server', {
          endpoint,
        });
      }

      // Re-throw known errors
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }

      // Handle unknown errors
      throw handleApiError(error);
    }
  }

  /**
   * Convenience methods
   */
  async get<T = unknown>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T = unknown>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

/**
 * Usage examples:
 *
 * import { apiClient } from '@/lib/api/client';
 *
 * // GET request
 * const { data } = await apiClient.get('/api/bookings');
 *
 * // POST request
 * const { data } = await apiClient.post('/api/bookings', {
 *   tripId: 'trip-123',
 *   customerName: 'John Doe',
 * });
 *
 * // With query params
 * const { data } = await apiClient.get('/api/bookings', {
 *   params: { status: 'confirmed', page: 1 },
 * });
 *
 * // Without auth
 * const { data } = await apiClient.get('/api/public/packages', {
 *   requiresAuth: false,
 * });
 */
