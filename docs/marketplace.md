# Phase 8: EcoIntel Circular Marketplace & Recovered Component Exchange

## 1. Marketplace Architecture

EcoIntel is an enterprise circular electronics platform. Phase 8 transforms the platform from technical diagnostics into a traceable B2B circular electronics exchange where hardware assets, refurbished semiconductors, and recovered boards can be recirculated with verifiable technical provenance.

### Architectural Flow
```
                     +-----------------------------+
                     |    Next.js Frontend UI      |
                     |  /marketplace               |
                     |  /marketplace/[listingId]   |
                     |  /marketplace/seller        |
                     |  /marketplace/buyer         |
                     |  /marketplace/admin         |
                     +--------------+--------------+
                                    |
                                    v
                     +-----------------------------+
                     |     Marketplace APIs        |
                     |  /api/marketplace/*         |
                     +--------------+--------------+
                                    |
         +--------------------------+--------------------------+
         |                          |                          |
         v                          v                          v
+------------------+      +-------------------+      +-------------------+
|  ListingService  |      |   SearchService   |      | InventoryService  |
|  - Drafts        |      |   - Fast Filters  |      | - Atomic Holds    |
|  - Reviews       |      |   - Full Text     |      | - Reservations    |
|  - Verification  |      |   - Aggregations  |      | - Commit Orders   |
+--------+---------+      +-------------------+      +---------+---------+
         |                                                     |
         |         +-------------------------------------------+
         v         v
+------------------+------------------+
| MongoDB Atlas (Multi-Tenant Store)  |
| - MarketplaceListing                |
| - MarketplaceOrder                  |
| - MarketplaceReservation            |
| - MarketplaceQuoteRequest           |
| - MarketplaceTransaction (Audit)    |
+------------------+------------------+
                   |
                   v
+-------------------------------------+
| Phase 7 Digital Product Passport    |
| - Lifecycle Events:                 |
|   * LISTED                          |
|   * RESERVED                        |
|   * SOLD                            |
|   * LISTING_ARCHIVED                |
| - Blockchain Anchoring (Polygon)    |
+-------------------------------------+
```

---

## 2. Listing Lifecycle & State Machine

Every circular component follows an audited, multi-stage lifecycle:

```
[DRAFT]
   │
   ▼  (Seller submits)
[PENDING_REVIEW]
   │
   ├──► [REJECTED] / [REQUEST_CHANGES]
   │
   ▼  (Admin approval or Organization auto-approve)
[PUBLISHED]
   │
   ├──► [RESERVED]  (Temporary atomic inventory hold)
   │       │
   │       ├──► (Expired / Cancelled) ──► [PUBLISHED]
   │       └──► (Converted to Order)
   │
   ├──► [SOLD] / [UNAVAILABLE] (Inventory depleted to 0)
   │
   └──► [ARCHIVED] (De-listed by organization)
```

1. **`DRAFT`**: The seller can build, refine, and attach datasheets and inspection records without public visibility.
2. **`PENDING_REVIEW`**: Listing is locked for administrative review. Trust & safety audits provenance integrity.
3. **`PUBLISHED`**: Active and searchable on the circular marketplace.
4. **`RESERVED`**: In-stock units are temporarily held with an atomic TTL reservation timer.
5. **`SOLD`**: Fully allocated and transferred to an acquiring organization.
6. **`ARCHIVED`**: Soft-deleted. Will never silently re-appear.

---

## 3. Condition Taxonomy & Honesty Principle

A circular electronics listing **never** implies an unverified working guarantee. The seller must select a canonical condition:

| Condition | Meaning | Display Notice |
| :--- | :--- | :--- |
| `NEW` | Unused excess inventory / factory reels | Factory packaging verified |
| `USED_TESTED` | Operational benchmark passed | Test report or oscilloscope records attached |
| `USED_UNTESTED` | Intact recovery; testing not performed | **"Functional testing not verified. Sold for salvage or bench testing."** |
| `REFURBISHED` | Replaced solder balls, cleaned, reworked | Refurbishment certificate & functional test required |
| `REPAIRED` | Fixed solder defects or components replaced | Phase 6 repair intervention history displayed |
| `FOR_REPAIR` | Known fault detected; repairable | Defect coordinates and diagnostics visible |
| `FOR_PARTS` | Heavy damage, donor components only | Salvageable sub-components listed |
| `MATERIAL_RECOVERY` | Non-functional; high precious metals | Gold/copper recovery yield highlighted |
| `UNKNOWN` | Unassessed condition | Unverified state |

