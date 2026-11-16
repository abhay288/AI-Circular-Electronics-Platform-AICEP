# EcoIntel Security Architecture & Threat Model

Enterprise security specifications, access boundaries, data classification, and mitigation controls for EcoIntel.

---

## 1. Data Classification Model

| Level | Classification | Scope | Controls |
| :--- | :--- | :--- | :--- |
| **L1** | **PUBLIC** | Digital product passport public verification, public marketplace listings. | Unauthenticated read-only; no internal telemetry or commercial pricing. |
| **L2** | **ORGANIZATION** | Analysis sessions, detected components, PCB layouts, health scores, reports. | Scoped to authenticated users within the same `organizationId`. |
| **L3** | **CONFIDENTIAL** | Repair logs, technician notes, marketplace transactions, private shares. | Strict RBAC (`ORG_ADMIN`, `TECHNICIAN`, `BUYER`, `SELLER`). |
| **L4** | **RESTRICTED** | Blockchain private keys, cryptographic signing seeds, JWT secrets, billing. | KMS / HSM protected, environment variable injection only. |

---

## 2. Authentication & Authorization (RBAC)

1. **JSON Web Tokens (JWT)**:
   - Signed with HMAC-SHA256 or RS256.
   - Short expiration (15 minutes access token, 7 days refresh token).
   - Tenant isolation: every token embeds `userId` and `organizationId`.
2. **Multi-Tenant Isolation**:
   - Queries at service layers enforce `organizationId: session.orgId`.
   - Child collection lookups cross-reference `AnalysisSession` before returning records.
3. **Role Capabilities**:
   - `PLATFORM_ADMIN`: Global cross-org read, provider config, system metrics.
   - `ORG_ADMIN`: User invitations, branding settings, organization reports.
   - `ENGINEER`: Asset upload, vision triggering, technical export.
   - `TECHNICIAN`: Repair assessment execution, part harvesting logs.
   - `AUDITOR`: View-only access to passports, audit trails, and ESG disclosures.

---

## 3. Threat Mitigation Matrix

| Threat Vector | Potential Impact | EcoIntel Mitigation Control |
| :--- | :--- | :--- |
| **NoSQL Injection** | Unauthorized data access via MongoDB operators. | Mongoose strict schema casting; sanitization of all query parameters; strict type enforcement in API routes. |
| **Cross-Tenant Data Leakage** | Organization A viewing Organization B assets. | Mandatory `organizationId` scoping in all repository queries (`childMatchQuery` filters). |
| **Malicious File Upload** | Remote code execution via rigged image or Gerber files. | Strict MIME-type validation, file extension checks, max size limits (25MB), isolated S3 bucket storage. |
| **SSRF via Webhooks** | Internal metadata service exploitation. | Whitelisted URL validation, DNS rebinding protection, restricted egress network policies. |
| **DDoS / Brute Force** | Service degradation or token brute forcing. | Redis-backed token bucket rate limiting (120 req/min authenticated, 30 req/min public). |
| **Secret Exposure** | Compromised credentials via logs or client responses. | Centralized safe error formatting (`errorId`, `safeMessage`); sanitization of stack traces; zero secrets in frontend bundles. |

---

## 4. Audit Trail & Non-Repudiation

Every mutating action generates an immutable `AuditLog` entry:
- `timestamp`: UTC timestamp.
- `userId`: Acting user identifier.
- `organizationId`: Associated tenant.
- `action`: Action verb (e.g., `REPORT_GENERATED`, `PASSPORT_TRANSFERRED`).
- `resource` & `resourceId`: Affected entity.
- `ipAddress` & `userAgent`: Client metadata.
- `details`: Metadata changes and previous state hashes.
