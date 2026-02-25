import { NextRequest, NextResponse } from "next/server";

const rates = new Map<string, { count: number; lastReset: number }>();

/**
 * Simple in-memory rate limiter.
 * @param ip Client IP address
 * @param limit Max requests per window
 * @param windowMs Time window in milliseconds
 */
export function isRateLimited(ip: string, limit: number = 30, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userData = rates.get(ip) || { count: 0, lastReset: now };

    if (now - userData.lastReset > windowMs) {
        userData.count = 1;
        userData.lastReset = now;
    } else {
        userData.count++;
    }

    rates.set(ip, userData);

    return userData.count > limit;
}

export function rateLimitResponse() {
    return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
    );
}
