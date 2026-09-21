import * as dotenv from 'dotenv';
dotenv.config();

import { connectToDatabase } from "../src/lib/db/mongodb";
import { User } from "../src/lib/db/models/User";
import { Component } from "../src/lib/db/models/Component";
import { MarketplaceListing } from "../src/lib/db/models/MarketplaceListing";
import mongoose from "mongoose";

async function seed() {
  console.log("Connecting to database...");
  await connectToDatabase();

  console.log("Clearing existing data...");
  await User.deleteMany({});
  await Component.deleteMany({});
  await MarketplaceListing.deleteMany({});

  console.log("Creating seed users...");
  const seller1 = await User.create({
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    name: "TerraCycle E-Waste Lab",
    email: "lab@terracycle.example",
    role: "recycler",
    verificationStatus: "verified",
    location: "Tokyo, Japan",
  });

  const seller2 = await User.create({
    walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    name: "LUMAFUSE Systems",
    email: "sales@lumafuse.example",
    role: "recycler",
    verificationStatus: "verified",
    location: "Berlin, Germany",
  });

  console.log("Creating seed components...");
  const comp1 = await Component.create({
    serialNumber: "comp_atmega328p_" + Date.now(),
    name: "ATmega328P Microcontroller",
    type: "CustomIC",
    manufacturer: "Microchip Tech",
    healthScore: 88,
    remainingUsefulLifeHours: 48000,
    confidenceScore: 0.98,
    status: "detected",
  });

  const comp2 = await Component.create({
    serialNumber: "comp_lm358_" + Date.now(),
    name: "LM358 Dual Op-Amp IC",
    type: "CustomIC",
    manufacturer: "Texas Instruments",
    healthScore: 92,
    remainingUsefulLifeHours: 56000,
    confidenceScore: 0.99,
    status: "detected",
  });

  console.log("Creating seed marketplace listings...");
  await MarketplaceListing.create({
    listingId: "mkt_capsule_01",
    componentId: comp1._id,
    title: "ATmega328P Microcontroller (Batch of 50)",
    priceUSD: 142.5,
    sellerId: seller1._id,
    status: "active",
    capsulePreviewUrl: "/images/marketplace/microchip_capsule.png",
  });

  await MarketplaceListing.create({
    listingId: "mkt_capsule_02",
    componentId: comp2._id,
    title: "LM358 Dual Operational Amplifiers (Batch of 100)",
    priceUSD: 85.0,
    sellerId: seller2._id,
    status: "active",
    capsulePreviewUrl: "/images/marketplace/opamp_capsule.png",
  });

  console.log("Seed completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
