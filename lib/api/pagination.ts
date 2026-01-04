/**
 * Pagination Utilities
 * Standard pagination helpers for API routes
 */

export type PaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  offset: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
};

/**
 * Parse pagination parameters from URL search params
 * Supports both page-based and offset-based pagination
 */
export function parsePaginationParams(searchParams: URLSearchParams, defaultLimit = 20): {
  page: number;
  limit: number;
  offset: number;
} {
  // Support both page-based (preferred) and offset-based (legacy)
  const pageParam = searchParams.get('page');
  const offsetParam = searchParams.get('offset');
  const limitParam = searchParams.get('limit');

  const limit = Math.min(Math.max(parseInt(limitParam || String(defaultLimit), 10), 1), 100); // Max 100 per page
  let page = 1;
  let offset = 0;

  if (pageParam) {
    // Page-based pagination (1-indexed)
    page = Math.max(parseInt(pageParam, 10), 1);
    offset = (page - 1) * limit;
  } else if (offsetParam) {
    // Offset-based pagination (0-indexed)
    offset = Math.max(parseInt(offsetParam, 10), 0);
    page = Math.floor(offset / limit) + 1;
  }

  return { page, limit, offset };
}

/**
 * Create pagination metadata response
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    offset,
    totalPages,
    hasMore: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * Standard pagination response format
 */
export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};

/**
 * Create standardized paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: createPaginationMeta(total, page, limit),
  };
}

