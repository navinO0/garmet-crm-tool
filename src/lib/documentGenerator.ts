export interface CustomPriceField {
  label: string;
  amount: number;
}

export interface InvoiceDocData {
  invoiceNumber: string;
  orderNumber: string;
  clientName: string;
  businessName?: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  items: Array<{
    itemDescription: string;
    category?: string;
    quantity: number;
    unitRate: number;
    totalPrice: number;
    sizeBreakdown?: string;
    fabricDetails?: string;
    priceBreakup?: any;
    customPriceFields?: CustomPriceField[];
  }>;
  materials?: Array<{
    material: string;
    color?: string;
    quantity: number;
    unit?: string;
    customCategory?: string;
    estimateCategory?: string;
    price?: number;
    notes?: string;
  }>;
  materialProvidedBy?: string;
  materialCharges?: number;
  materialReceivedDetails?: string;
  subtotal: number;
  shippingCharges: number;
  packingCharges: number;
  discountAmount?: number;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  invoiceDate: string;
  dueDate?: string;
  isBoutique?: boolean;
  gstAmount?: number;
  laborPrintingCharges?: number;
}

export interface AgreementDocData {
  orderNumber: string;
  clientName: string;
  businessName?: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  date: string;
  clientSignatoryName: string;
  clientDesignation?: string;
  clientSignature?: string;
  clientSignedDate?: string;
  companySignatoryName: string;
  companyDesignation?: string;
  companySignature?: string;
  companySignedDate?: string;
  witnessName?: string;
  witnessMobile?: string;
  witnessSignature?: string;
  witnessDate?: string;
  clientInitials?: string;
  labelInitials?: string;
}

