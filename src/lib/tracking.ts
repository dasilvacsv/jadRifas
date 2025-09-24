// src/lib/tracking.ts

// --- Declaraciones Globales para TypeScript ---
declare global {
  interface Window {
    // Para Meta Pixel
    fbq: (...args: any[]) => void;
    // Para Simple Analytics
    sa_event: (eventName: string) => void;
  }
}

// --- Eventos de Meta Pixel ---

/**
 * Dispara el evento estándar "Lead" de Meta.
 */
export const trackLead = () => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead');
    console.log("🔥 Meta Pixel Event: Lead");
  }
};

/**
 * Dispara el evento estándar "Purchase" (Compra) de Meta.
 */
export const trackPurchase = ({ value, currency, num_items }: { value: number; currency: string; num_items: number }) => {
  if (typeof window.fbq === 'function') {
    const eventData = { value, currency, num_items };
    window.fbq('track', 'Purchase', eventData);
    console.log("✅ Meta Pixel Event: Purchase", eventData);
  }
};


// --- Eventos de Simple Analytics --- // <--- NUEVA SECCIÓN

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