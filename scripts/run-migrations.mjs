#!/usr/bin/env node
import { execSync } from "child_process";

console.log("=> Checking and applying Prisma database migrations...");

try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("=> Migrations applied successfully.");
} catch (error) {
  const errorMessage = error?.message || "";
  const output = (error?.stdout?.toString() || "") + (error?.stderr?.toString() || "");

  // Handle Prisma P3005 (database schema is not empty and needs baselining)
  if (errorMessage.includes("P3005") || output.includes("P3005")) {
    console.warn("=> Detected un-baselined database (P3005). Baselining initial migration 20261009000000_init...");
    try {
      execSync("npx prisma migrate resolve --applied 20261009000000_init", { stdio: "inherit" });
      console.log("=> Baseline resolved. Deploying remaining migrations...");
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      console.log("=> All migrations successfully deployed!");
    } catch (innerError) {
      console.error("=> Failed to baseline and deploy migrations:", innerError.message);
      process.exit(1);
    }
  } else {
    console.error("=> Migration deployment failed:", errorMessage);
    process.exit(1);
  }
}
