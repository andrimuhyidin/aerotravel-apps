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
  // E-commerce Events (GA4 Standard)
  VIEW_ITEM: 'view_item',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  VIEW_CART: 'view_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  ADD_SHIPPING_INFO: 'add_shipping_info',
  ADD_PAYMENT_INFO: 'add_payment_info',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  SEARCH: 'search',
  VIEW_ITEM_LIST: 'view_item_list',
  SELECT_ITEM: 'select_item',
  SELECT_PROMOTION: 'select_promotion',
  VIEW_PROMOTION: 'view_promotion',
  
  // Checkout Progress Events
  CHECKOUT_STEP_1: 'checkout_step_1',
  CHECKOUT_STEP_2: 'checkout_step_2',
  CHECKOUT_STEP_3: 'checkout_step_3',
  CHECKOUT_PROGRESS: 'checkout_progress',
  
  // Custom Events
  BOOKING_STARTED: 'booking_started',
  BOOKING_COMPLETED: 'booking_completed',
  PACKAGE_VIEWED: 'package_viewed',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  LOGIN: 'login',
  REGISTER: 'register',
  LOGOUT: 'logout',
  PAGE_VIEW: 'page_view',
  
  // Journey Events
  FUNNEL_STEP: 'funnel_step',
  SCROLL_DEPTH: 'scroll_depth',
  TIME_ON_PAGE: 'time_on_page',
  PAGE_EXIT: 'page_exit',
  
  // Engagement Events
  SHARE: 'share',
  WISHLIST_ADD: 'wishlist_add',
  WISHLIST_REMOVE: 'wishlist_remove',
  REVIEW_SUBMITTED: 'review_submitted',
  CONTACT_FORM_SUBMITTED: 'contact_form_submitted',
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

/**
 * Track view cart
 */
export function trackViewCart(params: {
  items: Array<{
    itemId: string;
    itemName: string;
    price: number;
    quantity: number;
  }>;
  value: number;
  currency?: string;
}): void {
  trackEvent(AnalyticsEvents.VIEW_CART, {
    value: params.value,
    currency: params.currency || 'IDR',
    items: params.items,
  });
}

/**
 * Track add shipping info
 */
export function trackAddShippingInfo(params: {
  transactionId?: string;
  value: number;
  currency?: string;
  shippingTier?: string;
}): void {
  trackEvent(AnalyticsEvents.ADD_SHIPPING_INFO, {
    transaction_id: params.transactionId,
    value: params.value,
    currency: params.currency || 'IDR',
    shipping_tier: params.shippingTier,
  });
}

/**
 * Track add payment info
 */
export function trackAddPaymentInfo(params: {
  transactionId?: string;
  value: number;
  currency?: string;
  paymentType?: string;
}): void {
  trackEvent(AnalyticsEvents.ADD_PAYMENT_INFO, {
    transaction_id: params.transactionId,
    value: params.value,
    currency: params.currency || 'IDR',
    payment_type: params.paymentType,
  });
}

/**
 * Track checkout progress
 */
export function trackCheckoutProgress(params: {
  step: number;
  stepName: string;
  value?: number;
  currency?: string;
  items?: Array<{
    itemId: string;
    itemName: string;
    price: number;
    quantity: number;
  }>;
}): void {
  trackEvent(AnalyticsEvents.CHECKOUT_PROGRESS, {
    checkout_step: params.step,
    checkout_step_name: params.stepName,
    value: params.value,
    currency: params.currency || 'IDR',
    items: params.items,
  });
}

/**
 * Track payment failure
 */
export function trackPaymentFailed(params: {
  transactionId?: string;
  value: number;
  currency?: string;
  errorCode?: string;
  errorMessage?: string;
}): void {
  trackEvent(AnalyticsEvents.PAYMENT_FAILED, {
    transaction_id: params.transactionId,
    value: params.value,
    currency: params.currency || 'IDR',
    error_code: params.errorCode,
    error_message: params.errorMessage,
  });
}

/**
 * Track share
 */
export function trackShare(params: {
  method: string;
  contentType: string;
  itemId?: string;
}): void {
  trackEvent(AnalyticsEvents.SHARE, {
    method: params.method,
    content_type: params.contentType,
    item_id: params.itemId,
  });
}

/**
 * Track review submission
 */
export function trackReviewSubmitted(params: {
  itemId: string;
  itemName: string;
  rating: number;
}): void {
  trackEvent(AnalyticsEvents.REVIEW_SUBMITTED, {
    item_id: params.itemId,
    item_name: params.itemName,
    rating: params.rating,
  });
}
