import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let setting = await db.systemSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      setting = await db.systemSetting.create({
        data: {
          id: 'default',
          gstEnabled: false,
          gstPercentage: 5.0,
        },
      });
    }

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gstEnabled, gstPercentage } = body;

    const setting = await db.systemSetting.upsert({
      where: { id: 'default' },
      update: {
        gstEnabled: Boolean(gstEnabled),
        gstPercentage: parseFloat(gstPercentage) || 0.0,
      },
      create: {
        id: 'default',
        gstEnabled: Boolean(gstEnabled),
        gstPercentage: parseFloat(gstPercentage) || 0.0,
      },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
