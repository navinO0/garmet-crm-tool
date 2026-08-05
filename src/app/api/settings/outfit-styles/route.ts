import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let styles = await db.outfitStyle.findMany({
      orderBy: { name: 'asc' },
    });

    // Seed defaults if empty
    if (styles.length === 0) {
      const defaults = [
        {
          name: 'Lehenga Choli Set',
          category: 'Bridal / Ethnic',
          baseStitchingCost: 1500,
          boutiqueBaseStitchingCost: 1500,
          bulkBaseStitchingCost: 1200,
          materialRequiredSpecs: '4.5m Main Fabric, 3.0m Satin Lining, 1.5m Can-Can Net',
          materialsJson: JSON.stringify([
            { name: 'Main Fabric', quantityPerPc: 4.5, unit: 'meters' },
            { name: 'Satin Inner Lining', quantityPerPc: 3.0, unit: 'meters' },
            { name: 'Can-Can Netting', quantityPerPc: 1.5, unit: 'meters' },
            { name: 'Heavy Canvas', quantityPerPc: 0.5, unit: 'meters' },
          ]),
        },
        {
          name: 'Anarkali Suit Set',
          category: 'Ethnic Wear',
          baseStitchingCost: 850,
          boutiqueBaseStitchingCost: 850,
          bulkBaseStitchingCost: 650,
          materialRequiredSpecs: '4.0m Main Fabric, 2.5m Inner Lining',
          materialsJson: JSON.stringify([
            { name: 'Main Fabric', quantityPerPc: 4.0, unit: 'meters' },
            { name: 'Inner Lining', quantityPerPc: 2.5, unit: 'meters' },
            { name: 'Dupatta Trim', quantityPerPc: 2.5, unit: 'meters' },
          ]),
        },
        {
          name: 'Bridal Gown',
          category: 'Bridal / Heavy',
          baseStitchingCost: 2200,
          boutiqueBaseStitchingCost: 2200,
          bulkBaseStitchingCost: 1800,
          materialRequiredSpecs: '5.0m Satin/Net, 3.0m Lining',
          materialsJson: JSON.stringify([
            { name: 'Main Satin/Net Fabric', quantityPerPc: 5.0, unit: 'meters' },
            { name: 'Inner Lining', quantityPerPc: 3.0, unit: 'meters' },
            { name: 'Boning & Padded Cups', quantityPerPc: 1.0, unit: 'set' },
          ]),
        },
      ];

      for (const def of defaults) {
        await db.outfitStyle.create({ data: def });
      }

      styles = await db.outfitStyle.findMany({ orderBy: { name: 'asc' } });
    }

    return NextResponse.json({ success: true, styles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, baseStitchingCost, boutiqueBaseStitchingCost, bulkBaseStitchingCost, materialRequiredSpecs, materials, referenceImages } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Outfit style name is required.' }, { status: 400 });
    }

    const style = await db.outfitStyle.create({
      data: {
        name,
        category: category || 'Ethnic Wear',
        baseStitchingCost: parseFloat(baseStitchingCost) || 500,
        boutiqueBaseStitchingCost: parseFloat(boutiqueBaseStitchingCost) || parseFloat(baseStitchingCost) || 500,
        bulkBaseStitchingCost: parseFloat(bulkBaseStitchingCost) || parseFloat(baseStitchingCost) || 500,
        materialRequiredSpecs: materialRequiredSpecs || null,
        materialsJson: materials ? JSON.stringify(materials) : null,
        referenceImages: referenceImages ? JSON.stringify(referenceImages) : null,
      },
    });

    return NextResponse.json({ success: true, style }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, category, baseStitchingCost, boutiqueBaseStitchingCost, bulkBaseStitchingCost, materialRequiredSpecs, materials, referenceImages } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'ID and Name are required.' }, { status: 400 });
    }

    const updated = await db.outfitStyle.update({
      where: { id },
      data: {
        name,
        category: category || 'Ethnic Wear',
        baseStitchingCost: parseFloat(baseStitchingCost) || 500,
        boutiqueBaseStitchingCost: parseFloat(boutiqueBaseStitchingCost) || parseFloat(baseStitchingCost) || 500,
        bulkBaseStitchingCost: parseFloat(bulkBaseStitchingCost) || parseFloat(baseStitchingCost) || 500,
        materialRequiredSpecs: materialRequiredSpecs || null,
        materialsJson: materials ? JSON.stringify(materials) : null,
        referenceImages: referenceImages ? JSON.stringify(referenceImages) : null,
      },
    });

    return NextResponse.json({ success: true, style: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Outfit style ID is required.' }, { status: 400 });
    }

    await db.outfitStyle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Outfit style deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
