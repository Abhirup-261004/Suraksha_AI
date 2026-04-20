import mongoose from "mongoose";
import { config } from "../config/env.js";
import { databaseState } from "./state.js";

export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    databaseState.connected = true;
    databaseState.mode = "mongo";
  } catch (error) {
    databaseState.connected = false;
    databaseState.mode = "memory";
    console.warn(
      `MongoDB unavailable at ${config.mongoUri}. Starting in in-memory mode instead. Data will reset when the server restarts.`
    );
  }
}
