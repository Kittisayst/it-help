import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentKey, unauthorizedResponse } from "@/lib/agent-auth";

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
    const computer = await validateAgentKey(request);
    if (!computer) {
      return unauthorizedResponse();
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
