/** Store settings shared by the pages and the Site API. */

/** Every price and order is in this currency (ISO 4217). */
export const STORE_CURRENCY = 'USD';

/** Most units of one product per order line. */
export const MAX_LINE_QUANTITY = 99;

/** Most distinct products per order. */
export const MAX_CART_LINES = 50;

export function formatMoney(cents: number, currency: string = STORE_CURRENCY): string {
  try {
    return new Intl.NumberFormat('en-US', {style: 'currency', currency}).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
