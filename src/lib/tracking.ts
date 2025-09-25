// src/lib/tracking.ts

// --- Declaraciones Globales para TypeScript ---
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    sa_event: (eventName: string) => void;
  }
}

// --- Eventos de Meta Pixel ---

// --- MODIFICADO: Ahora acepta parámetros opcionales ---
interface LeadParams {
  content_name?: string;
}

/**
 * Dispara el evento estándar "Lead" de Meta.
 * @param {LeadParams} params - Parámetros adicionales para el evento.
 */
export const trackLead = (params?: LeadParams) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', params || {});
    console.log("🔥 Meta Pixel Event: Lead", params || {});
  }
};

// --- MODIFICADO: Ahora acepta content_name y otros parámetros ---
interface PurchaseParams {
  value: number;
  currency: string;
  num_items: number;
  content_name?: string;
}

/**
 * Dispara el evento estándar "Purchase" (Compra) de Meta.
 * @param {PurchaseParams} params - Datos del evento de compra.
 */
export const trackPurchase = (params: PurchaseParams) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Purchase', params);
    console.log("✅ Meta Pixel Event: Purchase", params);
  }
};

// --- Eventos de Simple Analytics ---

/**
 * Dispara un evento personalizado para Simple Analytics.
 * @param {string} eventName - El nombre del evento (ej. 'select_tickets').
 */
export const trackSimpleAnalyticsEvent = (eventName: string) => {
  if (typeof window.sa_event === 'function') {
    window.sa_event(eventName);
    console.log(`📈 Simple Analytics Event: ${eventName}`);
  }
};