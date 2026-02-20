// Pricing configuration for HandyHive
// Centralized pricing logic to avoid hardcoded values

export const PRICING_CONFIG = {
  // Base service prices by category
  baseServicePrice: {
    plumbing: 299,
    electrical: 349,
    carpentry: 399,
    painting: 449,
    cleaning: 249,
    'ac-repair': 499,
    appliance: 399,
    pest: 349,
    default: 299,
  },
  
  // Additional charges
  visitCharge: 49,
  
  // Tax rate (18% GST for India)
  taxRate: 0.18,
  
  // Platform commission (percentage)
  platformCommission: 0.15, // 15%
  
  // Emergency pricing multiplier (for urgent/night/holiday requests)
  emergencyMultiplier: 1.5,
  
  // Minimum booking amount
  minimumBookingAmount: 100,
};

/**
 * Calculate total booking amount
 */
export const calculateBookingAmount = (
  serviceCategory: string,
  isEmergency: boolean = false
) => {
  const basePrice = PRICING_CONFIG.baseServicePrice[serviceCategory as keyof typeof PRICING_CONFIG.baseServicePrice] 
    || PRICING_CONFIG.baseServicePrice.default;
  
  const adjustedBasePrice = isEmergency 
    ? basePrice * PRICING_CONFIG.emergencyMultiplier 
    : basePrice;
  
  const subtotal = adjustedBasePrice + PRICING_CONFIG.visitCharge;
  const tax = subtotal * PRICING_CONFIG.taxRate;
  const total = subtotal + tax;
  
  return {
    basePrice: adjustedBasePrice,
    visitCharge: PRICING_CONFIG.visitCharge,
    subtotal,
    tax,
    total: Math.round(total * 100) / 100, // Round to 2 decimal places
  };
};

/**
 * Calculate provider earnings after platform commission
 */
export const calculateProviderEarnings = (bookingAmount: number) => {
  const commission = bookingAmount * PRICING_CONFIG.platformCommission;
  const earnings = bookingAmount - commission;
  
  return {
    bookingAmount,
    commission: Math.round(commission * 100) / 100,
    earnings: Math.round(earnings * 100) / 100,
  };
};

/**
 * Format currency for display (Indian Rupees)
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
