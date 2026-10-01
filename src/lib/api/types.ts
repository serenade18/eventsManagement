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
  | { kind: "awaiting_payment"; reference: string; checkoutRequestId: string; amount: number; expiresAt: string };

export interface Dashboard {
  overview: {
    ticketsSold: number;
    revenue: number;
    systemFee: number;
    netRevenue: number;
    total_events: number;
    active_events: number;
  };
  topEvents: { name: string; tickets: number; revenue: number; status: string }[];
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
