import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadInvoiceToS3, uploadAgreementToS3 } from '@/lib/s3Storage';
import { generateInvoiceHTML, generateAgreementHTML } from '@/lib/documentGenerator';
import { bulkOrderSchema } from '@/lib/validations/schemas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const orders = await db.bulkOrder.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        items: true,
        agreement: true,
        invoice: true,
      },
    });
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = bulkOrderSchema.safeParse(body);

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

    const {
      // Client info
      clientId,
      clientName,
      businessName,
      mobileNumber,
      email,
      address,

      // Order items
      items,

      // Material Source & Financials
      materialProvidedBy = 'Client',
      materialCharges = 0,
      shippingCharges = 0,
      packingCharges = 0,
      gstEnabled = false,
      gstPercentage = 0,
      estimatedDelivery,
      deliverySchedule,
      fabricProcurement,
      packingBrandingNotes,
      materialReceivedDetails,

      // Signatures
      clientSignatoryName,
      clientDesignation,
      witnessName,
      witnessMobile,
    } = validation.data;

    const referenceImages = Array.isArray(body.referenceImages) ? body.referenceImages : [];
    const materialImages = Array.isArray(body.materialImages) ? body.materialImages : [];
    const clientSignature = body.clientSignature || '';
    const witnessSignature = body.witnessSignature || '';
    const clientInitials = body.clientInitials || '';
    const labelInitials = body.labelInitials || '';

    // 1. Client Lookup or Creation
    let clientRecordId = clientId;
    let clientObj = null;

    if (!clientRecordId) {
      if (!clientName || !mobileNumber) {
        return NextResponse.json(
          { success: false, error: 'Client Name and Mobile Number are required.' },
          { status: 400 }
        );
      }
      const existing = await db.client.findFirst({ where: { mobileNumber } });
      if (existing) {
        clientObj = await db.client.update({
          where: { id: existing.id },
          data: {
            name: clientName,
            businessName: businessName || null,
            email: email || null,
            address: address || null,
          },
        });
      } else {
        clientObj = await db.client.create({
          data: {
            name: clientName,
            businessName: businessName || null,
            mobileNumber,
            email: email || null,
            address: address || null,
          },
        });
      }
      clientRecordId = clientObj.id;
    } else {
      clientObj = await db.client.findUnique({ where: { id: clientRecordId } });
    }

    // 2. Calculations & Price Breakups
    let subtotal = 0;
    const formattedItems = items.map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.unitRate) || 0;
      const itemTotal = qty * rate;
      subtotal += itemTotal;

      let breakdownStr = item.sizeBreakdown || null;
      if (item.sizesMap && typeof item.sizesMap === 'object') {
        breakdownStr = Object.entries(item.sizesMap)
          .filter(([_, q]: any) => Number(q) > 0)
          .map(([code, q]) => `${code}: ${q}`)
          .join(', ');
      }

      return {
        itemDescription: item.itemDescription || 'Garment Item',
        category: item.category || 'General',
        outfitStyleId: item.outfitStyleId || null,
        quantity: qty,
        unitRate: rate,
        totalPrice: itemTotal,
        fabricDetails: item.fabricDetails || null,
        sizeBreakdown: breakdownStr,
        priceBreakupJson: item.customPriceFields
          ? JSON.stringify(item.customPriceFields)
          : item.priceBreakup
            ? JSON.stringify(item.priceBreakup)
            : null,
      };
    });

    const totalUnits = formattedItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
    const matCharges = (materialProvidedBy === 'Company' || materialProvidedBy === 'Factory') ? (Number(materialCharges) || 0) * totalUnits : 0;
    const grossTotal = subtotal + matCharges + Number(shippingCharges) + Number(packingCharges);

    const discType = body.discountType || 'fixed';
    let discountValue = 0;
    if (discType === 'percentage') {
      discountValue = ((subtotal + matCharges) * (Number(body.discountPercentage) || 0)) / 100;
    } else {
      discountValue = Number(body.discountAmount) || 0;
    }

    const taxableSubtotal = Math.max(0, grossTotal - discountValue);
    const calculatedGst = gstEnabled ? (taxableSubtotal * (Number(gstPercentage) || 0)) / 100 : 0;
    const totalAmount = taxableSubtotal + calculatedGst;

    const advType = body.advanceType || 'percentage';
    const advPct = body.advancePercentage !== undefined ? Number(body.advancePercentage) : 50;

    let advancePayment = 0;
    if (advType === 'percentage') {
      advancePayment = (totalAmount * advPct) / 100;
    } else {
      advancePayment = body.advanceCustomAmount !== undefined ? Number(body.advanceCustomAmount) : Math.round(totalAmount * 0.5);
    }
    const remainingAmount = Math.max(0, totalAmount - advancePayment);

    // 3. Identifiers
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `RL-${Date.now().toString().slice(-6)}-${randomNum}`;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${randomNum}`;
    const currentDateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // 4. Generate HTML Invoices & Agreements for S3 Storage
    const paymentTermsStr = advType === 'percentage'
      ? `Payment Terms: ${advPct}% Advance`
      : `Payment Terms: ₹${advancePayment.toLocaleString('en-IN')} Advance`;

    const invoiceHtml = generateInvoiceHTML({
      invoiceNumber,
      orderNumber,
      clientName: clientObj?.name || clientName,
      businessName: clientObj?.businessName || businessName,
      mobileNumber: clientObj?.mobileNumber || mobileNumber,
      email: clientObj?.email || email,
      address: clientObj?.address || address,
      paymentTerms: paymentTermsStr,
      items: formattedItems.map((fi: any, idx: number) => ({
        ...fi,
        fabricDetails: fi.fabricDetails || ((items[idx] as any)?.materialsList && (items[idx] as any)?.materialsList.length > 0 ? (items[idx] as any)?.materialsList.map((m: any) => `${m.quantityPerPc || m.quantity || ''} ${m.unit || ''} ${m.name || m.material || ''}`).join(', ') : undefined),
        priceBreakup: (items[idx] as any)?.priceBreakup,
        customPriceFields: (items[idx] as any)?.customPriceFields,
      })),
      materialProvidedBy,
      materialCharges: Number(materialCharges),
      materialReceivedDetails,
      subtotal,
      shippingCharges: Number(shippingCharges),
      packingCharges: Number(packingCharges),
      discountAmount: discountValue,
      totalAmount,
      advancePaid: advancePayment,
      balanceDue: remainingAmount,
      invoiceDate: currentDateStr,
    });

    const agreementHtml = generateAgreementHTML({
      orderNumber,
      clientName: clientObj?.name || clientName,
      businessName: clientObj?.businessName || businessName,
      mobileNumber: clientObj?.mobileNumber || mobileNumber,
      email: clientObj?.email || email,
      address: clientObj?.address || address,
      date: currentDateStr,
      clientSignatoryName: clientSignatoryName || clientObj?.name || clientName,
      clientDesignation: clientDesignation || 'Client',
      clientSignature: clientSignature || undefined,
      clientSignedDate: currentDateStr,
      companySignatoryName: 'RAADHE LABEL part of RADHE VASTRAZ',
      companyDesignation: 'Authorized Signatory',
      companySignature: undefined,
      companySignedDate: currentDateStr,
      witnessName: witnessName || undefined,
      witnessMobile: witnessMobile || undefined,
      witnessSignature: witnessSignature || undefined,
      witnessDate: witnessName ? currentDateStr : undefined,
      clientInitials: clientInitials || undefined,
      labelInitials: labelInitials || undefined,
    });

    // 5. DB Transaction
    const bulkOrder = await db.bulkOrder.create({
      data: {
        orderNumber,
        clientId: clientRecordId,
        status: 'Work Started',
        subtotalAmount: subtotal,
        totalAmount,
        advancePayment,
        remainingAmount,
        shippingCharges: Number(shippingCharges),
        packingCharges: Number(packingCharges),
        materialCharges: matCharges,
        materialProvidedBy,
        gstEnabled: Boolean(gstEnabled),
        gstPercentage: Number(gstPercentage) || 0,
        gstAmount: calculatedGst,
        estimatedDelivery: estimatedDelivery || null,
        deliverySchedule: deliverySchedule || 'As agreed',
        fabricProcurement: fabricProcurement || null,
        packingBrandingNotes: packingBrandingNotes || null,
        materialReceivedDetails: materialReceivedDetails || null,
        referenceImages: referenceImages.length > 0 ? JSON.stringify(referenceImages) : null,
        materialImages: materialImages.length > 0 ? JSON.stringify(materialImages) : null,
        clientInitials: clientInitials || null,
        labelInitials: labelInitials || null,
        items: {
          create: formattedItems,
        },
        agreement: {
          create: {
            clientSignatoryName: clientSignatoryName || clientObj?.name || clientName,
            clientDesignation: clientDesignation || 'Client',
            clientSignature: clientSignature || null,
            clientSignedDate: currentDateStr,
            companySignatoryName: 'RAADHE LABEL part of RADHE VASTRAZ',
            companyDesignation: 'Authorized Signatory',
            companySignedDate: currentDateStr,
            witnessName: witnessName || null,
            witnessMobile: witnessMobile || null,
            witnessSignature: witnessSignature || null,
            witnessDate: witnessName ? currentDateStr : null,
            ipClauseAccepted: true,
            termsAccepted: true,
          },
        },
        invoice: {
          create: {
            invoiceNumber,
            subtotal,
            shippingCharges: Number(shippingCharges),
            packingCharges: Number(packingCharges),
            materialCharges: matCharges,
            gstAmount: calculatedGst,
            totalAmount,
            advancePaid: advancePayment,
            balanceDue: remainingAmount,
            paymentStatus: 'Partial',
          },
        },
      },
      include: {
        client: true,
        items: true,
        agreement: true,
        invoice: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        order: bulkOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Bulk order creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
