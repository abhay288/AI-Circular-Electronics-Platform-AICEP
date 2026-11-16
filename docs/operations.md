# EcoIntel Operations & Observability Runbook

Operational procedures, monitoring health endpoints, Redis queue management, and database index maintenance.

---

## 1. System Health Monitoring

EcoIntel exposes modular, safe health endpoints designed for Kubernetes liveness/readiness probes and Datadog/Prometheus synthetic checks:

| Endpoint | Probe Type | Description |
| :--- | :--- | :--- |
| `GET /api/health` | Platform Global | Global uptime, timestamp, and core service status rollup. |
| `GET /api/health/database` | Readiness | MongoDB connection state, replica set status, and ping latency. |
| `GET /api/health/queues` | Liveness | Redis connection state and BullMQ queue throughput (`report-generation`). |
| `GET /api/health/ai` | Dependency | AI model service availability (YOLO detection, XGBoost RUL, vision endpoints). |
| `GET /api/health/storage` | Dependency | Object storage reachability for image uploads and PDF report storage. |

All responses return standard HTTP 200 on healthy execution and HTTP 503 on service degradation. Internal passwords and infrastructure secrets are strictly excluded from output.

---

## 2. Queue & Worker Management

Asynchronous workloads (report generation, PDF compilation, ML inference) are handled via BullMQ backed by Redis:

- **Queue Name**: `report-generation`
- **Worker Configuration**:
  - Concurrency: 5 jobs per worker instance.
  - Backoff: Exponential (initial delay 5000ms, max 3 attempts).
  - Dead Letter Handling: Failed jobs after 3 attempts transition to status `FAILED` with an alert logged to `Notification`.
- **Graceful Fallback**: If Redis is offline during development or maintenance windows, the system automatically falls back to synchronous in-process generation to prevent operational lockup.

---

## 3. Database Indexes

Ensure production database indexes are built to prevent full-collection scans (`COLLSCAN`):

```javascript
// AnalysisSession
db.analysissessions.createIndex({ analysisId: 1 }, { unique: true });
db.analysissessions.createIndex({ organizationId: 1, createdAt: -1 });
db.analysissessions.createIndex({ status: 1 });

// Component
db.components.createIndex({ analysisId: 1 });
db.components.createIndex({ componentId: 1 }, { unique: true });

// DigitalPassport
db.digitalpassports.createIndex({ passportId: 1 }, { unique: true });
db.digitalpassports.createIndex({ analysisId: 1 });
db.digitalpassports.createIndex({ status: 1 });

// Report
db.reports.createIndex({ reportId: 1 }, { unique: true });
db.reports.createIndex({ analysisId: 1, version: -1 });
db.reports.createIndex({ organizationId: 1, createdAt: -1 });

// Notification
db.notifications.createIndex({ organizationId: 1, read: 1, createdAt: -1 });
db.notifications.createIndex({ notificationId: 1 }, { unique: true });

// AuditLog
db.auditlogs.createIndex({ organizationId: 1, timestamp: -1 });
db.auditlogs.createIndex({ resource: 1, resourceId: 1 });
```

---

## 4. Backup & Disaster Recovery

1. **MongoDB Atlas Continuous Backup**:
   - Automated daily snapshots retained for 35 days.
   - Point-in-time recovery (PITR) window set to 7 days for transactional rollback.
2. **Object Storage Replication**:
   - S3 versioning enabled on buckets containing generated PDF reports and high-resolution raw PCB imagery.
   - Cross-region replication (CRR) recommended for disaster recovery compliance.
3. **Audit Trail Immutability**:
   - `AuditLog` collection configured with append-only access permissions to satisfy enterprise compliance requirements.
