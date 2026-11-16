import mongoose from "mongoose";
import { MarketplaceListing, IMarketplaceListing } from "@/models/MarketplaceListing";
import { MarketplaceReservation, IMarketplaceReservation } from "@/models/MarketplaceReservation";
import { MarketplaceTransaction } from "@/models/MarketplaceTransaction";
import { DigitalPassportService } from "@/services/passport.service";
import { AuditLog } from "@/models/AuditLog";
import { logger } from "@/lib/logger";

export interface ReserveRequest {
  listingId: string;
  quantity: number;
  buyerOrganizationId: string;
  buyerUserId: string;
  durationMinutes?: number;
  notes?: string;
}

export interface CommitOrderRequest {
  reservationId?: string;
  listingId: string;
  quantity: number;
  orderId: string;
  buyerOrganizationId: string;
  buyerUserId: string;
  sellerOrganizationId: string;
  unitPrice?: number;
  currency?: string;
}

export class MarketplaceInventoryService {
  /**
   * Default reservation timeout in minutes (from env or fallback to 30)
   */
  public static getReservationMinutes(): number {
    const envVal = process.env.MARKETPLACE_RESERVATION_MINUTES;
    const parsed = envVal ? parseInt(envVal, 10) : 30;
    return isNaN(parsed) || parsed <= 0 ? 30 : parsed;
  }

