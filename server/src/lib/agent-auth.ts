import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Validate agent API key from request header.
 * Returns the computer record if valid, or null.
 */
export async function validateAgentKey(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return null;

  const computer = await prisma.computer.findFirst({
    where: { apiKey },
  });

  return computer;
}

/**
 * Validate agent API key by hostname + key combo.
 * More secure: ensures the key belongs to the specific hostname.
 */
export async function validateAgentByHostname(
  request: NextRequest,
  hostname: string
) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return null;

  const computer = await prisma.computer.findUnique({
    where: { hostname },
  });

  if (!computer || computer.apiKey !== apiKey) return null;

  return computer;
}

/**
 * Return a 401 JSON response.
 */
export function unauthorizedResponse(message = "Invalid or missing API key") {
  return NextResponse.json({ error: message }, { status: 401 });
}
