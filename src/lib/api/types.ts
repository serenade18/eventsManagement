export type UserType = "admin" | "organizer" | "sponsor";
export type OrderStatus = "pending" | "paid" | "failed" | "expired" | "refund_required";
export type Money = string | number;

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  user_type: UserType;
  organization: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  added_on?: string;
  last_login?: string | null;
}

export interface TicketType {
  id: number;
  event: number;
  name: string;
  description: string | null;
  price: string;
  quantity: number;
  sales_start: string;
  sales_end: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  title: string;
  category: string;
  poster: string | null;
  description: string;
  venue: string;
  date: string;
  time: string;
  is_feature: boolean;
  is_free: boolean;
  is_open: boolean;
  added_on: string;
  sponsors: number[];
  organizer: User;
  ticket_types: TicketType[];
}

export interface TicketTypeMini {
  id: number;
  name: string;
  price: string;
  quantity: number;
  event: number;
  event_title: string;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  qr_code: string | null;
  purchased: boolean;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  purchase_date: string | null;
  ticket_type: number;
  ticket_type_details: TicketTypeMini;
}

export interface TicketDetail extends Omit<Ticket, "ticket_type_details"> {
  ticket_type_details: TicketType & { event_name: string };
}

export interface Order {
  reference: string;
  status: OrderStatus;
  quantity: number;
  unit_price: string;
  total_amount: string;
  buyer_name: string;
  expires_at: string;
  paid_at: string | null;
  ticket_type: number;
  ticket_type_details: TicketTypeMini;
  tickets: Ticket[];
}

export interface PurchaseRequest {
  ticket_type: number;
  quantity: number;
  buyer_name: string;
  buyer_phone: string;
  buyer_email?: string;
}

export type PurchaseResult =
  | { kind: "issued"; order: Order }
  | {
      kind: "awaiting_payment";
      reference: string;
      checkoutRequestId: string;
      amount: number;
      expiresAt: string;
    };

export interface Dashboard {
  overview: {
    ticketsSold: number;
    revenue: number;
    systemFee: number;
    netRevenue: number;
    total_events: number;
    active_events: number;
  };
  /** "platform" for admins (every event), "organizer" otherwise. */
  scope?: "platform" | "organizer";
  /** id is present from the current backend; older responses only had the name. */
  topEvents: { id?: number; name: string; tickets: number; revenue: number; status: string }[];
  monthlyData: { month: string; revenue: number; tickets: number }[];
  demographics: { ageGroup: string; percentage: number; count: number }[];
}

export interface TierInput {
  name: string;
  description: string;
  price: string;
  quantity: number;
  sales_start: string;
  sales_end: string;
}

// ---- payment & SMS integrations (admin) ----
export type IntegrationProvider = "sms" | "mpesa" | "sasapay" | "stripe";

/**
 * Secrets are write-only: the API reports whether one is set and its last 4 characters,
 * never the value. Non-secret fields (shortcode, sender ID…) come back in `value`.
 */
export interface IntegrationField {
  value: string | null;
  configured: boolean;
  last4: string | null;
}

export interface Integration {
  provider: IntegrationProvider;
  enabled: boolean;
  fields: Record<string, IntegrationField>;
  updated_at: string | null;
  updated_by: string | null;
}

export interface IntegrationUpdate {
  enabled?: boolean;
  /** Only changed fields. Omitted secrets are left as they are. */
  fields?: Record<string, string>;
  /** The admin's current password, required for every change. */
  password: string;
}

export interface IntegrationTestResult {
  ok: boolean;
  message: string;
}

// ---- admin user detail ----
export interface UserOverview {
  user: User & { is_active: boolean; last_login: string | null };
  stats: {
    events: number;
    upcoming_events: number;
    tickets_sold: number;
    orders_paid: number;
    revenue: Money;
    sponsored_events: number;
  };
  events: {
    id: number;
    title: string;
    category: string;
    venue: string;
    date: string;
    time: string;
    is_open: boolean;
    is_feature: boolean;
    tickets_sold: number;
    revenue: Money;
  }[];
  sponsored_events: { id: number; title: string; date: string; venue: string; organizer: string }[];
  recent_sales: {
    reference: string;
    event_id: number;
    event_title: string;
    tier: string;
    quantity: number;
    total_amount: Money;
    buyer_name: string;
    paid_at: string | null;
  }[];
}

// ---- event performance (owner or admin) ----
export interface EventPerformance {
  event: { id: number; title: string; organizer: { id: number; name: string } };
  totals: {
    views: number;
    views_7d: number;
    tickets_sold: number;
    capacity: number;
    sell_through: number | null;
    revenue: Money;
    orders_paid: number;
    avg_order_value: Money;
    /** Paid orders per 100 page views; null until the page has views. */
    conversion_rate: number | null;
  };
  orders_by_status: Record<OrderStatus, number>;
  tiers: {
    id: number;
    name: string;
    price: string;
    capacity: number;
    sold: number;
    remaining: number;
    revenue: Money;
    sell_through: number | null;
    sales_start: string;
    sales_end: string;
  }[];
  daily: { date: string; views: number; tickets: number; revenue: Money }[];
  recent_orders: {
    reference: string;
    status: OrderStatus;
    tier: string;
    quantity: number;
    total_amount: Money;
    buyer_name: string;
    created_at: string;
    paid_at: string | null;
  }[];
}

// ---- wallets & payouts ----
export type WalletTxKind = "sale" | "withdrawal" | "withdrawal_return" | "adjustment";
export type WithdrawalStatus = "pending" | "paid" | "rejected" | "cancelled";
export type WithdrawalMethod = "mpesa" | "bank";

export interface WalletSummary {
  balance: Money;
  currency: "KES";
  min_withdrawal: Money;
  /** e.g. "0.10" */
  commission_rate: Money;
  can_withdraw: boolean;
  totals: {
    gross_sales: Money;
    commission: Money;
    net_earnings: Money;
    adjustments: Money;
    withdrawn: Money;
    pending_withdrawals: Money;
    pending_count: number;
  };
}

export interface WalletTransaction {
  id: number;
  kind: WalletTxKind;
  /** Signed: credits positive, debits negative. */
  amount: Money;
  balance_after: Money;
  gross_amount: Money | null;
  commission: Money | null;
  order_reference: string | null;
  withdrawal_id: number | null;
  description: string;
  created_at: string;
}

export interface Withdrawal {
  id: number;
  amount: Money;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  mpesa_phone: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  payout_reference: string;
  admin_note: string;
  requested_at: string;
  processed_at: string | null;
  user?: Pick<User, "id" | "name" | "email" | "phone" | "user_type" | "organization">;
  wallet_balance?: Money;
}

export interface WithdrawalRequestBody {
  password: string;
  amount: string;
  method: WithdrawalMethod;
  mpesa_phone?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
}

export interface PayoutSettings {
  min_withdrawal: Money;
  commission_rate: Money;
  updated_at: string | null;
  updated_by: string | null;
}

export interface WalletsOverview {
  wallets: {
    user: Pick<User, "id" | "name" | "email" | "user_type" | "organization">;
    balance: Money;
  }[];
  totals: {
    balances: Money;
    pending_withdrawals: Money;
    pending_count: number;
    commission_earned: Money;
  };
}
