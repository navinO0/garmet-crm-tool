import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientSchema } from '@/lib/validations/schemas';

export async function GET() {
  try {
    const clients = await db.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bulkOrders: true },
        },
      },
    });
    return NextResponse.json({ success: true, clients });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = clientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, businessName, mobileNumber, email, address } = validation.data;

    const existingClient = await db.client.findFirst({ where: { mobileNumber } });
    let client;
    if (existingClient) {
      client = await db.client.update({
        where: { id: existingClient.id },
        data: {
          name,
          businessName: businessName || null,
          email: email || null,
          address: address || null,
        },
      });
    } else {
      client = await db.client.create({
        data: {
          name,
          businessName: businessName || null,
          mobileNumber,
          email: email || null,
          address: address || null,
        },
      });
    }

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