export function generateInvoiceHTML(data: InvoiceDocData): string {
  const itemsRows = data.items
    .map((item, index) => {
      let breakupParts: string[] = [];

      if (item.customPriceFields && item.customPriceFields.length > 0) {
        breakupParts = item.customPriceFields
          .filter((f) => f.amount > 0)
          .map((f) => `${f.label}: ₹${f.amount}`);
      } else if (item.priceBreakup) {
        const pb = item.priceBreakup;
        if (pb.baseStitching) breakupParts.push(`Base Stitching: ₹${pb.baseStitching}`);
        if (pb.liningCanvas) breakupParts.push(`Lining/Canvas: ₹${pb.liningCanvas}`);
        if (pb.handworkEmbroidery) breakupParts.push(`Embroidery/Handwork: ₹${pb.handworkEmbroidery}`);
        if (pb.finishingLatkan) breakupParts.push(`Finishing/Latkan: ₹${pb.finishingLatkan}`);
      }

      const breakupHtml = breakupParts.length > 0
        ? `<div style="font-size: 10px; color: #475569; margin-top: 2px; font-style: italic;"><strong>Cost Breakup:</strong> ${breakupParts.join(' | ')}</div>`
        : '';

      const sizeHtml = item.sizeBreakdown
        ? `<div style="font-size: 10px; color: #4f46e5; margin-top: 2px; font-family: monospace;"><strong>Size Ratio:</strong> ${item.sizeBreakdown}</div>`
        : '';

      const itemQty = Number(item.quantity) || 1;
      let fabricText = item.fabricDetails || '';

      const mList = (item as any).materialsList;
      if (Array.isArray(mList) && mList.length > 0) {
        fabricText = mList.map((m: any) => {
          const perPc = Number(m.quantityPerPc || m.quantity) || 0;
          const total = perPc * itemQty;
          const unit = m.unit || 'm';
          const name = m.name || m.material || 'Material';
          return perPc > 0
            ? `${total} ${unit} ${name} (${perPc}${unit}/pc × ${itemQty} pcs)`
            : `${name}`;
        }).join(' | ');
      } else if (fabricText && !fabricText.toLowerCase().includes('total') && itemQty > 1) {
        fabricText = `${fabricText} (Total Sum for ${itemQty} pcs)`;
      }

      const fabricHtml = fabricText
        ? `<div style="font-size: 10px; color: #475569; margin-top: 2px;"><strong>Total Material Required:</strong> ${fabricText}</div>`
        : '';

      return `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">${index + 1}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9;">
        <strong style="color: #0f172a; font-size: 12px;">${item.itemDescription}</strong>
        ${item.category ? `<span style="color: #64748b; font-size: 11px; margin-left: 6px;">(Category: ${item.category})</span>` : ''}
        ${sizeHtml}
        ${fabricHtml}
        ${breakupHtml}
      </td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: 600;">${item.quantity}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">₹${item.unitRate.toLocaleString('en-IN')}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #0f172a;">₹${item.totalPrice.toLocaleString('en-IN')}</td>
    </tr>
  `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box !important; }
    html, body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; background-color: #f8fafc; font-size: 12px; line-height: 1.35; width: 100%; }
    .invoice-card { max-width: 780px; width: 100%; margin: 0 auto; background: #ffffff; padding: 24px 28px; border-radius: 0; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; width: 100%; }
    .brand-title { font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px; }
    .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .inv-title { text-align: right; font-size: 22px; font-weight: 900; color: #4f46e5; letter-spacing: 1px; }
    .inv-meta { text-align: right; font-size: 11px; color: #475569; margin-top: 3px; line-height: 1.35; }
    .grid { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; width: 100%; }
    .bill-to { font-size: 12px; line-height: 1.4; max-width: 60%; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px; }
    th { background: #f8fafc; padding: 6px 8px; text-align: left; font-weight: 700; color: #475569; border-bottom: 1.5px solid #cbd5e1; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { word-break: break-word; }
    .summary-box { width: 100%; max-width: 310px; margin-left: auto; font-size: 12px; line-height: 1.4; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 2.5px 0; width: 100%; }
    .total-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 14px; font-weight: 800; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; color: #0f172a; margin: 4px 0; width: 100%; }
    .badge { display: inline-block; padding: 3px 10px; font-size: 10px; font-weight: 700; border-radius: 0; background: #e0e7ff; color: #3730a3; white-space: nowrap; }
    .footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; width: 100%; }
    @media print {
      html, body { padding: 0 !important; margin: 0 !important; background: white !important; width: 100% !important; }
      .invoice-card { padding: 0 !important; margin: 0 auto !important; border: none !important; box-shadow: none !important; max-width: 100% !important; width: 100% !important; }
      @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand-title">${data.isBoutique ? 'RADHE VASTRAZ BOUTIQUE' : 'RAADHE LABEL'}</div>
        <div class="brand-sub">${data.isBoutique ? 'Bespoke Garments & Custom Tailoring' : 'by RADHE VASTRAZ • Bulk Stitching & Private Label Manufacturing'}</div>
      </div>
      <div>
        <div class="inv-title">INVOICE</div>
        <div class="inv-meta">
          Invoice No: <strong>${data.invoiceNumber}</strong><br>
          Order Ref: <strong>${data.orderNumber}</strong><br>
          Date: ${data.invoiceDate}
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="bill-to">
        <h4 style="margin: 0 0 4px 0; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Billed To:</h4>
        <strong style="font-size: 13px; color: #0f172a;">${data.clientName}</strong> ${data.businessName ? `(${data.businessName})` : ''}<br>
        Mobile: ${data.mobileNumber}<br>
        ${data.email ? `Email: ${data.email}<br>` : ''}
        ${data.address ? `Address: ${data.address}` : ''}
      </div>
      <div>
        <span class="badge">${data.paymentTerms || 'Payment Terms: 50% Advance'}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>Item Description, Size Ratio & Price Breakup</th>
          <th style="text-align: center; width: 60px;">Qty</th>
          <th style="text-align: right; width: 100px;">Unit Rate</th>
          <th style="text-align: right; width: 110px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    ${data.materials && data.materials.length > 0 ? `
    <div style="margin-top: 14px; margin-bottom: 14px;">
      <h3 style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
        Garment Production Material & Fabric Details
      </h3>
      ${data.materialProvidedBy ? `<div style="font-size: 11px; color: #475569; margin-bottom: 6px;"><strong>Material Supply Source:</strong> ${data.materialProvidedBy} ${data.materialCharges && data.materialCharges > 0 ? `(Material Rate per Piece: ₹${data.materialCharges.toLocaleString('en-IN')})` : ''}</div>` : ''}
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 6px;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 5px 8px; text-align: left;">Material Name</th>
            <th style="padding: 5px 8px; text-align: left;">Color / Dye</th>
            <th style="padding: 5px 8px; text-align: left;">Category</th>
            <th style="padding: 5px 8px; text-align: center;">Quantity</th>
            <th style="padding: 5px 8px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${data.materials.map((m) => `
            <tr>
              <td style="padding: 5px 8px; border-bottom: 1px solid #f1f5f9;">
                <strong>${m.material}</strong>
                ${m.notes ? `<br><small style="color: #64748b;">${m.notes}</small>` : ''}
              </td>
              <td style="padding: 5px 8px; border-bottom: 1px solid #f1f5f9;">${m.color || '-'}</td>
              <td style="padding: 5px 8px; border-bottom: 1px solid #f1f5f9;">${m.customCategory || m.estimateCategory || '-'}</td>
              <td style="padding: 5px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">${m.quantity} ${m.unit || ''}</td>
              <td style="padding: 5px 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">${m.price && m.price > 0 ? `₹${m.price.toLocaleString('en-IN')}` : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${data.materialReceivedDetails ? `<div style="font-size: 10px; color: #64748b; font-style: italic; background: #f8fafc; padding: 6px 8px; border-radius: 0; border: 1px solid #f1f5f9;"><strong>Material Received Log:</strong> ${data.materialReceivedDetails}</div>` : ''}
    </div>
    ` : ''}

    <div class="summary-box">
      <div class="summary-row"><span>Stitching Subtotal:</span><span>₹${data.subtotal.toLocaleString('en-IN')}</span></div>
      ${data.laborPrintingCharges && data.laborPrintingCharges > 0 ? `<div class="summary-row"><span>Labor & Printing:</span><span>₹${data.laborPrintingCharges.toLocaleString('en-IN')}</span></div>` : ''}
      ${data.packingCharges > 0 ? `<div class="summary-row"><span>Packing & Branding:</span><span>₹${data.packingCharges.toLocaleString('en-IN')}</span></div>` : ''}
      ${data.shippingCharges > 0 ? `<div class="summary-row"><span>Shipping Charges:</span><span>₹${data.shippingCharges.toLocaleString('en-IN')}</span></div>` : ''}
      ${data.gstAmount && data.gstAmount > 0 ? `<div class="summary-row"><span>GST:</span><span>₹${data.gstAmount.toLocaleString('en-IN')}</span></div>` : ''}
      ${data.discountAmount && data.discountAmount > 0 ? `<div class="summary-row" style="color: #059669; font-weight: 600;"><span>Order Discount:</span><span>- ₹${data.discountAmount.toLocaleString('en-IN')}</span></div>` : ''}
      <div class="total-row"><span>Total Order Amount:</span><span>₹${data.totalAmount.toLocaleString('en-IN')}</span></div>
      <div class="summary-row" style="color: #059669; font-weight: 600;"><span>Advance Paid / Required:</span><span>- ₹${data.advancePaid.toLocaleString('en-IN')}</span></div>
      <div class="summary-row" style="color: #dc2626; font-weight: bold; font-size: 14px;"><span>Balance Due before Dispatch:</span><span>₹${data.balanceDue.toLocaleString('en-IN')}</span></div>
    </div>

    <div class="footer">
      Thank you for doing business with ${data.isBoutique ? 'RADHE VASTRAZ BOUTIQUE' : 'RAADHE LABEL by RADHE VASTRAZ'}.
    </div>
  </div>
</body>
</html>
  `;
}

export function generateAgreementHTML(data: AgreementDocData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bulk Stitching Agreement - ${data.orderNumber}</title>
  <style>
    body { font-family: 'Times New Roman', Georgia, serif; color: #1f2937; margin: 0; padding: 40px; background-color: #f9fafb; line-height: 1.6; }
    .doc-card { max-width: 850px; margin: 0 auto; background: #ffffff; padding: 50px; border-radius: 0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    h1 { text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px; }
    h2 { text-align: center; font-size: 18px; font-weight: normal; margin-top: 0; margin-bottom: 24px; color: #4b5563; }
    .meta-box { background: #f8fafc; padding: 15px 20px; border: 1px solid #e2e8f0; margin-bottom: 30px; font-family: sans-serif; font-size: 14px; }
    .section-title { font-size: 15px; font-weight: bold; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; text-transform: uppercase; color: #0f172a; }
    ul { margin-top: 6px; padding-left: 20px; }
    li { margin-bottom: 6px; font-size: 14px; }
    .signatures-grid { display: flex; justify-content: space-between; margin-top: 40px; gap: 20px; page-break-inside: avoid; }
    .sig-box { flex: 1; border: 1px solid #cbd5e1; padding: 16px; border-radius: 0; font-family: sans-serif; font-size: 13px; background: #fafafa; }
    .sig-title { font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 12px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .sig-img { height: 60px; max-width: 180px; object-fit: contain; margin: 10px 0; border-bottom: 1px dashed #94a3b8; }
    .initials-row { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-family: sans-serif; font-size: 13px; }
  </style>
</head>
<body>
  <div class="doc-card">
    <h1>RAADHE LABEL by RADHE VASTRAZ</h1>
    <h2>BULK STITCHING & PRIVATE LABEL MANUFACTURING AGREEMENT</h2>

    <div class="meta-box">
      <strong>Order Reference:</strong> ${data.orderNumber} &nbsp;|&nbsp; <strong>Date:</strong> ${data.date}<br>
      <strong>Client Name:</strong> ${data.clientName}<br>
      <strong>Business Name:</strong> ${data.businessName || 'N/A'}<br>
      <strong>Mobile:</strong> ${data.mobileNumber} &nbsp;|&nbsp; <strong>Email:</strong> ${data.email || 'N/A'}<br>
      <strong>Address:</strong> ${data.address || 'N/A'}
    </div>

    <div class="section-title">Terms & Conditions</div>
    <ul>
      <li><strong>1. Fabric Procurement:</strong> Fabric selection and purchase shall be based on the client's choice. Payment for fabric must be made directly by the client to the vendor. RAADHE LABEL is responsible only for manufacturing the products.</li>
      <li><strong>2. Stitching Charges & Payment Terms:</strong> A quotation will be provided based on design, quantity and requirements. 50% advance payment is required before production starts. Remaining 50% must be paid before dispatch. Production will begin only after receipt of the advance payment.</li>
      <li><strong>3. Shipping:</strong> Shipping charges are separate and vary according to weight and destination. Shipping charges may be paid directly to the courier or to RAADHE LABEL as per the courier invoice.</li>
      <li><strong>4. Packing & Branding:</strong> Packing charges must be paid along with the initial advance. Packing may include Brand labels, Transparent covers, Size labels, Wash care labels, Branding tags/stickers or other requested packaging. Any additional branding requested will be charged separately.</li>
      <li><strong>5. GST:</strong> GST is currently not applicable. If GST registration is obtained in future, GST will be charged as per applicable government regulations.</li>
      <li><strong>6. Additional Charges:</strong> The quotation covers only the agreed stitching/manufacturing charges. Any additional costs including trims, accessories, embroidery, printing, special finishing, packaging upgrades, transportation or future requirements shall be borne by the client.</li>
      <li><strong>7. Quotation:</strong> Every quotation is project-specific and may vary depending on design, quantity, fabric, finishing requirements and branding requirements.</li>
      <li><strong>8. Production Timeline & Delivery:</strong> Estimated timelines will be communicated before order confirmation. Production may be delayed due to design changes, fabric availability, order volume or unforeseen circumstances. The client agrees to allow a grace period of up to 30 days beyond the estimated delivery date if required. RAADHE LABEL will make every reasonable effort to complete orders as early as possible.</li>
      <li><strong>9. Delivery Schedule:</strong> Orders can be dispatched as weekly or monthly deliveries based on the client's requirement and mutual agreement. Any changes requested after production starts may affect delivery timelines and charges.</li>
      <li><strong>10. Cancellation & Refund Policy:</strong> Orders cannot be cancelled once production has started. Advance payments are non-refundable after production begins.</li>
      <li><strong>11. Product Variations:</strong> Minor variations of up to 5% in colour, shade, measurements or workmanship are considered acceptable as part of the manufacturing process.</li>
      <li><strong>12. Inspection & Claims:</strong> The client must inspect the goods immediately upon receipt. Any manufacturing issue must be reported within 48 hours of delivery. Claims made after this period may not be accepted.</li>
      <li><strong>13. Storage:</strong> Finished goods should be collected or dispatched promptly. Storage charges may apply if goods remain uncollected for more than 15 days after completion.</li>
      <li><strong>14. Force Majeure:</strong> RAADHE LABEL shall not be held responsible for delays caused by courier services, transport disruptions, natural calamities, strikes, government restrictions or other events beyond reasonable control.</li>
      <li><strong>15. Client Acknowledgement:</strong> The client confirms that they have read, understood and accepted all the terms and conditions of this agreement.</li>
    </ul>

    <div class="section-title">Design Confidentiality & Intellectual Property</div>
    <ul>
      <li>RAADHE LABEL respects the confidentiality of every client's products and designs.</li>
      <li>Any design, sample, sketch, reference image or product developed exclusively for a client will not be intentionally shared, manufactured or disclosed to any other client without the client's written permission.</li>
      <li>If the client provides a design copied from another brand, social media page, catalogue or any third party, RAADHE LABEL shall not be responsible for any copyright, trademark or intellectual property claims arising from such design.</li>
      <li>The client confirms that they have the necessary rights or permission to manufacture any design they submit.</li>
      <li>RAADHE LABEL reserves the right to decline manufacturing any design that appears to infringe the intellectual property rights of any third party or may expose the company to legal liability.</li>
    </ul>

    <div class="signatures-grid">
      <div class="sig-box">
        <div class="sig-title">AUTHORIZED SIGNATORY</div>
        <strong>${data.companySignatoryName}</strong><br>
        Designation: ${data.companyDesignation || 'Authorized Signatory'}<br>
        ${data.companySignature ? (data.companySignature.startsWith('data:') || data.companySignature.startsWith('http') || data.companySignature.startsWith('/') ? `<img src="${data.companySignature}" class="sig-img" alt="Company Signature"><br>` : `<div class="sig-img" style="display: flex; align-items: center; font-style: italic; font-weight: bold; color: #3730a3;">${data.companySignature}</div>`) : '<div class="sig-img"></div>'}
        Date: ${data.companySignedDate || data.date}
      </div>

      <div class="sig-box">
        <div class="sig-title">CLIENT SIGNATORY</div>
        <strong>${data.clientSignatoryName}</strong><br>
        Designation: ${data.clientDesignation || 'Client'}<br>
        ${data.clientSignature ? `<img src="${data.clientSignature}" class="sig-img" alt="Client Signature"><br>` : '<div class="sig-img"></div>'}
        Date: ${data.clientSignedDate || data.date}
      </div>
    </div>

    ${
      data.witnessName
        ? `
    <div style="margin-top: 20px;">
      <div class="sig-box">
        <div class="sig-title">WITNESS (Optional)</div>
        <strong>Witness Name:</strong> ${data.witnessName}<br>
        <strong>Mobile Number:</strong> ${data.witnessMobile || 'N/A'}<br>
        ${data.witnessSignature ? `<img src="${data.witnessSignature}" class="sig-img" alt="Witness Signature"><br>` : '<div class="sig-img"></div>'}
        Date: ${data.witnessDate || data.date}
      </div>
    </div>
    `
        : ''
    }

    <div class="initials-row">
      <div>Client Initial (Each Page): <strong>${data.clientInitials || '________'}</strong></div>
      <div>RAADHE LABEL Initial: <strong>${data.labelInitials || '________'}</strong></div>
    </div>
  </div>
</body>
</html>
  `;
}

export interface SizeChartDocData {
  orderNumber: string;
  clientName: string;
  businessName?: string;
  mobileNumber: string;
  email?: string;
  date: string;
  items: Array<{
    itemDescription: string;
    category?: string;
    quantity: number;
    sizeBreakdown?: string;
    fabricDetails?: string;
  }>;
}

export function generateSizeChartHTML(data: SizeChartDocData): string {
  const itemRows = data.items.map((item, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
        <strong style="font-size: 13px; color: #0f172a;">${item.itemDescription}</strong>
        ${item.category ? `<span style="color: #64748b; font-size: 11px;"> (${item.category})</span>` : ''}
        ${item.fabricDetails ? `<div style="font-size: 11px; color: #475569; margin-top: 4px;"><strong>Fabric Specs:</strong> ${item.fabricDetails}</div>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 13px;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; font-weight: bold; color: #4f46e5;">
        ${item.sizeBreakdown || 'Standard / Custom Sizing'}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Size Chart Specification - ${data.orderNumber}</title>
  <style>
    * { box-sizing: border-box !important; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; margin: 0; padding: 25px; background-color: #f8fafc; font-size: 12px; line-height: 1.4; }
    .doc-card { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 0; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 18px; font-weight: 900; color: #0f172a; }
    .doc-title { font-size: 18px; font-weight: 900; color: #4f46e5; text-align: right; letter-spacing: 0.5px; }
    .meta { background: #f8fafc; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 0; margin-bottom: 16px; display: flex; justify-content: space-between; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th { background: #f8fafc; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 1.5px solid #cbd5e1; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 10px; color: #94a3b8; }
    @media print {
      body { padding: 0; background: white; }
      .doc-card { padding: 0; border: none; box-shadow: none; width: 100%; max-width: 100%; }
      @page { size: A4 portrait; margin: 10mm 12mm; }
    }
  </style>
</head>
<body>
  <div class="doc-card">
    <div class="header">
      <div>
        <div class="brand">RAADHE LABEL by RADHE VASTRAZ</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Bulk Stitching & Private Label Manufacturing</div>
      </div>
      <div>
        <div class="doc-title">SIZE CHART BREAKDOWN</div>
        <div style="text-align: right; font-size: 10px; color: #64748b; margin-top: 2px;">Ref: ${data.orderNumber} | Date: ${data.date}</div>
      </div>
    </div>

    <div class="meta">
      <div>
        <strong>Client Name:</strong> ${data.clientName} ${data.businessName ? `(${data.businessName})` : ''}<br>
        <strong>Mobile:</strong> ${data.mobileNumber} ${data.email ? `| Email: ${data.email}` : ''}
      </div>
      <div style="text-align: right;">
        <strong>Total Order Items:</strong> ${data.items.length}<br>
        <strong>Total Order Units:</strong> ${data.items.reduce((sum, i) => sum + i.quantity, 0)} pcs
      </div>
    </div>

    <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #334155; margin-bottom: 8px;">
      1. Order Item Size Breakdown Matrix
    </h3>

    <table>
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>Garment Description & Category</th>
          <th style="width: 65px; text-align: center;">Total Qty</th>
          <th>Ordered Size Breakdown (S, M, L, XL, XXL, Custom)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #334155; margin-top: 14px; margin-bottom: 8px;">
      2. Company Official Body Measurement Guide (For Client Awareness)
    </h3>

    <div style="margin-bottom: 14px; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 5px 8px; border-bottom: 1.5px solid #cbd5e1; font-weight: 700; color: #334155;">Size</th>
            <th style="padding: 5px 8px; border-bottom: 1.5px solid #cbd5e1; font-weight: 700; color: #334155; text-align: center;">Bust / Chest</th>
            <th style="padding: 5px 8px; border-bottom: 1.5px solid #cbd5e1; font-weight: 700; color: #334155; text-align: center;">Waist</th>
            <th style="padding: 5px 8px; border-bottom: 1.5px solid #cbd5e1; font-weight: 700; color: #334155; text-align: center;">Hip</th>
            <th style="padding: 5px 8px; border-bottom: 1.5px solid #cbd5e1; font-weight: 700; color: #334155; text-align: center;">Shoulder</th>
            <th style="padding: 5px 8px; border-bottom: 1.5px solid #cbd5e1; font-weight: 700; color: #334155; text-align: center;">Armhole</th>
            <th style="padding: 5px 8px; border-bottom: 1.5px solid #cbd5e1; font-weight: 700; color: #334155; text-align: center;">Std. Length</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #4f46e5;">XS (34)</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">34"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">28"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">36"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">13.5"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">15"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">44"</td></tr>
          <tr><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #4f46e5;">S (36)</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">36"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">30"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">38"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">14.0"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">16"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">44"</td></tr>
          <tr><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #4f46e5;">M (38)</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">38"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">32"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">40"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">14.5"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">17"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">45"</td></tr>
          <tr><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #4f46e5;">L (40)</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">40"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">34"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">42"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">15.0"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">18"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">45"</td></tr>
          <tr><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #4f46e5;">XL (42)</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">42"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">36"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">44"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">15.5"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">19"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">46"</td></tr>
          <tr><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #4f46e5;">XXL (44)</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">44"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">38"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">46"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">16.0"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">20"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">46"</td></tr>
          <tr><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #4f46e5;">3XL (46)</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">46"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">40"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">48"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">16.5"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">21"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">47"</td></tr>
          <tr><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #4f46e5;">4XL (48)</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">48"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">42"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">50"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">17.0"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">22"</td><td style="padding: 4px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">47"</td></tr>
        </tbody>
      </table>
    </div>

    <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 14px; border-radius: 0; margin-bottom: 14px; font-size: 10.5px; color: #1e3a8a; line-height: 1.4;">
      <strong>Client Fitting & Measurement Awareness Guide:</strong><br>
      • <strong>Ease Allowance:</strong> Garments are tailored with 1.5 to 2.0 inches of ease over body measurements for comfort and mobility.<br>
      • <strong>Internal Alteration Margins:</strong> Every garment includes 2.0 inches of internal side seam margins for future size adjustments.<br>
      • <strong>Custom Specs:</strong> Special custom measurements provided by clients override standard chart values.<br>
      • <strong>Tolerances:</strong> Standard Atelier manufacturing tolerance is ±0.5 inches.
    </div>

    <div class="footer">
      RAADHE LABEL by RADHE VASTRAZ • Official Size Guide & Client Awareness Specification
    </div>
  </div>
</body>
</html>
  `;
}
