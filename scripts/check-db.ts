import * as dotenv from 'dotenv';
dotenv.config();

import { connectToDatabase } from "../src/lib/db/mongodb";
import mongoose from "mongoose";

async function checkStatus() {
  console.log("Checking MongoDB Connection Status...");
  try {
    await connectToDatabase();
    
    const states = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
      99: 'Uninitialized',
    };
    
    const state = mongoose.connection.readyState;
    console.log(`Connection State: ${states[state as keyof typeof states]} (${state})`);
    
    if (state === 1) {
      const db = mongoose.connection.db;
      if (db) {
        const admin = db.admin();
        const serverInfo = await admin.serverInfo();
        console.log(`MongoDB Version: ${serverInfo.version}`);
      }
      
      console.log("\nDatabase stats:");
      const collections = await mongoose.connection.db?.listCollections().toArray();
      console.log(`Collections found: ${collections?.length || 0}`);
      
      for (const col of collections || []) {
        const count = await mongoose.connection.db?.collection(col.name).countDocuments();
        console.log(`- ${col.name}: ${count} documents`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

checkStatus();
