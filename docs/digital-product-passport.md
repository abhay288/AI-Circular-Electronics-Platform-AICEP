# EcoIntel Digital Product Passport (DPP) & Blockchain Traceability

## 1. Executive Architecture Overview

Phase 7 establishes the **Digital Product Passport (DPP)** engine for circular electronics intelligence across Printed Circuit Boards (PCBs), components, modules, and complete electronic equipment. The passport provides a persistent, tamper-evident digital identity that unifies:

1. **AI Visual Detection & Taxonomy** (Phase 2)
2. **PCB Intelligence & Topology Reconstruction** (Phase 3)
3. **Electro-Thermal Health & RUL Predictions** (Phase 4)
4. **Precious & Base Metal Recovery Estimates** (Phase 5)
5. **Circularity & Repair Diagnostics** (Phase 6)
6. **Cryptographic Canonical Hashing & Blockchain Anchoring** (Phase 7)

> **CRITICAL SCIENTIFIC & REGULATORY PRINCIPLE:**
> "Blockchain anchoring verifies the integrity of the referenced passport data. It does not independently verify the truthfulness of every underlying measurement or AI prediction."

---

## 2. Passport Lifecycle & States

Every electronic asset receives a collision-resistant unique identifier:
- Standard Format: `ECP-DPP-YYYY-XXXXXX` or `DPP-ECI-XXXX-XXX` (generated cryptographically, never purely timestamps).

```
   [ CREATED ]
        │
        ▼
   [  ACTIVE  ] ───► [ TRANSFERRED ] (Custody handover)
        │                     │
        ▼                     ▼
   [ REPAIRED ] ───► [ REFURBISHED ]
        │
        ▼
   [ RECOVERED ] (Urban mining / hydrometallurgical recycling)
        │
        ▼
   [ RETIRED ] / [ RECYCLED ]
        │
        ▼
   [ REVOKED ] (Tamper, warranty recall, or compliance revocation)
```

Lifecycle states:
- `CREATED`: Initial passport issuance from multi-engine analysis.
- `ACTIVE`: Certified in circulation and monitored.
- `UPDATED`: Metadata, inspection reports, or telemetry updated.
- `TRANSFERRED`: Ownership or custody transferred to another organization.
- `REPAIRED`: Component replacement or solder reflow confirmed.
- `REFURBISHED`: Complete secondary reconditioning performed.
- `RECOVERED`: Asset dismantled for precious metal salvage.
- `RECYCLED`: Mechanical or hydrometallurgical recycling completed.
- `RETIRED`: End of life reached.
- `REVOKED`: Invalidated by authorized compliance officer.

---

## 3. Data Model & Minimal On-Chain Principle

### Off-Chain vs. On-Chain Segregation
Sensitive corporate intellectual property, private schematics, component supplier contracts, customer information, and raw multi-megabyte AI vision payloads are stored **off-chain** in MongoDB Atlas and secure object storage.

**Only the following minimal verification payload is anchored on-chain:**
```json
{
  "passportId": "DPP-ECI-7740-001",
  "passportVersion": 2,
  "contentHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "issuerId": "ORG-TERRACYCLE-01",
  "timestamp": "2026-10-06T15:30:00.000Z"
}
```

---

## 4. Canonical Hashing & Versioning

### Deterministic Serialization
To prevent false-positive tamper warnings caused by non-deterministic JSON property serialization, EcoIntel employs `canonicalizeData()`:
1. All JSON keys are sorted alphabetically in recursive fashion.
2. Transient and database-internal properties are excluded (`_id`, `__v`, `updatedAt`, `lastVerifiedAt`, `verificationStatus`, and `contentHash` itself).
3. The canonical JSON string is hashed using **SHA-256**.

```
Stable Object ──► Recursive Key Sort ──► JSON Serialization ──► SHA-256 ──► contentHash
```

### Append-Only Version Snapshots
- Version 1 is issued upon analysis completion.
- Any subsequent lifecycle update increments `version` (`v1` $\rightarrow$ `v2`), preserves `previousVersionHash`, and records a frozen snapshot in `versionHistory`.
- **Historical events and snapshots are immutable.**

---

## 5. Provenance System & Evidence Hierarchy

To ensure transparency, EcoIntel marks every key technical metric with an explicit evidence tier:

| Evidence Tier | Definition | UI Badge |
| :--- | :--- | :--- |
| **`VERIFIED`** | Direct physical bench scale or verified ledger event | `[VERIFIED]` (Green) |
| **`MEASURED`** | Physical caliper / optical scale calibrated measurement | `[MEASURED]` (Green) |
| **`KNOWN`** | Manufacturer certified product specification | `[KNOWN]` (Blue) |
| **`DATABASE_DERIVED`** | Scientific benchmark extrapolated from standard BOM | `[DATABASE-DERIVED]` (Purple) |
| **`AI_ESTIMATED`** | Machine learning prediction (e.g. YOLO, RUL-XGBoost) | `[AI ESTIMATE]` (Slate) |
| **`INFERRED`** | Algorithmic heuristic topology / trace extrapolation | `[INFERRED]` (Amber) |
| **`SIMULATED`** | Demonstration mock environment | `[SIMULATED DEMO]` (Cyan) |

---

## 6. Blockchain Provider Architecture

EcoIntel implements a pluggable `BlockchainProvider` abstraction:

```typescript
export interface BlockchainProvider {
  readonly name: "mock" | "polygon";
  registerPassport(input: RegisterPassportInput): Promise<BlockchainRegistration>;
  recordEvent(input: RecordEventInput): Promise<BlockchainEventRecord>;
  verifyPassport(input: VerifyPassportInput): Promise<VerificationResult>;
  getTransaction(txHash: string): Promise<BlockchainTransaction | null>;
}
```

### Mock Provider (`BLOCKCHAIN_PROVIDER=mock`)
- Used for testing, offline evaluation, and zero-gas local environments.
- Clearly stamped as **`DEMO BLOCKCHAIN (SIMULATED)`**.
- Transaction hashes explicitly formatted as `sim_0x...`.
- In-memory cryptographic ledger tracks hashes without making false public network claims.

### Polygon Provider (`BLOCKCHAIN_PROVIDER=polygon`)
- Connects to Polygon PoS via JSON-RPC.
- Requires `BLOCKCHAIN_RPC_URL`, `BLOCKCHAIN_CONTRACT_ADDRESS`, and `BLOCKCHAIN_PRIVATE_KEY`.
- If credentials are not configured, the engine **fails safely** with `"Blockchain registration unavailable"`, never fabricating fake Polygon transactions.

---

## 7. Public vs. Authenticated View & Security

### Organization Isolation (RBAC)
- All private queries (`GET /api/passports/:id`) enforce `organizationId`.
- Users cannot access passports belonging to other organizations unless granted `ADMIN` privileges.

### Public Verification Route (`/verify/:passportId`)
- Accessible without login or API token.
- Returns only sanitized public data:
  - Passport ID & Asset Type
  - Version & Status
  - Cryptographic validity & SHA-256 hash match
  - Blockchain anchor details (if verified)
  - Public summary metrics

---

## 8. QR Code Integration

Every passport generates a public SVG QR code linking to:
```
https://<platform-domain>/verify/<passportId>
```
Private data is never encoded directly inside the QR graphic; the QR acts strictly as an entrypoint to the public verification endpoint.
