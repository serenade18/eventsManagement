// Provider definitions for the admin Integrations page. Field names match the backend
// settings they replace (hostmeProject/settings.py), lower-cased.
import type { IntegrationProvider } from "./api/types";

export interface FieldDef {
  name: string;
  label: string;
  secret?: boolean;
  kind?: "text" | "url" | "select";
  options?: { value: string; label: string }[];
  hint?: string;
  placeholder?: string;
  required?: boolean;
  /** Returns an error message, or null when valid. Only runs on non-empty input. */
  check?: (v: string) => string | null;
}

export interface ProviderDef {
  id: IntegrationProvider;
  name: string;
  category: "Payments" | "Messaging";
  description: string;
  /** False when the backend doesn't use this provider yet. Keys can be stored ahead of time. */
  live: boolean;
  docs: string;
  fields: FieldDef[];
}

const https = (v: string) => (/^https:\/\/[^\s]+$/.test(v) ? null : "Use a full https:// URL");
const prefixed =
  (...p: string[]) =>
  (v: string) =>
    p.some((x) => v.startsWith(x)) ? null : `Should start with ${p.join(" or ")}`;

export const PROVIDERS: ProviderDef[] = [
  {
    id: "mpesa",
    name: "M-Pesa (Daraja)",
    category: "Payments",
    description: "STK push payments for paid tickets.",
    live: true,
    docs: "https://developer.safaricom.co.ke/",
    fields: [
      {
        name: "env",
        label: "Environment",
        kind: "select",
        options: [
          { value: "sandbox", label: "Sandbox" },
          { value: "production", label: "Production" },
        ],
        required: true,
      },
      { name: "consumer_key", label: "Consumer key", secret: true, required: true },
      { name: "consumer_secret", label: "Consumer secret", secret: true, required: true },
      {
        name: "shortcode",
        label: "Shortcode",
        required: true,
        placeholder: "174379",
        check: (v) => (/^\d{5,7}$/.test(v) ? null : "Use the 5–7 digit shortcode"),
      },
      {
        name: "shortcode_type",
        label: "Shortcode type",
        kind: "select",
        options: [
          { value: "Paybill", label: "Paybill" },
          { value: "Till", label: "Till (Buy Goods)" },
        ],
        required: true,
      },
      { name: "passkey", label: "Passkey", secret: true, required: true },
      {
        name: "callback_url",
        label: "Callback URL",
        kind: "url",
        required: true,
        hint: "Where Safaricom posts payment results. Include ?token=… if you set a callback token.",
        check: https,
      },
      {
        name: "callback_token",
        label: "Callback token",
        secret: true,
        hint: "Daraja doesn't sign callbacks; this shared token protects the callback URL.",
      },
    ],
  },
  {
    id: "sasapay",
    name: "SasaPay",
    category: "Payments",
    description: "Alternative mobile-money and bank payments.",
    live: false,
    docs: "https://developer.sasapay.app/",
    fields: [
      {
        name: "env",
        label: "Environment",
        kind: "select",
        options: [
          { value: "sandbox", label: "Sandbox" },
          { value: "production", label: "Production" },
        ],
        required: true,
      },
      { name: "client_id", label: "Client ID", required: true },
      { name: "client_secret", label: "Client secret", secret: true, required: true },
      {
        name: "merchant_code",
        label: "Merchant code",
        required: true,
        check: (v) => (/^\d{3,10}$/.test(v) ? null : "Use the numeric merchant code"),
      },
      { name: "callback_url", label: "Callback URL", kind: "url", required: true, check: https },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Payments",
    description: "Card payments.",
    live: false,
    docs: "https://dashboard.stripe.com/apikeys",
    fields: [
      {
        name: "publishable_key",
        label: "Publishable key",
        required: true,
        placeholder: "pk_live_…",
        check: prefixed("pk_live_", "pk_test_"),
      },
      {
        name: "secret_key",
        label: "Secret key",
        secret: true,
        required: true,
        check: prefixed("sk_live_", "sk_test_", "rk_live_", "rk_test_"),
        hint: "A restricted key (rk_…) with only the permissions MyEvents needs is safer.",
      },
      {
        name: "webhook_secret",
        label: "Webhook signing secret",
        secret: true,
        required: true,
        check: prefixed("whsec_"),
      },
    ],
  },
  {
    id: "sms",
    name: "SMS (Onfon Media)",
    category: "Messaging",
    description: "Sends tickets to buyers by SMS.",
    live: true,
    docs: "https://www.onfonmedia.co.ke/",
    fields: [
      { name: "api_key", label: "API key", secret: true, required: true },
      { name: "access_key", label: "Access key", secret: true, required: true },
      { name: "client_id", label: "Client ID", required: true },
      {
        name: "sender_id",
        label: "Sender ID",
        required: true,
        hint: "Must be approved by Onfon. Up to 11 letters or numbers.",
        check: (v) => (/^[A-Za-z0-9 ]{1,11}$/.test(v) ? null : "Up to 11 letters or numbers"),
      },
    ],
  },
];
