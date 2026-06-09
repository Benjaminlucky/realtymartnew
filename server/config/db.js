"use strict";

const mongoose = require("mongoose");

let connected = false;

async function connectDB() {
  if (connected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || "mehurbs",
    });
    connected = true;
    console.log("[DB] MongoDB connected");
  } catch (err) {
    console.error("[DB] Connection failed:", err.message);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  connected = false;
  console.warn("[DB] MongoDB disconnected");
});

module.exports = { connectDB };
