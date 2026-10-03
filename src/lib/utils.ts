import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Global conversion rate: 1 USD = ₹86.50 INR
export const USD_TO_INR_RATE = 86.5;

export function toINR(usdAmount: number): number {
  return Math.round(usdAmount * USD_TO_INR_RATE);
}

/**
 * Format any numerical cost/amount in Indian Rupees (₹ / INR).
 * If fromUSD is true, converts at current USD -> INR rate.
 */
export function formatINR(amount: number, fromUSD: boolean = true): string {
  const inr = fromUSD ? amount * USD_TO_INR_RATE : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(inr));
}

export function formatCurrency(amount: number, fromUSD: boolean = true): string {
  return formatINR(amount, fromUSD);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}
