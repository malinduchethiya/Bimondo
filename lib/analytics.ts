'use client';

/**
 * Privacy-conscious Google Analytics 4 helper for Bimondo Travels.
 * - Safe no-op when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset or invalid.
 * - Never sends PII (names, emails, phone numbers, messages).
 * - Respects Do Not Track (DNT) and user opt-out preferences stored in localStorage.
 * - Deduplicates rapid identical view events.
 */

export const GA_CONSENT_STORAGE_KEY = 'bimondo_analytics_consent_v1';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const recentEventTimestamps = new Map<string, number>();

export function getGaMeasurementId(): string | null {
  const raw = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';
  if (!raw || !/^G-[A-Z0-9]+$/i.test(raw)) {
    return null;
  }
  return raw;
}

export function isAnalyticsPermitted(): boolean {
  if (typeof window === 'undefined') return false;
  if (!getGaMeasurementId()) return false;

  // Respect browser Do Not Track setting
  const nav = window.navigator as Navigator & { msDoNotTrack?: string };
  const win = window as Window & { doNotTrack?: string };
  if (
    nav.doNotTrack === '1' ||
    nav.msDoNotTrack === '1' ||
    win.doNotTrack === '1'
  ) {
    return false;
  }

  try {
    const stored = window.localStorage.getItem(GA_CONSENT_STORAGE_KEY);
    if (stored === 'denied') return false;
  } catch {
    // Ignore storage access restrictions
  }

  return true;
}

export function trackAnalyticsEvent(
  eventName: string,
  params: Record<string, string | number | boolean | undefined> = {},
  options?: { dedupeKey?: string; dedupeMs?: number }
): void {
  if (typeof window === 'undefined') return;
  if (!isAnalyticsPermitted()) return;
  if (typeof window.gtag !== 'function') return;

  const dedupeKey = options?.dedupeKey;
  const dedupeMs = options?.dedupeMs ?? 1500;
  if (dedupeKey) {
    const now = Date.now();
    const last = recentEventTimestamps.get(dedupeKey) ?? 0;
    if (now - last < dedupeMs) {
      return;
    }
    recentEventTimestamps.set(dedupeKey, now);
  }

  const sanitized: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      sanitized[k] = v;
    }
  }

  try {
    window.gtag('event', eventName, sanitized);
  } catch {
    // Never break UI interactions if analytics throws
  }
}

export function trackDestinationView(slug: string, name: string, region?: string) {
  trackAnalyticsEvent(
    'view_destination',
    {
      destination_slug: slug,
      destination_name: name,
      destination_region: region,
    },
    { dedupeKey: `view_destination:${slug}`, dedupeMs: 3000 }
  );
}

export function trackTourPackageView(slug: string, name: string, category?: string, days?: number) {
  trackAnalyticsEvent(
    'view_tour_package',
    {
      package_slug: slug,
      package_name: name,
      package_category: category,
      package_days: days,
    },
    { dedupeKey: `view_tour_package:${slug}`, dedupeMs: 3000 }
  );
}

export function trackGuideView(slug: string, title: string, category?: string) {
  trackAnalyticsEvent(
    'view_travel_guide',
    {
      guide_slug: slug,
      guide_title: title,
      guide_category: category,
    },
    { dedupeKey: `view_travel_guide:${slug}`, dedupeMs: 3000 }
  );
}

export function trackBookingButtonClick(params: {
  source: string;
  itemType: 'tour' | 'destination' | 'experience' | 'accommodation' | 'general';
  itemId?: string;
  itemName?: string;
}) {
  trackAnalyticsEvent(
    'booking_button_click',
    {
      click_source: params.source,
      item_type: params.itemType,
      item_id: params.itemId,
      item_name: params.itemName,
    },
    {
      dedupeKey: `booking_click:${params.source}:${params.itemId || 'general'}`,
      dedupeMs: 800,
    }
  );
}

export function trackBookingFormStart(params: {
  formLocation: string;
  itemType?: string;
  itemId?: string;
}) {
  trackAnalyticsEvent(
    'booking_form_start',
    {
      form_location: params.formLocation,
      item_type: params.itemType,
      item_id: params.itemId,
    },
    {
      dedupeKey: `booking_form_start:${params.formLocation}:${params.itemId || 'default'}`,
      dedupeMs: 15000,
    }
  );
}

export function trackBookingEnquirySubmit(params: {
  method: string;
  selectedPackage: string;
  duration?: string;
}) {
  trackAnalyticsEvent('booking_enquiry_submit', {
    enquiry_method: params.method,
    selected_package: params.selectedPackage,
    trip_duration: params.duration,
  });
}

export function trackContactFormSubmit(params: {
  method: string;
  selectedPackage: string;
}) {
  trackAnalyticsEvent('contact_form_submit', {
    contact_method: params.method,
    selected_package: params.selectedPackage,
  });
}

export function trackWhatsAppClick(source: string, context?: string) {
  trackAnalyticsEvent(
    'whatsapp_click',
    {
      click_source: source,
      context_label: context,
    },
    { dedupeKey: `whatsapp:${source}:${context || ''}`, dedupeMs: 1000 }
  );
}
