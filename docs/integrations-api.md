# Integrations API

The admin **Integrations** page (`/console/integrations`) lets admins manage SMS and
payment-provider credentials. Implemented in the backend by the
`hostmeApps.integrations` app (hostmeBackend); the in-browser mock
(`src/lib/api/mock.ts`) implements the same contract for demo mode.

Credentials saved here take precedence; anything not saved falls back to the
`MPESA_*` / `SMS_*` environment variables, and a provider never saved in the console
keeps running from the environment exactly as before.

All endpoints: **admin only** (403 otherwise), JSON, wrapped in the usual
`{"error", "message", "data"}` envelope.

## Rules the backend enforces

1. **Secrets are write-only.** Never return a secret's value. Return
   `{"value": null, "configured": true, "last4": "c919"}`.
2. **Re-authenticate every change.** `PATCH` carries the admin's current `password`;
   reject a wrong one with **403** `{"detail": "Incorrect password"}`.
3. **Encrypted at rest** with Fernet, keyed by `INTEGRATIONS_ENCRYPTION_KEY` (derived
   from `SECRET_KEY` if unset; set a dedicated key in production). Values are never logged.
4. **Audited**: `IntegrationAuditLog` records who, when, from which IP, and which field
   names changed (never values). Viewable read-only in Django admin.
5. `enabled: true` is refused while a required field is missing (400 with a message).
6. Credentials are read at request time, so a change applies without a redeploy.
   Turning M-Pesa off makes paid purchases fail cleanly ("Paid tickets are temporarily
   unavailable"); turning SMS off skips texts and leaves `sms_sent_at` empty.
7. Rate-limited (`INTEGRATIONS_THROTTLE_RATE`, default 60/hour per admin).
8. Secrets shorter than 8 characters don't expose their last 4.

## Endpoints

`GET /settings/integrations/` → `data: Integration[]`

```json
{"provider": "mpesa", "enabled": true,
 "fields": {
   "env": {"value": "sandbox", "configured": true, "last4": null},
   "consumer_key": {"value": null, "configured": true, "last4": "x9Qa"},
   "shortcode": {"value": "174379", "configured": true, "last4": null}
 },
 "updated_at": "2026-10-01T12:00:00Z", "updated_by": "HostMe Admin"}
```

`PATCH /settings/integrations/:provider/` → `data: Integration`

```json
{"password": "…", "enabled": true, "fields": {"passkey": "new-value", "shortcode": "600000"}}
```

Only changed fields are sent; omitted secrets stay as they are. Field validation errors:
`400 {"error": true, "message": "Validation Error", "errors": {"shortcode": ["…"]}}`.

`POST /settings/integrations/:provider/test/` → `data: {"ok": bool, "message": str}`.
Makes a harmless call with the stored credentials (Daraja: fetch an OAuth token; Onfon:
balance check; Stripe: `GET /v1/balance`; SasaPay: fetch a token). Never sends money or SMS.
The Onfon balance and SasaPay token endpoints should be confirmed against those
providers' current docs.

## Providers and fields

| Provider | Field | Secret | Required |
|---|---|---|---|
| `mpesa` | `env` (`sandbox`/`production`), `shortcode`, `shortcode_type` (`Paybill`/`Till`), `callback_url` | no | yes |
| | `consumer_key`, `consumer_secret`, `passkey` | yes | yes |
| | `callback_token` | yes | no |
| `sms` (Onfon) | `client_id`, `sender_id` | no | yes |
| | `api_key`, `access_key` | yes | yes |
| `sasapay` | `env`, `client_id`, `merchant_code`, `callback_url` | no | yes |
| | `client_secret` | yes | yes |
| `stripe` | `publishable_key` | no | yes |
| | `secret_key`, `webhook_secret` | yes | yes |

SasaPay and Stripe are **not wired into checkout yet**; the UI labels them so. Storing
their keys has no effect until the backend adds those payment flows.
