import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const configs = await prisma.networkScanConfig.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error("Get scan configs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subnet, enabled } = body;

    if (!subnet) {
      return NextResponse.json(
        { error: "ກະລຸນາໃສ່ subnet" },
        { status: 400 }
      );
    }

    const config = await prisma.networkScanConfig.create({
      data: {
        subnet,
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Create scan config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
