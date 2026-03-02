import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { ipAddress: { contains: search } },
        { macAddress: { contains: search } },
        { brand: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [devices, total] = await Promise.all([
      prisma.networkDevice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.networkDevice.count({ where }),
    ]);

    return NextResponse.json({
      data: devices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("List network devices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ipAddress, macAddress, type, brand, model, location, status, notes, autoDiscovered, vendor } = body;

    if (!name || !ipAddress || !type) {
      return NextResponse.json(
        { error: "ກະລຸນາໃສ່ ຊື່, IP Address, ແລະ ປະເພດ" },
        { status: 400 }
      );
    }

    const device = await prisma.networkDevice.create({
      data: {
        name,
        ipAddress,
        macAddress: macAddress || null,
        type,
        brand: brand || null,
        model: model || null,
        location: location || null,
        status: status || "online",
        notes: notes || null,
        autoDiscovered: autoDiscovered || false,
        vendor: vendor || null,
      },
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error("Create network device error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
