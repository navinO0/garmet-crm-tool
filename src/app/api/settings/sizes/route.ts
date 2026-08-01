import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let sizes = await db.customSize.findMany({
      orderBy: { code: 'asc' },
    });

    if (sizes.length === 0) {
      const defaultSizes = [
        {
          name: 'Small',
          code: 'S',
          measurementsJson: JSON.stringify({ Bust: '34 in', Waist: '28 in', Hip: '38 in', Shoulder: '14 in' }),
        },
        {
          name: 'Medium',
          code: 'M',
          measurementsJson: JSON.stringify({ Bust: '36 in', Waist: '30 in', Hip: '40 in', Shoulder: '14.5 in' }),
        },
        {
          name: 'Large',
          code: 'L',
          measurementsJson: JSON.stringify({ Bust: '38 in', Waist: '32 in', Hip: '42 in', Shoulder: '15 in' }),
        },
        {
          name: 'Extra Large',
          code: 'XL',
          measurementsJson: JSON.stringify({ Bust: '40 in', Waist: '34 in', Hip: '44 in', Shoulder: '15.5 in' }),
        },
        {
          name: 'Double XL',
          code: 'XXL',
          measurementsJson: JSON.stringify({ Bust: '42 in', Waist: '36 in', Hip: '46 in', Shoulder: '16 in' }),
        },
        {
          name: 'Triple XL',
          code: '3XL',
          measurementsJson: JSON.stringify({ Bust: '44 in', Waist: '38 in', Hip: '48 in', Shoulder: '16.5 in' }),
        },
        {
          name: 'Free Size',
          code: 'Free',
          measurementsJson: JSON.stringify({ Bust: 'Adjustable', Waist: 'Adjustable', Length: 'Standard' }),
        },
      ];

      for (const s of defaultSizes) {
        await db.customSize.create({ data: s });
      }

      sizes = await db.customSize.findMany({ orderBy: { code: 'asc' } });
    }

    return NextResponse.json({ success: true, sizes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, measurements } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'Size Name and Size Code are required.' }, { status: 400 });
    }

    const size = await db.customSize.create({
      data: {
        name,
        code: code.toUpperCase(),
        measurementsJson: measurements ? JSON.stringify(measurements) : null,
        isEnabled: true,
      },
    });

    return NextResponse.json({ success: true, size }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
