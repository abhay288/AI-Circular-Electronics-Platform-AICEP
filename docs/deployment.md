# EcoIntel Production Deployment Guide

Guide for deploying EcoIntel across multi-tenant cloud environments (AWS, GCP, Azure, or On-Premises Kubernetes).

---

## 1. System Topology

```
                         [ Cloudflare / Load Balancer ]
                                       │
                         [ Next.js 15 Web Application ]
                                (Port 3000)
                                       │
                  ┌────────────────────┼────────────────────┐
                  │                    │                    │
            [ REST APIs ]       [ BullMQ Workers ]   [ AI Inference Microservice ]
                                  (Report/Vision)      (FastAPI / Python YOLO)
                  │                    │                    │
                  └─────────┬──────────┴─────────┬──────────┘
                            │                    │
                   [ MongoDB Atlas ]       [ Redis 7 ]
                     (Primary Store)        (Queues/Cache)
                            │
               [ S3 / MinIO Object Storage ]
                  (Artifacts, Images, PDFs)
```

---

## 2. Infrastructure Requirements

| Component | Minimum (Staging) | Recommended (Enterprise Production) |
| :--- | :--- | :--- |
| **Web / Backend** | 2 vCPU, 4 GB RAM | 4 vCPU, 8 GB RAM (Auto-scaling 2–8 replicas) |
| **BullMQ Workers** | 2 vCPU, 4 GB RAM | 4 vCPU, 8 GB RAM (Worker pool) |
| **AI Inference** | 4 vCPU, 8 GB RAM (CPU) | 8 vCPU, 16 GB RAM + 1x NVIDIA T4/A10G GPU |
| **MongoDB** | M10 Cluster (10 GB) | M30+ High-Availability Replica Set (100 GB+) |
| **Redis** | Redis 7 Single (1 GB) | Redis Sentinel / Cluster (4 GB+) |
| **Object Storage** | S3 Standard / MinIO | S3 Multi-Region with Object Versioning |

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env.production` and populate all production credentials:

```bash
cp .env.example .env.production
```

Key Production Settings:
- `NODE_ENV=production`
- `MONGODB_URI`: High-availability connection string with TLS/SSL.
- `REDIS_URL`: Redis connection string with password authentication.
- `JWT_SECRET`: 64+ character cryptographically secure entropy string.
- `S3_ENDPOINT`, `S3_BUCKET`: Enterprise object storage with IAM role authentication.
- `BLOCKCHAIN_RPC_URL`: Dedicated node endpoint (e.g., Alchemy / Infura / Polygon).

---

## 4. Container Deployment (Docker & Compose)

### 4.1 Production Dockerfile (Next.js Multi-Stage)
EcoIntel includes an optimized multi-stage `Dockerfile`:
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### 4.2 Starting Services via Docker Compose
```bash
docker compose -f docker-compose.yml up -d --build
```

---

## 5. Database Indexes & Maintenance

Execute index creation before pointing traffic:
```bash
npm run db:index-audit
```
Automated daily snapshots and point-in-time recovery (PITR) must be enabled on MongoDB Atlas.

---

## 6. Zero-Downtime Rolling Update Strategy

1. Run automated schema migrations / index builds.
2. Deploy BullMQ workers (backward-compatible with job payloads).
3. Perform rolling deployment of web nodes behind reverse proxy.
4. Verify health checks via `GET /api/health`.