---

## 4. Verification Status & Evidence Tiers

Verification status is derived directly from technical system records:

- **`PASSPORT_VERIFIED`**: An immutable Digital Product Passport exists and is blockchain-anchored.
- **`PASSPORT_AVAILABLE`**: A digital product passport is attached but unanchored or pending on-chain commitment.
- **`TECHNICALLY_ASSESSED`**: Phase 4 AI Health / RUL or Phase 5 Material telemetry exists.
- **`SELLER_DECLARED`**: Telemetry unavailable; condition is based strictly on seller representation.
- **`DEMO`**: Clearly labeled demonstration data.

---

## 5. Phase 7 DPP & Blockchain Integration

Phase 8 cleanly hooks into the existing `DigitalPassportService` without duplicating passport models or blockchain logic:

1. **When listing is published**: Appends `LISTED` lifecycle event with listing ID, price, and seller organization.
2. **When inventory is held**: Appends `RESERVED` lifecycle event with reservation ID and expiry.
3. **When order is committed**: Appends `SOLD` lifecycle event with transfer details and acquiring organization.
4. **When archived**: Appends `LISTING_ARCHIVED` lifecycle event.

If the Polygon blockchain provider is active, these lifecycle events can be anchored on-chain with zero disruption.

---

## 6. Atomic Inventory & Anti-Double-Selling

To prevent race conditions, double-selling, and negative inventory, EcoIntel executes atomic MongoDB operations:

```typescript
// Atomic hold
await MarketplaceListing.findOneAndUpdate(
  {
    listingId,
    listingStatus: "PUBLISHED",
    quantityAvailable: { $gte: requestedQty }
  },
  {
    $inc: {
      quantityAvailable: -requestedQty,
      quantityReserved: requestedQty
    }
  }
);
```

- Expired reservations are automatically swept or released on demand.
- Converted reservations atomically transition `quantityReserved -> quantitySold`.

---

## 7. B2B Orders & Quotation Workflow

### Honest Payments
EcoIntel strictly adheres to an honest transaction principle:
- **No fake credit card captures or simulated payment gateways.**
- Listings default to `REQUEST_QUOTE` or `PAYMENT_PENDING`.
- Orders create verified reservation commits and immutable audit transactions.

### B2B Quotes
Buyers can request lot quotations specifying:
- Target delivery date
- Desired unit volume
- Inspection criteria
- Target price per unit

Sellers review and respond through `/marketplace/seller`.

---

## 8. Security & Organization Isolation

1. **Tenant Isolation**: Non-admin users are strictly scoped to their `organizationId`. A seller cannot modify or archive another organization's listing.
2. **Location Privacy**: A seller's private street address and exact postal code are never publicly exposed. The platform exposes only region and country (`location.isExactHidden = true`).
3. **Trust & Safety**: Any community or enterprise user can flag suspicious listings (`/api/marketplace/listings/[id]/report`).

---

## 9. Configuration & Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `MARKETPLACE_ENABLED` | `true` | Enables circular marketplace APIs and pages |
| `MARKETPLACE_REVIEW_REQUIRED` | `true` | Requires administrative review before publishing |
| `MARKETPLACE_DEFAULT_CURRENCY` | `INR` | Default platform currency |
| `MARKETPLACE_RESERVATION_MINUTES` | `30` | Default atomic hold timeout |
| `PAYMENT_PROVIDER` | `none` | Explicitly disables fake payment processing |
| `QUOTE_ENABLED` | `true` | Enables B2B quote request negotiation |

---

## 10. Limitations & Boundaries

1. **No Counterfeit Guarantees**: EcoIntel records technical provenance and passport integrity, but does not claim automated physical authenticity guarantees.
2. **No Fake Logistics**: Shipments are tracked via manual tracking assignments; no carrier scraping is fabricated.
3. **Carbon Accounting**: Enterprise CO2 and Scope 3 circularity metrics belong to Phase 9.
