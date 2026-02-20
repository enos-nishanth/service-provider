import { z } from "zod";

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const providerSignupSchema = signupSchema.extend({
  primarySkill: z.string().min(1, "Please select your primary skill"),
  serviceLocation: z.string().min(3, "Service location must be at least 3 characters"),
  serviceDescription: z.string().optional(),
});

// Booking validation
export const bookingSchema = z.object({
  providerId: z.string().uuid("Invalid provider ID"),
  date: z.date(),
  time: z.string().min(1, "Please select a time slot"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  notes: z.string().optional(),
});

// Profile validation
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number")
    .optional()
    .or(z.literal("")),
  service_location: z.string().optional(),
  service_description: z.string().optional(),
});

// Payment validation
export const paymentSchema = z.object({
  paymentMethod: z.enum(["upi", "card", "wallet", "cod"]),
  upiId: z.string().optional(),
});

// Admin validation
export const kycReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

// Helper function to sanitize HTML input
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Validate and sanitize
export const validateAndSanitize = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: firstError.message,
    };
  }
  
  return {
    success: true,
    data: result.data,
  };
};
