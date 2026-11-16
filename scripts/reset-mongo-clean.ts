import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { User } from "../src/models/User";
import { FactorManagementService } from "../src/services/carbon/factorManagement.service";

async function resetCleanMongo() {
  console.log("============================================================");
  console.log("ECOINTEL: CLEAN DATABASE RESET & PURE MONGO INITIALIZATION");
  console.log("============================================================");

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Failed to get database instance from mongoose connection.");
  }

  console.log(`Connected to MongoDB Atlas: ${mongoose.connection.name}`);
  const collections = await db.listCollections().toArray();
  console.log(`Found ${collections.length} collections. Purging operational and test data...`);

  // Collections to wipe completely
  const collectionsToClear = [
    "users",
    "analysissessions",
    "components",
    "detectionresults",
    "pcbanalyses",
    "rulpredictions",
    "materialrecoveries",
    "repairassessments",
    "digitalpassports",
    "carbonimpacts",
    "reports",
    "reportshares",
    "marketplacelistings",
    "marketplaceorders",
    "marketplacereservations",
    "marketplacequoterequests",
    "marketplacereports",
    "marketplacetransactions",
    "impactledgerentries",
    "auditlogs",
    "notifications",
    "uploadedassets",
  ];

  for (const colName of collectionsToClear) {
    try {
      const exists = collections.some((c) => c.name === colName);
      if (exists) {
        const result = await db.collection(colName).deleteMany({});
        console.log(`  ✔ Cleared collection '${colName}': deleted ${result.deletedCount} documents.`);
      }
    } catch (err: any) {
      console.warn(`  ⚠ Warning clearing '${colName}':`, err.message);
    }
  }

  console.log("\nSeeding authoritative environmental standards & factor taxonomies...");
  await FactorManagementService.seedDefaultsIfNeeded();
  console.log("  ✔ Authoritative emission factors and impact methodologies initialized.");

  console.log("\nProvisioning primary clean admin account in MongoDB...");
  const adminPassword = "EcoIntelAdmin2026!";
  const passwordHash = await hashPassword(adminPassword);
  const adminUser = await User.create({
    name: "EcoIntel System Administrator",
    email: "admin@ecointel.org",
    passwordHash,
    role: "ADMIN",
    organizationName: "EcoIntel Global Circularity Network",
    department: "Executive Operations",
    isActive: true,
  });

  console.log(`  ✔ Administrator user created: ${adminUser.email} (ID: ${adminUser._id})`);

  console.log("\n============================================================");
  console.log("DATABASE SANITIZED: RUNNING WITH CLEAN MONGO ONLY");
  console.log("============================================================\n");
  process.exit(0);
}

resetCleanMongo().catch((err) => {
  console.error("Clean Mongo Reset Failed:", err);
  process.exit(1);
});
