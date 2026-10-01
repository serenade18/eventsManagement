// Client-side validation mirroring the backend rules (spec §13).
import { z } from "zod";
import { isKenyanPhone } from "./format";

const phone = z
  .string()
  .trim()
  .min(1, "Enter a phone number")
  .refine(isKenyanPhone, "Enter a Kenyan mobile number, e.g. 0712 345 678");

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .refine((v) => !/^\d+$/.test(v), "Password can't be only numbers");

const optionalEmail = z
  .string()
  .trim()
  .max(255)
  .refine(
    (v) => v === "" || z.string().email().safeParse(v).success,
    "Enter a valid email address",
  );

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(255),
    email: z
      .string()
      .trim()
      .min(1, "Enter your email")
      .email("Enter a valid email address")
      .max(255),
    phone,
    organization: z.string().trim().max(100),
    user_type: z.enum(["organizer", "sponsor"]),
    password,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
export type RegisterValues = z.infer<typeof registerSchema>;

export const purchaseSchema = z.object({
  quantity: z.number().int().min(1).max(10),
  buyer_name: z.string().trim().min(1, "Enter your full name").max(255),
  buyer_phone: phone,
  buyer_email: optionalEmail,
});
export type PurchaseValues = z.infer<typeof purchaseSchema>;

export const tierSchema = z
  .object({
    name: z.string().trim().min(1, "Name the tier").max(100),
    description: z.string().trim(),
    price: z
      .string()
      .trim()
      .min(1, "Enter a price (0 for free)")
      .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Use a number with at most 2 decimals")
      .refine((v) => Number(v) <= 99_999_999.99, "Price is too high"),
    quantity: z
      .string()
      .trim()
      .min(1, "Enter a capacity")
      .refine((v) => /^\d+$/.test(v) && Number(v) >= 1, "Use a whole number, at least 1"),
    sales_start: z.string().min(1, "Choose when sales start"),
    sales_end: z.string().min(1, "Choose when sales end"),
  })
  .refine((t) => !t.sales_start || !t.sales_end || t.sales_end > t.sales_start, {
    path: ["sales_end"],
    message: "Sales must end after they start",
  });

const MAX_POSTER = 5 * 1024 * 1024;
export const POSTER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a title").max(255),
    category: z.string().trim().min(1, "Choose or type a category").max(255),
    description: z.string().trim().min(1, "Describe the event"),
    venue: z.string().trim().min(1, "Enter the venue").max(255),
    date: z.string().min(1, "Choose a date"),
    time: z.string().min(1, "Choose a start time"),
    poster: z
      .custom<File | null>()
      .refine((f) => !f || POSTER_TYPES.includes(f.type), "Use a JPG, PNG or WebP image")
      .refine((f) => !f || f.size <= MAX_POSTER, "Poster must be 5 MB or smaller"),
    is_open: z.boolean(),
    is_free: z.boolean(),
    is_feature: z.boolean(),
    tiersLocked: z.boolean(),
    tiers: z.array(tierSchema),
  })
  .superRefine((v, ctx) => {
    if (v.tiersLocked) return;
    if (v.tiers.length === 0)
      ctx.addIssue({ code: "custom", path: ["tiers"], message: "Add at least one ticket tier" });
    const eventStart = v.date && v.time ? `${v.date}T${v.time}` : "";
    v.tiers.forEach((t, i) => {
      if (eventStart && t.sales_end && t.sales_end > eventStart)
        ctx.addIssue({
          code: "custom",
          path: ["tiers", i, "sales_end"],
          message: "Sales can't end after the event starts",
        });
    });
  });
export type EventValues = z.infer<typeof eventSchema>;
export type TierValues = z.infer<typeof tierSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(255),
  phone,
  organization: z.string().trim().max(100),
  country: z.string().trim().max(100),
  city: z.string().trim().max(100),
  bio: z.string().trim(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    new_password: password,
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  })
  .refine((v) => v.new_password !== v.current_password, {
    path: ["new_password"],
    message: "Choose a password different from your current one",
  });
export type PasswordValues = z.infer<typeof passwordSchema>;

export const lookupSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, "Enter a ticket number or order reference")
    .regex(
      /^[0-9a-fA-F]{12}(-\d+)?$/,
      "That doesn't look right: it's 12 letters and numbers, sometimes followed by -2, -3…",
    ),
});
