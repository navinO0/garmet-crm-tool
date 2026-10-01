import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import {
  verifySessionToken,
  setAuthPassword,
  AUTH_CREDENTIALS,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 1. Session verification
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to update password." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "New password and confirm password do not match." },
        { status: 400 }
      );
    }

    const currentExpectedPassword = process.env.AUTH_PASSWORD || AUTH_CREDENTIALS.password;
    if (currentPassword !== currentExpectedPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    // Update in-memory and process.env
    setAuthPassword(newPassword);

    // Persist to .env file
    try {
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf-8");
        if (envContent.includes("AUTH_PASSWORD=")) {
          envContent = envContent.replace(
            /AUTH_PASSWORD="?([^"\n]*)"?/g,
            `AUTH_PASSWORD="${newPassword.replace(/"/g, '\\"')}"`
          );
        } else {
          envContent += `\nAUTH_PASSWORD="${newPassword.replace(/"/g, '\\"')}"\n`;
        }
        fs.writeFileSync(envPath, envContent, "utf-8");
      }
    } catch (fsErr) {
      console.warn("Could not write to .env file:", fsErr);
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. Your new credentials are now active.",
    });
  } catch (err: any) {
    console.error("Update password error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update password." },
      { status: 500 }
    );
  }
}
