/**
 * Analytics Event Tracking Wrapper
 * Standardized event names following GA4 e-commerce events
 * 
 * Standard Events:
 * - view_item: User views a product/item
 * - add_to_cart: User adds item to cart
 * - remove_from_cart: User removes item from cart
 * - begin_checkout: User starts checkout process
 * - purchase: User completes purchase
 * - search: User searches for items
 * - view_item_list: User views list of items
 * - select_item: User selects specific item
 */

'use client';


/**
 * Standard Analytics Event Names
 */
export const AnalyticsEvents = {
  // E-commerce Events
  VIEW_ITEM: 'view_item',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',
  SEARCH: 'search',
  VIEW_ITEM_LIST: 'view_item_list',
  SELECT_ITEM: 'select_item',
  
  // Custom Events
  BOOKING_STARTED: 'booking_started',
  BOOKING_COMPLETED: 'booking_completed',
  PACKAGE_VIEWED: 'package_viewed',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  LOGIN: 'login',
  REGISTER: 'register',
  PAGE_VIEW: 'page_view',
} as const;

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

/**
 * Analytics Event Parameters
 */
export type AnalyticsEventParams = {
  // Item/Product info
  item_id?: string;
  item_name?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  currency?: string;
  quantity?: number;
  
  // Transaction info
  transaction_id?: string;
  value?: number;
  
  // User/Session info
  user_id?: string;
  session_id?: string;
  
  // Search info
  search_term?: string;
  
  // Custom params
  items?: Array<{
    itemId: string;
    itemName: string;
    price: number;
    quantity: number;
  }>;
  [key: string]: string | number | boolean | undefined | Array<unknown>;
};

/**
 * Track analytics event
 * Sends to both GA4 and PostHog
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  params?: AnalyticsEventParams
): void {
  if (typeof window === 'undefined') return;

  // Track in GA4
  if (window.gtag) {
    window.gtag('event', eventName, {
      ...params,
      // Map standard e-commerce params
      ...(params?.item_id && { item_id: params.item_id }),
      ...(params?.item_name && { item_name: params.item_name }),
      ...(params?.item_category && { item_category: params.item_category }),
      ...(params?.price && { value: params.price }),
      ...(params?.currency && { currency: params.currency }),
    });
  }

  // Track in PostHog (dynamic import to avoid SSR issues)
  if (typeof window !== 'undefined') {
    import('./posthog')
      .then(({ posthog }) => {
        if (posthog && typeof posthog.capture === 'function') {
          posthog.capture(eventName, params);
        }
      })
      .catch(() => {
        // PostHog not available, skip silently
      });
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent(AnalyticsEvents.PAGE_VIEW, {
    page_path: path,
    page_title: title,
  });
}

/**
 * Track item view (package/product)
 */
export function trackItemView(params: {
  itemId: string;
  itemName: string;
  itemCategory?: string;
  price?: number;
  currency?: string;
}): void {
  trackEvent(AnalyticsEvents.VIEW_ITEM, {
    item_id: params.itemId,
    item_name: params.itemName,
    item_category: params.itemCategory,
    price: params.price,
    currency: params.currency || 'IDR',
  });
}

/**
 * Track purchase completion
 */
export function trackPurchase(params: {
  transactionId: string;
  value: number;
  currency?: string;
  items: Array<{
    itemId: string;
    itemName: string;
    price: number;
    quantity: number;
  }>;
}): void {
  trackEvent(AnalyticsEvents.PURCHASE, {
    transaction_id: params.transactionId,
    value: params.value,
    currency: params.currency || 'IDR',
    items: params.items,
  });
}

/**
 * Track booking started
 */
export function trackBookingStarted(params: {
  packageId: string;
  packageName: string;
  price?: number;
}): void {
  trackEvent(AnalyticsEvents.BOOKING_STARTED, {
    item_id: params.packageId,
    item_name: params.packageName,
    price: params.price,
  });
}

/**
 * Track booking completed
 */
export function trackBookingCompleted(params: {
  bookingId: string;
  packageId: string;
  packageName: string;
  value: number;
}): void {
  trackEvent(AnalyticsEvents.BOOKING_COMPLETED, {
    transaction_id: params.bookingId,
    item_id: params.packageId,
    item_name: params.packageName,
    value: params.value,
  });
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string): void {
  trackEvent(AnalyticsEvents.SEARCH, {
    search_term: searchTerm,
  });
}

