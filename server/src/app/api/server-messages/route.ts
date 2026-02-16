import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { computerId, message } = await request.json();

    if (!computerId || !message) {
      return NextResponse.json(
        { error: "computerId and message are required" },
        { status: 400 }
      );
    }

    const serverMessage = await prisma.serverMessage.create({
      data: {
        computerId,
        message,
      },
    });

    return NextResponse.json(serverMessage);
  } catch (error) {
    console.error("Create server message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401 }
      );
    }

    // Find computer by API key
    const computer = await prisma.computer.findFirst({
      where: { apiKey },
    });

    if (!computer) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    const messages = await prisma.serverMessage.findMany({
      where: {
        computerId: computer.id,
        delivered: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Get server messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
