import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      status,
      outputImages,
      leftoverMaterialNotes,
      extendedDeliveryDate,
      extensionReason,
    } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (outputImages) updateData.outputImages = JSON.stringify(outputImages);
    if (leftoverMaterialNotes !== undefined) updateData.leftoverMaterialNotes = leftoverMaterialNotes;
    if (extendedDeliveryDate) updateData.extendedDeliveryDate = extendedDeliveryDate;
    if (extensionReason) updateData.extensionReason = extensionReason;

    const updatedOrder = await db.bulkOrder.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        items: true,
        agreement: true,
        invoice: true,
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
