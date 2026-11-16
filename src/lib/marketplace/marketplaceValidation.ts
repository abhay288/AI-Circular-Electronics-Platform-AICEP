import { z } from "zod";
import {
  LISTING_CONDITIONS,
  PRODUCT_CATEGORIES,
  PRICING_TYPES,
  CURRENCIES,
} from "./marketplaceTaxonomy";

export const createListingSchema = z.object({
  analysisId: z.string().optional(),
  componentId: z.string().optional(),
  passportId: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  category: z.enum(PRODUCT_CATEGORIES as unknown as [string, ...string[]]),
  subcategory: z.string().optional(),
  manufacturer: z.string().optional(),
  partNumber: z.string().optional(),
  packageType: z.string().optional(),
  condition: z.enum(LISTING_CONDITIONS as unknown as [string, ...string[]]),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  pricingType: z.enum(PRICING_TYPES as unknown as [string, ...string[]]).default("FIXED_PRICE"),
  price: z.number().min(0, "Price cannot be negative").optional(),
  currency: z.enum(CURRENCIES as unknown as [string, ...string[]]).default("INR"),
  minimumOrderQuantity: z.number().int().min(1).default(1),
  location: z
    .object({
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().default("India"),
      postalCode: z.string().optional(),
      streetAddress: z.string().optional(),
      isExactHidden: z.boolean().default(true),
    })
    .optional(),
  shipping: z
    .object({
      shippingMethod: z.string().default("STANDARD"),
      originCountry: z.string().default("India"),
      estimatedDeliveryDays: z.number().optional(),
      shippingCost: z.number().min(0).default(0),
      currency: z.enum(CURRENCIES as unknown as [string, ...string[]]).default("INR"),
      freeShippingThreshold: z.number().optional(),
    })
    .optional(),
  technicalSpecifications: z
    .object({
      manufacturer: z.string().optional(),
      partNumber: z.string().optional(),
      componentType: z.string().optional(),
      package: z.string().optional(),
      pinCount: z.number().optional(),
      dimensions: z.string().optional(),
      electricalRatings: z.string().optional(),
      boardLocation: z.string().optional(),
      revision: z.string().optional(),
      compatibleSystems: z.array(z.string()).optional(),
    })
    .optional(),
  evidence: z
    .array(
      z.object({
        type: z.enum([
          "INSPECTION_PHOTO",
          "TEST_REPORT",
          "REPAIR_RECORD",
          "DATASHEET",
          "MANUFACTURER_DOC",
          "PASSPORT_CERT",
        ]),
        title: z.string(),
        url: z.string(),
        hash: z.string().optional(),
        uploadedAt: z.string().optional(),
      })
    )
    .optional(),
  images: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const reserveListingSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  notes: z.string().optional(),
});

export const createOrderSchema = z.object({
  reservationId: z.string().optional(),
  items: z
    .array(
      z.object({
        listingId: z.string(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().optional(),
        currency: z.string().optional(),
      })
    )
    .min(1, "At least one item required"),
  shippingAddress: z
    .object({
      recipientName: z.string().min(2),
      street: z.string().min(3),
      city: z.string().min(2),
      state: z.string().optional(),
      country: z.string().min(2),
      postalCode: z.string().min(2),
      contactPhone: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

export const createQuoteSchema = z.object({
  listingId: z.string(),
  quantity: z.number().int().min(1),
  targetPricePerUnit: z.number().positive().optional(),
  currency: z.enum(CURRENCIES as unknown as [string, ...string[]]).optional(),
  targetDeliveryDate: z.string().optional(),
  technicalRequirements: z.string().optional(),
  message: z.string().optional(),
});

export const respondQuoteSchema = z.object({
  status: z.enum(["RESPONDED", "REJECTED", "ACCEPTED"]),
  offeredPricePerUnit: z.number().positive().optional(),
  sellerNotes: z.string().optional(),
});

export const reportListingSchema = z.object({
  reason: z.enum([
    "INCORRECT_INFORMATION",
    "COUNTERFEIT",
    "DAMAGED",
    "MISREPRESENTED_CONDITION",
    "UNAUTHORIZED_LISTING",
    "SAFETY_CONCERN",
    "OTHER",
  ]),
  description: z.string().min(10, "Report description must be at least 10 characters"),
  evidenceUrls: z.array(z.string()).optional(),
});
