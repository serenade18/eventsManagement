// In-progress purchase, persisted so a reload can resume the payment page (spec §10.4).
const KEY = "hostme.checkout";

export interface PendingCheckout {
  reference: string;
  amount: number;
  expires_at: string;
  event_id: number;
  event_title: string;
  tier_id: number;
  tier_name: string;
  quantity: number;
  buyer_name: string;
  buyer_phone: string;
}

export function savePending(p: PendingCheckout) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function loadPending(reference?: string): PendingCheckout | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null") as PendingCheckout | null;
    if (p && (!reference || p.reference === reference)) return p;
  } catch {
    /* ignore */
  }
  return null;
}

export function clearPending() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// Buyer details for prefilling a retry. Email stays in memory only (never persisted).
export interface BuyerPrefill {
  quantity: number;
  buyer_name: string;
  buyer_phone: string;
  buyer_email?: string;
}
let prefill: (BuyerPrefill & { tier_id: number }) | null = null;
export function setPrefill(p: BuyerPrefill & { tier_id: number }) {
  prefill = p;
}
export function getPrefill(tierId: number): BuyerPrefill | null {
  if (prefill && prefill.tier_id === tierId) return prefill;
  const p = loadPending();
  if (p && p.tier_id === tierId)
    return { quantity: p.quantity, buyer_name: p.buyer_name, buyer_phone: p.buyer_phone };
  return null;
}