  /**
   * Atomically reserves quantity for a buyer organization.
   * Prevents race conditions and double-selling using atomic findOneAndUpdate.
   */
  public static async reserveQuantity(
    params: ReserveRequest
  ): Promise<{ reservation: IMarketplaceReservation; listing: IMarketplaceListing }> {
    const { listingId, quantity, buyerOrganizationId, buyerUserId, notes } = params;

    if (!quantity || quantity <= 0) {
      throw new Error("Invalid reservation quantity. Must be at least 1.");
    }

    const durationMins = params.durationMinutes || this.getReservationMinutes();
    const expiresAt = new Date(Date.now() + durationMins * 60 * 1000);

    // Atomically decrement quantityAvailable and increment quantityReserved
    // MUST verify listing is PUBLISHED and quantityAvailable >= requested quantity
    const updatedListing = await MarketplaceListing.findOneAndUpdate(
      {
        listingId,
        listingStatus: "PUBLISHED",
        quantityAvailable: { $gte: quantity },
      },
      {
        $inc: {
          quantityAvailable: -quantity,
          quantityReserved: quantity,
        },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    if (!updatedListing) {
      // Check why it failed
      const existing = await MarketplaceListing.findOne({ listingId });
      if (!existing) {
        throw new Error(`Listing not found: ${listingId}`);
      }
      if (existing.listingStatus !== "PUBLISHED") {
        throw new Error(`Listing is not available for reservation (Status: ${existing.listingStatus}).`);
      }
      if (existing.quantityAvailable < quantity) {
        throw new Error(
          `Insufficient inventory. Requested ${quantity}, but only ${existing.quantityAvailable} available.`
        );
      }
      throw new Error("Failed to reserve inventory due to concurrent request conflict. Please try again.");
    }

    // If all available inventory is reserved, mark status as RESERVED
    if (updatedListing.quantityAvailable === 0) {
      updatedListing.listingStatus = "RESERVED";
      await updatedListing.save();
    }

    // Create reservation record
    const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const reservation = await MarketplaceReservation.create({
      reservationId,
      listingId,
      buyerOrganizationId,
      buyerUserId,
      quantity,
      status: "ACTIVE",
      expiresAt,
      notes,
    });

    // Passport Lifecycle Integration: Record RESERVED event if passport attached
    if (updatedListing.passportId) {
      try {
        await DigitalPassportService.addLifecycleEvent(
          updatedListing.passportId,
          {
            eventType: "RESERVED",
            title: `Component Reserved on Circular Marketplace`,
            description: `Reserved ${quantity} units by Organization ${buyerOrganizationId} (Reservation: ${reservationId})`,
            location: updatedListing.location?.country || "Global",
            actor: {
              organization: buyerOrganizationId,
              userId: buyerUserId,
              role: "BUYER",
            },
            data: {
              listingId,
              reservationId,
              reservedQuantity: quantity,
              expiresAt: expiresAt.toISOString(),
            },
          },
          buyerUserId
        );
      } catch (err: any) {
        logger.warn(`[MarketplaceInventory] Failed to append RESERVED passport event: ${err.message}`);
      }
    }

    // Audit log
    await AuditLog.create({
      action: "MARKETPLACE_RESERVE_SUCCESS",
      resource: "MarketplaceListing",
      resourceId: listingId,
      userId: buyerUserId,
      organizationId: buyerOrganizationId,
      metadata: { reservationId, quantity, expiresAt },
      timestamp: new Date(),
    });

    return { reservation, listing: updatedListing };
  }

  /**
   * Cancels or expires an active reservation, returning reserved quantity back to available.
   */
  public static async releaseReservation(
    reservationId: string,
    reason: "EXPIRED" | "CANCELLED" = "CANCELLED",
    actorUserId?: string
  ): Promise<{ reservation: IMarketplaceReservation; listing: IMarketplaceListing }> {
    const reservation = await MarketplaceReservation.findOne({
      reservationId,
      status: "ACTIVE",
    });

    if (!reservation) {
      throw new Error(`Active reservation not found: ${reservationId}`);
    }

    // Mark reservation as CANCELLED or EXPIRED
    reservation.status = reason;
    await reservation.save();

    // Atomically restore listing available quantity and decrement reserved
    const updatedListing = await MarketplaceListing.findOneAndUpdate(
      { listingId: reservation.listingId },
      {
        $inc: {
          quantityAvailable: reservation.quantity,
          quantityReserved: -reservation.quantity,
        },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    if (!updatedListing) {
      throw new Error(`Target listing for reservation not found: ${reservation.listingId}`);
    }

    // If listing was previously RESERVED but now has available quantity, restore to PUBLISHED
    if (updatedListing.listingStatus === "RESERVED" && updatedListing.quantityAvailable > 0) {
      updatedListing.listingStatus = "PUBLISHED";
      await updatedListing.save();
    }

    await AuditLog.create({
      action: `MARKETPLACE_RESERVATION_${reason}`,
      resource: "MarketplaceListing",
      resourceId: reservation.listingId,
      userId: actorUserId || "SYSTEM",
      organizationId: reservation.buyerOrganizationId,
      metadata: { reservationId, reason, restoredQuantity: reservation.quantity },
      timestamp: new Date(),
    });

    return { reservation, listing: updatedListing };
  }

  /**
   * Commits an order (either from an active reservation or direct purchase).
   * Atomically transitions inventory to quantitySold.
   */
  public static async commitOrderInventory(
    params: CommitOrderRequest
  ): Promise<{ listing: IMarketplaceListing; transaction: any }> {
    const {
      reservationId,
      listingId,
      quantity,
      orderId,
      buyerOrganizationId,
      buyerUserId,
      sellerOrganizationId,
      unitPrice,
      currency,
    } = params;

    let listing: IMarketplaceListing | null = null;

    if (reservationId) {
      // 1. Convert active reservation
      const resDoc = await MarketplaceReservation.findOneAndUpdate(
        { reservationId, status: "ACTIVE" },
        { status: "CONVERTED", updatedAt: new Date() },
        { new: true }
      );

      if (!resDoc) {
        throw new Error(`Active reservation ${reservationId} not found or already converted.`);
      }

      // Decrement reserved, increment sold
      listing = await MarketplaceListing.findOneAndUpdate(
        {
          listingId,
          quantityReserved: { $gte: quantity },
        },
        {
          $inc: {
            quantityReserved: -quantity,
            quantitySold: quantity,
          },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );
    } else {
      // 2. Direct purchase from available quantity
      listing = await MarketplaceListing.findOneAndUpdate(
        {
          listingId,
          listingStatus: "PUBLISHED",
          quantityAvailable: { $gte: quantity },
        },
        {
          $inc: {
            quantityAvailable: -quantity,
            quantitySold: quantity,
          },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );
    }

    if (!listing) {
      throw new Error(
        `Failed to commit inventory for listing ${listingId}. Inventory insufficient or condition not met.`
      );
    }

    // If completely depleted, mark SOLD
    if (listing.quantityAvailable === 0 && listing.quantityReserved === 0) {
      listing.listingStatus = "SOLD";
      await listing.save();
    }

    // Record immutable MarketplaceTransaction
    const txId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const totalAmount = unitPrice ? unitPrice * quantity : undefined;
    const tx = await MarketplaceTransaction.create({
      transactionId: txId,
      orderId,
      listingId,
      buyerOrganizationId,
      sellerOrganizationId,
      buyerId: buyerUserId,
      assetId: listing.componentId || listing.analysisId,
      passportId: listing.passportId,
      quantity,
      totalAmount,
      amountINR: currency === "INR" ? totalAmount : undefined,
      amountUSD: currency === "USD" ? totalAmount : undefined,
      currency: currency || listing.currency || "INR",
      status: "COMPLETED",
      paymentStatus: "NOT_APPLICABLE",
      escrowStatus: "RELEASED",
      timestamp: new Date(),
    });

    // Passport Lifecycle Integration: Record SOLD event if passport attached
    if (listing.passportId) {
      try {
        await DigitalPassportService.addLifecycleEvent(
          listing.passportId,
          {
            eventType: "SOLD",
            title: `Component Transferred / Sold on Circular Marketplace`,
            description: `Transferred ${quantity} units from Organization ${sellerOrganizationId} to Organization ${buyerOrganizationId} (Order: ${orderId})`,
            location: listing.location?.country || "Global",
            actor: {
              organization: sellerOrganizationId,
              userId: buyerUserId,
              role: "SELLER",
            },
            data: {
              listingId,
              orderId,
              transactionId: txId,
              quantity,
              buyerOrganizationId,
              sellerOrganizationId,
            },
          },
          buyerUserId
        );
      } catch (err: any) {
        logger.warn(`[MarketplaceInventory] Failed to append SOLD passport event: ${err.message}`);
      }
    }

    return { listing, transaction: tx };
  }

  /**
   * Sweeps and automatically releases expired reservations.
   */
  public static async expireStaleReservations(): Promise<number> {
    const now = new Date();
    const expiredReservations = await MarketplaceReservation.find({
      status: "ACTIVE",
      expiresAt: { $lt: now },
    });

    let count = 0;
    for (const res of expiredReservations) {
      try {
        await this.releaseReservation(res.reservationId, "EXPIRED", "SYSTEM_SWEEPER");
        count++;
      } catch (err: any) {
        logger.warn(`[MarketplaceInventory] Error expiring reservation ${res.reservationId}: ${err.message}`);
      }
    }

    return count;
  }
}
