/**
 * @file invoicePrinter.js
 * @description Isolated iframe-based printing utility for Sales Cash Memos, Purchase Invoices, and Due Receipts.
 * Prevents screen blanking, white screens, and browser freezes by printing within an isolated hidden frame.
 */

/**
 * Core function to print arbitrary HTML through an isolated hidden iframe
 */
export const printHtmlViaIframe = (htmlContent) => {
  try {
    // Clean up any existing print iframe
    const existingIframe = document.getElementById('shopo-isolated-print-frame');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'shopo-isolated-print-frame';
    iframe.setAttribute('style', 'position:fixed;left:-9999px;top:0;width:800px;height:1000px;border:none;visibility:visible;z-index:-9999;');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Error invoking print dialog:', err);
      }
    };

    setTimeout(triggerPrint, 250);
  } catch (error) {
    console.error('Failed to generate print frame:', error);
  }
};

/**
 * Format date string safely
 */
const formatDate = (val) => {
  if (!val) return new Date().toLocaleString();
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * Extract clean base name, variant name, and SKU for receipt line items
 */
const extractItemVariantInfo = (item) => {
  const rawName = item.name || item.product_name || 'Item';
  let variantName = item.variant_name || (typeof item.variant === 'object' ? item.variant?.name : item.variant) || '';
  let baseName = rawName;

  if (!variantName && rawName.includes('(') && rawName.includes(')')) {
    const match = rawName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      baseName = match[1].trim();
      variantName = match[2].trim();
    }
  } else if (variantName && baseName.includes(`(${variantName})`)) {
    baseName = baseName.replace(`(${variantName})`, '').trim();
  }

  const sku = item.sku || (typeof item.variant === 'object' ? item.variant?.sku : '') || '';

  return { baseName, variantName, sku };
};

/**
 * Print a Sales Cash Memo / POS Receipt with complete dynamic customizer support
 */
export const printSaleReceipt = ({ order, shop, lang = 'en', customConfig = null }) => {
  if (!order) return;

  const isBn = lang === 'bn';
  const cfg = customConfig || shop?.settings?.cash_memo_config || {};

  // Configuration values with smart fallbacks
  const template = cfg.template || 'modern'; // 'modern' | 'classic' | 'thermal' | 'minimal' | 'bold' | 'a4'
  const accentColor = cfg.accent_color || '#00a86b';
  const paperFormat = cfg.paper_format || shop?.settings?.paper_format || '80mm';
  const customWidthMm = Number(cfg.custom_width_mm) || 80;
  const fontSizeScale = cfg.font_size_scale || 'standard'; // 'compact' | 'standard' | 'large'
  const spacingDensity = cfg.spacing_density || 'normal'; // 'tight' | 'normal' | 'relaxed'
  const watermarkType = cfg.watermark_type || 'none'; // 'none' | 'paid' | 'original' | 'custom'
  const watermarkText = cfg.watermark_text || (isBn ? 'পরিশোধিত' : 'PAID');
  const headerNotice = cfg.header_notice || '';

  const memoTitle = isBn
    ? (cfg.memo_title_bn || 'ক্যাশ মেমো ও বিক্রয় চালান')
    : (cfg.memo_title || 'CASH MEMO / INVOICE');
  const headerSlogan = cfg.header_slogan || '';

  const showLogo = cfg.show_logo !== false && Boolean(shop?.logo_url);
  const showTagline = cfg.show_tagline !== false && Boolean(shop?.tagline);
  const showAddress = cfg.show_address !== false;
  const showPhone = cfg.show_phone !== false;
  const showEmail = Boolean(cfg.show_email && shop?.email);
  const showWebsite = Boolean(cfg.show_website && shop?.website);
  const showSocialLinks = Boolean(cfg.show_social_links);
  const showBinVat = cfg.show_bin_vat !== false && Boolean(shop?.bin_vat_number);

  const showInvoiceTime = cfg.show_invoice_time !== false;
  const showCashierName = cfg.show_cashier_name !== false;
  const showCustomerPhone = cfg.show_customer_phone !== false;
  const showCustomerAddress = Boolean(cfg.show_customer_address && (order.customer_address || order.customer_id?.address));
  const showCustomerDue = cfg.show_customer_due !== false;

  const showLineSerial = Boolean(cfg.show_line_serial);
  const showItemSku = cfg.show_item_sku !== false;
  const showItemUnit = Boolean(cfg.show_item_unit);
  const showItemDiscount = cfg.show_item_discount !== false;
  const showTaxBreakdown = Boolean(cfg.show_tax_breakdown);
  const showDeliveryFee = Boolean(cfg.show_delivery_fee && (order.delivery_fee || order.shipping_fee));

  const showBarcode = cfg.show_barcode !== false;
  const showQrCode = cfg.show_qr_code !== false;
  const qrCodeType = cfg.qr_code_type || 'invoice';
  const showSignatureLine = Boolean(cfg.show_signature_line);
  const signatureLabel = isBn ? (cfg.signature_label_bn || 'কর্তৃপক্ষের স্বাক্ষর') : (cfg.signature_label || 'Authorized Signature');

  const showReturnPolicy = cfg.show_return_policy !== false;
  const returnPolicyText = isBn
    ? (cfg.return_policy_text_bn || 'বিক্রিত পণ্য মেমোসহ ৭ দিনের মধ্যে পরিবর্তনযোগ্য।')
    : (cfg.return_policy_text || 'Goods once sold can only be exchanged within 7 days with valid receipt.');

  const footerNote = isBn
    ? (cfg.footer_note_bn || shop?.settings?.receipt_footer || 'আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ! আবার আসবেন।')
    : (cfg.footer_note || shop?.settings?.receipt_footer || 'Thank you for shopping with us! Please come again.');
  const showPoweredBy = cfg.show_powered_by !== false;

  // Shop Details
  const shopName = shop?.name || 'Shopo Store';
  const shopAddress = shop?.address?.line1 || shop?.address_line1 || '';
  const shopCity = shop?.address?.city || shop?.city || '';
  const fullAddress = [shopAddress, shopCity].filter(Boolean).join(', ');
  const shopPhone = shop?.phone || '';
  const shopEmail = shop?.email || '';
  const shopWebsite = shop?.website || '';
  const binVatNo = shop?.bin_vat_number || '';

  // Order Details
  const invoiceNo = order.invoice_number || order.invoiceNumber || order.id || 'INV-2026-001';
  const dateStr = formatDate(order.created_at || order.createdAt || order.date);
  const cashierName = order.created_by?.name || order.cashierName || 'Cashier Desk';

  const customerName = order.customer_id?.name || order.customer_name || (isBn ? 'খুচরা ক্রেতা' : 'Walk-in Customer');
  const customerPhone = order.customer_id?.phone || order.customer_phone || '';
  const customerAddress = order.customer_id?.address || order.customer_address || '';
  const isMember = Boolean(order.isMember || order.customer_id?.is_member);
  const memberTier = order.memberTier || order.customer_id?.membership_tier || 'Regular';
  const tierDiscountPercent = Number(order.tierDiscountPercent || order.tier_discount_percent || 0);
  const tierDiscountAmount = Number(order.tierDiscountAmount || order.tier_discount_amount || order.tierExtraDiscount || 0);
  const rewardPointsEarned = Number(order.rewardPointsEarned || order.reward_points_earned || 0);
  const rewardPointsRedeemed = Number(order.rewardPointsRedeemed || order.reward_points_redeemed || 0);
  const rewardDiscountAmount = Number(order.rewardDiscountAmount || order.reward_discount_amount || 0);
  const paymentMethod = (order.payment_method || order.paymentMethod || 'cash').toUpperCase();
  const deliveryFee = Number(order.delivery_fee || order.shipping_fee || 0);

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const taxRate = Number(shop?.settings?.tax_rate || 0);
  const taxName = shop?.settings?.tax_name || 'VAT';
  const taxAmount = Number(order.tax_amount || (taxRate > 0 ? (subtotal * taxRate) / 100 : 0));
  const total = Number(order.total || (subtotal - discount - tierDiscountAmount - rewardDiscountAmount + taxAmount + deliveryFee));
  const paid = Number(order.paid_amount !== undefined ? order.paid_amount : (order.paid !== undefined ? order.paid : total));
  const due = Number(order.due_amount !== undefined ? order.due_amount : (order.due || Math.max(0, total - paid)));
  const customerTotalDue = Number(order.customer_id?.total_due || 0);

  const cashReceived = Number(order.tendered_amount || order.cashReceived || 0);
  const changeReturned = Number(order.change_amount || order.changeToReturn || 0);

  // Dynamic QR Code payload
  let qrPayload = `Shop: ${shopName} | Invoice: ${invoiceNo} | Total: ৳${total} | Date: ${dateStr}`;
  if (qrCodeType === 'bkash') {
    qrPayload = `https://shopo.com.bd/pay/bkash?merchant=${encodeURIComponent(shopPhone)}&amount=${total}&ref=${invoiceNo}`;
  } else if (qrCodeType === 'website') {
    qrPayload = shopWebsite || `https://shopo.com.bd/store/${encodeURIComponent(shopName)}`;
  }
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(qrPayload)}`;

  // Barcode URL (Code 128)
  const barcodeUrl = `https://barcodeapi.org/api/128/${encodeURIComponent(invoiceNo)}`;

  // Paper width CSS
  const maxWidthCss = paperFormat === '58mm'
    ? '54mm'
    : paperFormat === 'A4'
    ? '190mm'
    : paperFormat === 'A5'
    ? '135mm'
    : paperFormat === 'custom'
    ? `${customWidthMm}mm`
    : '76mm';

  const isA4A5 = paperFormat === 'A4' || paperFormat === 'A5';

  // Font size scale
  const baseFontSize = fontSizeScale === 'compact'
    ? (isA4A5 ? '11px' : '9.5px')
    : fontSizeScale === 'large'
    ? (isA4A5 ? '15px' : '12.5px')
    : (isA4A5 ? '13px' : paperFormat === '58mm' ? '10px' : '11px');

  // Padding / Density
  const cellPadding = spacingDensity === 'tight'
    ? (isA4A5 ? '3px 4px' : '2px 2px')
    : spacingDensity === 'relaxed'
    ? (isA4A5 ? '8px 10px' : '5px 4px')
    : (isA4A5 ? '6px 8px' : '3.5px 3px');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isBn ? 'ক্যাশ মেমো' : 'Cash Memo'} - ${invoiceNo}</title>
  <style>
    @page {
      margin: ${isA4A5 ? '10mm' : '2.5mm'};
      size: ${paperFormat === 'A4' ? 'A4 portrait' : paperFormat === 'A5' ? 'A5 portrait' : 'auto'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Hind Siliguri', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #111827;
      background: #ffffff;
      padding: ${isA4A5 ? '16px 20px' : '6px 8px'};
      font-size: ${baseFontSize};
      line-height: 1.35;
      max-width: ${maxWidthCss};
      margin: 0 auto;
      position: relative;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .gap-2 { gap: 8px; }

    /* Watermark */
    ${watermarkType !== 'none' ? `
      .watermark-overlay {
        position: absolute;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-size: ${isA4A5 ? '68px' : '36px'};
        font-weight: 900;
        color: rgba(0, 0, 0, 0.06);
        text-transform: uppercase;
        letter-spacing: 4px;
        pointer-events: none;
        z-index: 0;
        white-space: nowrap;
        user-select: none;
      }
    ` : ''}

    /* Tables */
    table { width: 100%; border-collapse: collapse; margin: 6px 0; position: relative; z-index: 1; }
    th {
      padding: ${cellPadding};
      font-size: ${baseFontSize};
      font-weight: 700;
      text-align: left;
      border-bottom: 1.5px solid ${template === 'modern' || template === 'bold' ? accentColor : '#000000'};
      ${template === 'bold' ? `background-color: ${accentColor}; color: #ffffff;` : ''}
    }
    td {
      padding: ${cellPadding};
      font-size: ${baseFontSize};
      border-bottom: 1px dashed #e5e7eb;
    }

    /* Template Variations */
    ${template === 'classic' ? `
      .receipt-container { border: 2px solid #000000; padding: 8px; }
      .header-box { border-bottom: 2px double #000000; padding-bottom: 6px; }
      .title-badge { border: 1.5px solid #000; font-weight: 800; padding: 2px 8px; display: inline-block; margin-top: 4px; }
    ` : template === 'bold' ? `
      .header-banner { background-color: ${accentColor}; color: #ffffff; padding: 8px 10px; border-radius: 6px; margin-bottom: 6px; }
      .title-badge { background-color: #ffffff; color: ${accentColor}; font-weight: 900; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-top: 4px; }
    ` : template === 'thermal' ? `
      body { font-family: 'Courier New', Courier, monospace; }
      .border-dashed { border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
    ` : `
      /* Modern Minimalist */
      .title-badge { background-color: ${accentColor}18; color: ${accentColor}; font-weight: 800; padding: 2px 10px; border-radius: 9999px; display: inline-block; margin-top: 4px; font-size: 10px; border: 1px solid ${accentColor}40; }
    `}

    .shop-title {
      font-size: ${isA4A5 ? '22px' : '16px'};
      font-weight: 900;
      color: ${template === 'bold' ? '#ffffff' : template === 'modern' ? accentColor : '#000000'};
      letter-spacing: 0.5px;
    }
    .totals-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: ${baseFontSize}; position: relative; z-index: 1; }
    .grand-total {
      display: flex;
      justify-content: space-between;
      font-size: ${isA4A5 ? '16px' : '13.5px'};
      font-weight: 900;
      color: ${template === 'modern' || template === 'bold' ? accentColor : '#000000'};
      border-top: 1.5px solid ${template === 'modern' || template === 'bold' ? accentColor : '#000000'};
      border-bottom: 1.5px solid ${template === 'modern' || template === 'bold' ? accentColor : '#000000'};
      padding: 4px 0;
      margin-top: 4px;
      position: relative;
      z-index: 1;
    }
    .footer-section { text-align: center; font-size: 9.5px; color: #4b5563; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #d1d5db; position: relative; z-index: 1; }
  </style>
</head>
<body>
  <div class="${template === 'classic' ? 'receipt-container' : ''}">
    
    ${watermarkType !== 'none' ? `<div class="watermark-overlay">${watermarkText}</div>` : ''}

    <!-- FLASH HEADER NOTICE -->
    ${headerNotice ? `
      <div style="text-align: center; font-size: 9px; font-weight: 700; background: ${accentColor}15; color: ${accentColor}; padding: 3px 6px; border-radius: 4px; margin-bottom: 4px; border: 1px dashed ${accentColor}40;">
        ⚡ ${headerNotice}
      </div>
    ` : ''}

    <!-- HEADER -->
    <div class="${template === 'bold' ? 'header-banner text-center' : template === 'classic' ? 'header-box text-center' : 'text-center pb-2'}" style="${template === 'modern' ? `border-bottom: 1.5px solid ${accentColor}30; padding-bottom: 6px;` : ''}">
      ${headerSlogan ? `<div style="font-size: 9.5px; opacity: 0.85; margin-bottom: 2px;">${headerSlogan}</div>` : ''}
      ${showLogo ? `<div style="margin-bottom: 4px;"><img src="${shop.logo_url}" alt="Logo" style="max-height: 42px; max-width: 120px; object-fit: contain;" /></div>` : ''}
      <div class="shop-title uppercase">${shopName}</div>
      ${showTagline ? `<div style="font-size: 9.5px; font-style: italic; opacity: 0.85; margin-top: 1px;">${shop.tagline}</div>` : ''}
      
      ${showAddress && fullAddress ? `<div style="font-size: 10px; margin-top: 2px; opacity: 0.9;">${fullAddress}</div>` : ''}
      ${showPhone && shopPhone ? `<div style="font-size: 10px; opacity: 0.9;">${isBn ? 'ফোন / হেল্পলাইন' : 'Phone'}: <strong>${shopPhone}</strong></div>` : ''}
      ${showEmail ? `<div style="font-size: 9.5px; opacity: 0.9;">${shopEmail}</div>` : ''}
      ${showWebsite ? `<div style="font-size: 9.5px; opacity: 0.9;">${shopWebsite}</div>` : ''}
      ${showBinVat ? `<div style="font-size: 9.5px; margin-top: 1px; font-weight: 700;">BIN/VAT Reg: ${binVatNo}</div>` : ''}
      
      <div><span class="title-badge uppercase">${memoTitle}</span></div>
    </div>

    <!-- META INFO (INVOICE & CUSTOMER) -->
    <div style="font-size: ${baseFontSize}; margin-top: 6px; margin-bottom: 6px; line-height: 1.45; position: relative; z-index: 1;">
      <div class="flex justify-between">
        <span><span class="font-bold">${isBn ? 'চালান নং' : 'Invoice #'}:</span> ${invoiceNo}</span>
        <span><span class="font-bold">${isBn ? 'পেমেন্ট' : 'Pay'}:</span> ${paymentMethod}</span>
      </div>
      <div class="flex justify-between">
        <span><span class="font-bold">${isBn ? 'তারিখ' : 'Date'}:</span> ${showInvoiceTime ? dateStr : dateStr.split(' ')[0]}</span>
        ${showCashierName ? `<span><span class="font-bold">${isBn ? 'ক্যাশিয়ার' : 'Billed By'}:</span> ${cashierName}</span>` : ''}
      </div>

      <div style="margin-top: 3px; padding-top: 3px; border-top: 1px dashed #e5e7eb;">
        <div class="flex justify-between items-center">
          <span><span class="font-bold">${isBn ? 'ক্রেতার নাম' : 'Customer'}:</span> ${customerName}</span>
          ${isMember ? `<span style="font-size: 9px; font-weight: 700; background: #fef3c7; color: #b45309; padding: 1px 5px; border-radius: 4px;">👑 ${memberTier}</span>` : ''}
        </div>
        ${showCustomerPhone && customerPhone ? `<div><span class="font-bold">${isBn ? 'মোবাইল' : 'Phone'}:</span> ${customerPhone}</div>` : ''}
        ${showCustomerAddress && customerAddress ? `<div><span class="font-bold">${isBn ? 'ঠিকানা' : 'Address'}:</span> ${customerAddress}</div>` : ''}
      </div>
    </div>

    <!-- ITEMS TABLE -->
    <table>
      <thead>
        <tr>
          ${showLineSerial ? `<th style="width: 8%;">#</th>` : ''}
          <th style="width: ${showLineSerial ? '38%' : showItemSku ? '42%' : '48%'};">${isBn ? 'পণ্যের বিবরণ' : 'Item Description'}</th>
          <th class="text-right" style="width: 26%;">${isBn ? 'দর × পরিমাণ' : 'Price × Qty'}</th>
          <th class="text-right" style="width: 26%;">${isBn ? 'মোট' : 'Total'}</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => {
          const { baseName, variantName, sku } = extractItemVariantInfo(it);
          const price = Number(it.unit_price || it.price || 0);
          const qty = Number(it.quantity || it.qty || 1);
          const unit = it.unit || 'pc';
          const lineTotal = Number(it.subtotal || (price * qty));
          return `
            <tr>
              ${showLineSerial ? `<td>${idx + 1}</td>` : ''}
              <td>
                <div class="font-bold">${baseName}</div>
                ${variantName ? `
                  <div style="font-size: 9px; font-weight: 700; color: #374151; margin-top: 1px;">
                    <span style="display: inline-block; padding: 0.5px 4px; border: 1px solid #d1d5db; border-radius: 3px; background: #f9fafb;">
                      ${variantName}
                    </span>
                  </div>
                ` : ''}
                ${showItemSku && sku ? `<div style="font-size: 8.5px; color: #6b7280; margin-top: 1px;">SKU: ${sku}</div>` : ''}
              </td>
              <td class="text-right">
                ৳${price.toLocaleString()} × ${qty}${showItemUnit ? ` ${unit}` : ''}
              </td>
              <td class="text-right font-bold">৳${lineTotal.toLocaleString()}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- CALCULATION BREAKDOWN -->
    <div style="margin-top: 4px;">
      <div class="totals-row">
        <span>${isBn ? 'উপমোট (Subtotal):' : 'Subtotal:'}</span>
        <span>৳${subtotal.toLocaleString()}</span>
      </div>

      ${discount > 0 ? `
        <div class="totals-row" style="color: #dc2626;">
          <span>${isBn ? 'ছাড় (Discount):' : 'Discount:'}</span>
          <span>- ৳${discount.toLocaleString()}</span>
        </div>
      ` : ''}

      ${tierDiscountAmount > 0 ? `
        <div class="totals-row" style="color: #059669; font-weight: 700;">
          <span>${isBn ? `টিয়ার ছাড় (${memberTier} ${tierDiscountPercent}%):` : `Tier Discount (${memberTier} ${tierDiscountPercent}%):`}</span>
          <span>- ৳${tierDiscountAmount.toLocaleString()}</span>
        </div>
      ` : ''}

      ${rewardDiscountAmount > 0 ? `
        <div class="totals-row" style="color: #d97706; font-weight: 700;">
          <span>${isBn ? 'পয়েন্ট ছাড় (Reward Discount):' : 'Reward Points Discount:'}</span>
          <span>- ৳${rewardDiscountAmount.toLocaleString()}</span>
        </div>
      ` : ''}

      ${(showTaxBreakdown && taxAmount > 0) ? `
        <div class="totals-row" style="color: #4b5563;">
          <span>${isBn ? `${taxName} (${taxRate}%):` : `${taxName} (${taxRate}%):`}</span>
          <span>+ ৳${taxAmount.toLocaleString()}</span>
        </div>
      ` : ''}

      ${(showDeliveryFee && deliveryFee > 0) ? `
        <div class="totals-row" style="color: #4b5563;">
          <span>${isBn ? 'ডেলিভারি চার্জ (Delivery):' : 'Delivery / Shipping:'}</span>
          <span>+ ৳${deliveryFee.toLocaleString()}</span>
        </div>
      ` : ''}

      <div class="grand-total">
        <span>${isBn ? 'সর্বমোট বিল (Net Payable):' : 'Grand Total:'}</span>
        <span>৳${total.toLocaleString()}</span>
      </div>

      <div class="totals-row" style="margin-top: 2px;">
        <span>${isBn ? 'পরিশোধ (Paid):' : 'Paid Amount:'}</span>
        <span class="font-bold">৳${paid.toLocaleString()}</span>
      </div>

      ${due > 0 ? `
        <div class="totals-row font-bold" style="color: #d97706; border-top: 1px dashed #d1d5db; padding-top: 2px;">
          <span>${isBn ? 'এই রশিদের বকেয়া (Due):' : 'Invoice Due:'}</span>
          <span>৳${due.toLocaleString()}</span>
        </div>
      ` : ''}

      ${showCustomerDue && customerTotalDue > 0 ? `
        <div class="totals-row" style="font-size: 10px; color: #dc2626;">
          <span>${isBn ? 'গ্রাহকের মোট বকেয়া ব্যালেন্স:' : 'Total Outstanding Balance:'}</span>
          <span class="font-bold">৳${customerTotalDue.toLocaleString()}</span>
        </div>
      ` : ''}

      ${paymentMethod === 'CASH' && cashReceived > 0 && due === 0 ? `
        <div class="totals-row" style="font-size: 10px; border-top: 1px dashed #e5e7eb; padding-top: 2px; margin-top: 2px;">
          <span>${isBn ? 'নগদ গ্রহণ (Cash Tendered):' : 'Cash Tendered:'}</span>
          <span>৳${cashReceived.toLocaleString()}</span>
        </div>
        <div class="totals-row font-bold" style="font-size: 10.5px;">
          <span>${isBn ? 'ফেরত দেওয়া হয়েছে (Change):' : 'Change Returned:'}</span>
          <span>৳${changeReturned.toLocaleString()}</span>
        </div>
      ` : ''}

      ${(rewardPointsEarned > 0 || rewardPointsRedeemed > 0) ? `
        <div style="margin-top: 4px; padding: 4px 6px; background: #fefce8; border: 1px dashed #ca8a04; border-radius: 4px; font-size: 10px;">
          ${rewardPointsRedeemed > 0 ? `<div>⭐ ${isBn ? 'পয়েন্ট রিডিম:' : 'Points Redeemed:'} <strong>-${rewardPointsRedeemed} pts</strong></div>` : ''}
          ${rewardPointsEarned > 0 ? `<div>⭐ ${isBn ? 'অর্জিত পয়েন্ট:' : 'Points Earned:'} <strong>+${rewardPointsEarned} pts</strong></div>` : ''}
        </div>
      ` : ''}
    </div>

    <!-- BARCODE -->
    ${showBarcode ? `
      <div style="text-align: center; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e5e7eb;">
        <img src="${barcodeUrl}" alt="Barcode" style="max-height: 28px; max-width: 140px; display: block; margin: 0 auto 2px;" />
        <span style="font-size: 8px; font-family: monospace; letter-spacing: 1px; color: #4b5563;">*${invoiceNo}*</span>
      </div>
    ` : ''}

    <!-- RETURN POLICY & TERMS -->
    ${showReturnPolicy && returnPolicyText ? `
      <div style="margin-top: 8px; padding: 4px 6px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 8.5px; color: #4b5563; text-align: center;">
        <strong>${isBn ? 'শর্তাবলী / রিটার্ন পলিসি:' : 'Terms & Return Policy:'}</strong> ${returnPolicyText}
      </div>
    ` : ''}

    <!-- QR CODE & SIGNATURE SECTION -->
    ${(showQrCode || showSignatureLine) ? `
      <div class="flex justify-between items-center" style="margin-top: 12px; padding-top: 6px; border-top: 1px dashed #e5e7eb;">
        ${showQrCode ? `
          <div class="text-center" style="font-size: 8px; color: #6b7280;">
            <img src="${qrUrl}" alt="QR" style="width: 48px; height: 48px; display: block; margin: 0 auto 2px;" />
            <span>${qrCodeType === 'bkash' ? (isBn ? 'বিকাশ পে' : 'bKash Pay') : qrCodeType === 'website' ? (isBn ? 'ওয়েবসাইট' : 'Visit Web') : (isBn ? 'ডিজিটাল যাচাই' : 'Scan to Verify')}</span>
          </div>
        ` : '<div></div>'}

        ${showSignatureLine ? `
          <div class="text-center" style="min-width: 110px;">
            <div style="border-top: 1px solid #374151; margin-top: 26px; padding-top: 2px; font-size: 9px; font-weight: 700;">
              ${signatureLabel}
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- FOOTER GREETING -->
    <div class="footer-section">
      <div class="font-bold">${footerNote}</div>
      ${showPoweredBy ? `<div style="font-size: 8px; color: #9ca3af; margin-top: 3px;">Powered by Shopo Retail Platform (shopo.com.bd)</div>` : ''}
    </div>

  </div>
</body>
</html>`;

  printHtmlViaIframe(html);
};

/**
 * Print a Purchase Invoice & Stock-In Receipt
 */
export const printPurchaseReceipt = ({ purchase, shop, lang = 'en' }) => {
  if (!purchase) return;

  const isBn = lang === 'bn';
  const shopName = shop?.name || 'Shopo Store';
  const shopAddress = shop?.address?.line1 || shop?.address_line1 || '';
  const shopCity = shop?.address?.city || shop?.city || '';
  const fullAddress = [shopAddress, shopCity].filter(Boolean).join(', ');
  const shopPhone = shop?.phone || '';

  const purchaseNo = purchase.purchase_number || purchase.purchaseNumber || purchase.id || 'N/A';
  const dateStr = formatDate(purchase.created_at || purchase.createdAt || purchase.date);

  const supplierName = purchase.supplier_name || (isBn ? 'সাধারণ / সরবরাহকারী' : 'General / Walk-in Supplier');
  const supplierPhone = purchase.supplier_phone || '';
  const paymentMethod = (purchase.payment_method || 'cash').toUpperCase();
  const paymentStatus = (purchase.payment_status || 'paid').toUpperCase();

  const items = Array.isArray(purchase.items) ? purchase.items : [];
  const totalAmount = Number(purchase.total_amount || 0);
  const discount = Number(purchase.discount || 0);
  const netAmount = Number(purchase.net_amount || (totalAmount - discount));
  const paidAmount = Number(purchase.paid_amount || 0);
  const dueAmount = Number(purchase.due_amount || Math.max(0, netAmount - paidAmount));

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isBn ? 'ক্রয় রশিদ' : 'Purchase Invoice'} - ${purchaseNo}</title>
  <style>
    @page {
      margin: 5mm;
      size: auto;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Hind Siliguri', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #000000;
      background: #ffffff;
      padding: 10px 12px;
      font-size: 11px;
      line-height: 1.35;
      max-width: 80mm;
      margin: 0 auto;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .border-b-2 { border-bottom: 2px solid #000; }
    .border-dashed { border-top: 1px dashed #777; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0; }
    th { padding: 4px 2px; font-size: 10.5px; border-bottom: 1px solid #000; text-align: left; }
    td { padding: 3px 2px; font-size: 10.5px; border-bottom: 1px dashed #ddd; }
    .shop-title { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .receipt-title { display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #000; padding: 2px 8px; border-radius: 4px; margin-top: 4px; }
    .totals-row { display: flex; justify-content: space-between; padding: 1.5px 0; font-size: 11px; }
    .grand-total { display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 3px 0; margin-top: 3px; }
    .footer-note { text-align: center; font-size: 9.5px; color: #333; margin-top: 10px; padding-top: 6px; border-top: 1px dashed #777; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="text-center pb-2 border-b-2">
    <div class="shop-title">${shopName}</div>
    ${fullAddress ? `<div style="font-size: 10px; color: #333; margin-top: 2px;">${fullAddress}</div>` : ''}
    ${shopPhone ? `<div style="font-size: 10px; color: #333;">${isBn ? 'ফোন' : 'Phone'}: ${shopPhone}</div>` : ''}
    <div><span class="receipt-title">${isBn ? 'ক্রয় চালান ও স্টক রশিদ' : 'PURCHASE INVOICE & STOCK RECEIPT'}</span></div>
  </div>

  <!-- Meta Info -->
  <div style="font-size: 10.5px; margin-top: 6px; margin-bottom: 6px; line-height: 1.4;">
    <div class="flex justify-between">
      <span><span class="font-bold">${isBn ? 'চালান নং' : 'Invoice'}:</span> #${purchaseNo}</span>
      <span><span class="font-bold">${isBn ? 'স্ট্যাটাস' : 'Status'}:</span> ${paymentStatus}</span>
    </div>
    <div class="flex justify-between">
      <span><span class="font-bold">${isBn ? 'তারিখ' : 'Date'}:</span> ${dateStr}</span>
      <span><span class="font-bold">${isBn ? 'মাধ্যম' : 'Method'}:</span> ${paymentMethod}</span>
    </div>
    <div style="margin-top: 2px; padding-top: 2px; border-top: 1px dashed #ddd;">
      <div><span class="font-bold">${isBn ? 'সরবরাহকারী' : 'Supplier'}:</span> ${supplierName}</div>
      ${supplierPhone ? `<div><span class="font-bold">${isBn ? 'মোবাইল' : 'Phone'}:</span> ${supplierPhone}</div>` : ''}
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width: 45%;">${isBn ? 'পণ্য' : 'Item'}</th>
        <th class="text-right" style="width: 25%;">${isBn ? 'দর × পরিমাণ' : 'Cost × Qty'}</th>
        <th class="text-right" style="width: 30%;">${isBn ? 'মোট' : 'Total'}</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it) => {
        const { baseName, variantName, sku } = extractItemVariantInfo(it);
        const cost = Number(it.unit_cost || 0);
        const qty = Number(it.quantity || 1);
        const lineTotal = Number(it.total_cost || (cost * qty));
        return `
          <tr>
            <td>
              <div class="font-bold">${baseName}</div>
              ${variantName ? `
                <div style="font-size: 9.5px; font-weight: 700; color: #111; margin-top: 1.5px;">
                  <span style="display: inline-block; padding: 0.5px 5px; border: 1px solid #777; border-radius: 3px; background: #f3f4f6;">
                    ${variantName}
                  </span>
                </div>
              ` : ''}
              ${sku ? `<div style="font-size: 8.5px; color: #555; font-family: 'Hind Siliguri', 'Inter', sans-serif; margin-top: 1px;">SKU: ${sku}</div>` : ''}
            </td>
            <td class="text-right">৳${cost.toLocaleString()} × ${qty}</td>
            <td class="text-right font-bold">৳${lineTotal.toLocaleString()}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <!-- Calculations -->
  <div style="margin-top: 4px;">
    <div class="totals-row">
      <span>${isBn ? 'মোট খরচ (Subtotal):' : 'Subtotal Gross:'}</span>
      <span>৳${totalAmount.toLocaleString()}</span>
    </div>

    ${discount > 0 ? `
      <div class="totals-row" style="color: #b91c1c;">
        <span>${isBn ? 'ছাড় (Discount):' : 'Discount:'}</span>
        <span>- ৳${discount.toLocaleString()}</span>
      </div>
    ` : ''}

    <div class="grand-total">
      <span>${isBn ? 'প্রদেয় নিট মূল্য:' : 'Net Payable:'}</span>
      <span>৳${netAmount.toLocaleString()}</span>
    </div>

    <div class="totals-row" style="margin-top: 3px;">
      <span>${isBn ? 'পরিশোধিত টাকা (Paid):' : 'Paid Amount:'}</span>
      <span class="font-bold">৳${paidAmount.toLocaleString()}</span>
    </div>

    ${dueAmount > 0 ? `
      <div class="totals-row font-bold" style="color: #b45309; border-top: 1px dashed #777; padding-top: 2px;">
        <span>${isBn ? 'বকেয়া টাকা (Due):' : 'Due Balance:'}</span>
        <span>৳${dueAmount.toLocaleString()}</span>
      </div>
    ` : ''}
  </div>

  <!-- Footer -->
  <div class="footer-note">
    <div class="font-bold">${isBn ? 'ইনভেন্টরিতে স্টক সফলভাবে যুক্ত হয়েছে' : 'Stock recorded & verified by Shop Manager'}</div>
    <div style="font-size: 8.5px; color: #777; margin-top: 2px;">Shopo Inventory Management (shopo.com.bd)</div>
  </div>
</body>
</html>`;

  printHtmlViaIframe(html);
};

/**
 * Print a Money Receipt / Due Collection Voucher
 */
export const printDueReceipt = ({ voucher, shop, lang = 'en' }) => {
  if (!voucher) return;

  const isBn = lang === 'bn';
  const shopName = shop?.name || 'Shopo Store';
  const shopAddress = shop?.address?.line1 || shop?.address_line1 || '';
  const shopCity = shop?.address?.city || shop?.city || '';
  const fullAddress = [shopAddress, shopCity].filter(Boolean).join(', ');
  const shopPhone = shop?.phone || '';

  const refInvoice = voucher.invoice_number || voucher.invoiceNumber || 'N/A';
  const dateStr = formatDate(voucher.date || voucher.created_at);
  const customerName = voucher.customer_name || (isBn ? 'ক্রেতা' : 'Customer');
  const customerPhone = voucher.customer_phone || '';
  const paymentMethod = (voucher.payment_method || 'cash').toUpperCase();
  const collectedAmount = Number(voucher.collected_amount || 0);
  const remainingDue = Number(voucher.remaining_sale_due !== undefined ? voucher.remaining_sale_due : 0);
  const customerTotalDue = Number(voucher.customer_total_due !== undefined ? voucher.customer_total_due : 0);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isBn ? 'বকেয়া জমার রশিদ' : 'Money Receipt'} - ${refInvoice}</title>
  <style>
    @page { margin: 5mm; size: auto; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Hind Siliguri', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #000000;
      background: #ffffff;
      padding: 10px 12px;
      font-size: 11px;
      line-height: 1.35;
      max-width: 80mm;
      margin: 0 auto;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .border-b-2 { border-bottom: 2px solid #000; }
    .border-t-2 { border-top: 2px solid #000; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .totals-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="text-center pb-2 border-b-2">
    <div style="font-size: 16px; font-weight: 900; text-transform: uppercase;">${shopName}</div>
    ${fullAddress ? `<div style="font-size: 10px; color: #333; margin-top: 2px;">${fullAddress}</div>` : ''}
    ${shopPhone ? `<div style="font-size: 10px; color: #333;">${isBn ? 'ফোন' : 'Phone'}: ${shopPhone}</div>` : ''}
    <div style="margin-top: 4px;"><span style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; border: 1px solid #000; padding: 2px 8px; border-radius: 4px;">${isBn ? 'বকেয়া জমার রশিদ' : 'MONEY RECEIPT'}</span></div>
  </div>

  <!-- Meta Info -->
  <div style="font-size: 10.5px; margin: 6px 0; line-height: 1.4;">
    <div class="flex justify-between">
      <span><span class="font-bold">${isBn ? 'রেফারেন্স ইনভয়েস' : 'Ref Invoice'}:</span> #${refInvoice}</span>
    </div>
    <div class="flex justify-between">
      <span><span class="font-bold">${isBn ? 'তারিখ' : 'Date'}:</span> ${dateStr}</span>
      <span><span class="font-bold">${isBn ? 'পেমেন্ট মাধ্যম' : 'Method'}:</span> ${paymentMethod}</span>
    </div>
    <div style="margin-top: 2px; padding-top: 2px; border-top: 1px dashed #ddd;">
      <div><span class="font-bold">${isBn ? 'প্রদানকারী' : 'Received From'}:</span> ${customerName}</div>
      ${customerPhone ? `<div><span class="font-bold">${isBn ? 'মোবাইল' : 'Phone'}:</span> ${customerPhone}</div>` : ''}
    </div>
  </div>

  <!-- Amount Collected Box -->
  <div style="border: 1.5px solid #000; border-radius: 6px; padding: 8px; margin: 8px 0; background: #fafafa;">
    <div class="flex justify-between" style="font-size: 13px; font-weight: 900;">
      <span>${isBn ? 'গৃহীত টাকা (Amount Paid):' : 'Amount Received:'}</span>
      <span>৳${collectedAmount.toLocaleString()}</span>
    </div>
    ${voucher.note ? `<div style="font-size: 10px; color: #555; margin-top: 4px;"><strong>${isBn ? 'মন্তব্য' : 'Note'}:</strong> ${voucher.note}</div>` : ''}
  </div>

  <!-- Balance Details -->
  <div style="margin-top: 4px;">
    <div class="totals-row">
      <span>${isBn ? 'এই চালানের অবশিষ্ট বকেয়া:' : 'Remaining Invoice Due:'}</span>
      <span class="font-bold">৳${remainingDue.toLocaleString()}</span>
    </div>
    ${customerTotalDue > 0 ? `
      <div class="totals-row" style="color: #b45309;">
        <span>${isBn ? 'কাস্টমারের মোট অবশিষ্ট বকেয়া:' : 'Customer Total Outstanding Due:'}</span>
        <span class="font-bold">৳${customerTotalDue.toLocaleString()}</span>
      </div>
    ` : ''}
  </div>

  <div style="text-align: center; font-size: 9.5px; color: #333; margin-top: 14px; padding-top: 6px; border-top: 1px dashed #777;">
    <div class="font-bold">${isBn ? 'টাকা সফলভাবে গ্রহণ করা হয়েছে। ধন্যবাদ!' : 'Payment received with thanks.'}</div>
    <div style="font-size: 8.5px; color: #777; margin-top: 2px;">Shopo Ledger Verification (shopo.com.bd)</div>
  </div>
</body>
</html>`;

  printHtmlViaIframe(html);
};

/**
 * Print a Customer Account Statement & Transaction History
 */
export const printCustomerStatement = ({ customer, sales = [], shop, lang = 'en' }) => {
  if (!customer) return;

  const isBn = lang === 'bn';
  const shopName = shop?.name || 'Shopo Store';
  const shopAddress = shop?.address?.line1 || shop?.address_line1 || '';
  const shopCity = shop?.address?.city || shop?.city || '';
  const fullAddress = [shopAddress, shopCity].filter(Boolean).join(', ');
  const shopPhone = shop?.phone || '';

  const customerName = customer.name || 'Customer';
  const customerPhone = customer.phone || '';
  const customerAddress = customer.address || '';
  const totalPurchases = Number(customer.total_purchases || 0);
  const totalDue = Number(customer.total_due || 0);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isBn ? 'কাস্টমার লেজার বিবরণী' : 'Customer Statement'} - ${customerName}</title>
  <style>
    @page { margin: 8mm; size: auto; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Hind Siliguri', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #000000;
      background: #ffffff;
      padding: 12px 16px;
      font-size: 11px;
      line-height: 1.4;
      max-width: 100%;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .border-b-2 { border-bottom: 2px solid #000; }
    .border-t-2 { border-top: 2px solid #000; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th { padding: 6px 4px; font-size: 10.5px; border-bottom: 2px solid #000; text-align: left; background: #f4f4f5; }
    td { padding: 5px 4px; font-size: 10.5px; border-bottom: 1px solid #e4e4e7; }
    .totals-box { border: 1.5px solid #000; border-radius: 6px; padding: 8px 12px; margin: 10px 0; display: flex; justify-content: space-between; background: #fafafa; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="text-center pb-3 border-b-2">
    <div style="font-size: 18px; font-weight: 900; text-transform: uppercase;">${shopName}</div>
    ${fullAddress ? `<div style="font-size: 11px; color: #333; margin-top: 2px;">${fullAddress}</div>` : ''}
    ${shopPhone ? `<div style="font-size: 11px; color: #333;">${isBn ? 'ফোন' : 'Phone'}: ${shopPhone}</div>` : ''}
    <div style="margin-top: 6px;"><span style="display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; border: 1.5px solid #000; padding: 3px 10px; border-radius: 4px;">${isBn ? 'কাস্টমার লেজার বিবরণী' : 'CUSTOMER ACCOUNT STATEMENT'}</span></div>
  </div>

  <!-- Customer Meta -->
  <div style="margin: 10px 0; padding: 8px 0; border-bottom: 1px dashed #777;">
    <div class="flex justify-between">
      <div>
        <div style="font-size: 13px; font-weight: bold;">${customerName}</div>
        ${customerPhone ? `<div>${isBn ? 'মোবাইল' : 'Phone'}: ${customerPhone}</div>` : ''}
        ${customerAddress ? `<div>${isBn ? 'ঠিকানা' : 'Address'}: ${customerAddress}</div>` : ''}
      </div>
      <div class="text-right">
        <div>${isBn ? 'তারিখ' : 'Statement Date'}: ${new Date().toLocaleDateString()}</div>
        <div>${isBn ? 'মোট ক্রয়' : 'Total Sales'}: ${sales.length}</div>
      </div>
    </div>
  </div>

  <!-- Summary Balances -->
  <div class="totals-box">
    <div>
      <span style="color: #555;">${isBn ? 'মোট কেনাকাটা (Total Bought):' : 'Total Purchases:'}</span>
      <span class="font-bold" style="margin-left: 6px;">৳${totalPurchases.toLocaleString()}</span>
    </div>
    <div>
      <span style="color: #555;">${isBn ? 'বর্তমান বকেয়া (Outstanding Due):' : 'Outstanding Balance:'}</span>
      <span class="font-bold" style="color: ${totalDue > 0 ? '#dc2626' : '#16a34a'}; margin-left: 6px;">৳${totalDue.toLocaleString()}</span>
    </div>
  </div>

  <!-- Invoices Table -->
  <table>
    <thead>
      <tr>
        <th>${isBn ? 'তারিখ' : 'Date'}</th>
        <th>${isBn ? 'চালান নং' : 'Invoice #'}</th>
        <th>${isBn ? 'পণ্য' : 'Items'}</th>
        <th class="text-right">${isBn ? 'বিল মোট' : 'Bill (৳)'}</th>
        <th class="text-right">${isBn ? 'পরিশোধ' : 'Paid (৳)'}</th>
        <th class="text-right">${isBn ? 'বাকি' : 'Due (৳)'}</th>
      </tr>
    </thead>
    <tbody>
      ${sales.map((s) => {
        const itemsSummary = (s.items || []).map(i => `${i.name || 'Item'} (${i.quantity || 1})`).join(', ');
        return `
          <tr>
            <td>${new Date(s.created_at || s.date).toLocaleDateString()}</td>
            <td class="font-bold">#${s.invoice_number}</td>
            <td style="max-width: 200px;">${itemsSummary || '-'}</td>
            <td class="text-right font-bold">৳${(s.total || 0).toLocaleString()}</td>
            <td class="text-right">৳${(s.paid_amount !== undefined ? s.paid_amount : s.total).toLocaleString()}</td>
            <td class="text-right font-bold" style="color: ${(s.due_amount || 0) > 0 ? '#dc2626' : '#16a34a'};">
              ৳${(s.due_amount || 0).toLocaleString()}
            </td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <!-- Signatures -->
  <div style="display: flex; justify-content: space-between; margin-top: 35px; padding-top: 10px;">
    <div style="border-top: 1px solid #000; width: 140px; text-align: center; font-size: 10px;">Customer Signature</div>
    <div style="border-top: 1px solid #000; width: 140px; text-align: center; font-size: 10px;">Authorized Signature</div>
  </div>
</body>
</html>`;

  printHtmlViaIframe(html);
};

/**
 * Print Expense Voucher Slip
 */
export const printExpenseVoucher = ({ expense, shop, lang = 'en' }) => {
  if (!expense) return;

  const isBn = lang === 'bn';
  const shopName = shop?.name || 'Shopo Store';
  const shopAddress = shop?.address || '';
  const shopPhone = shop?.phone || '';
  const voucherId = expense.id || `EXP-${expense._id ? String(expense._id).slice(-4).toUpperCase() : '0000'}`;
  const expenseDate = formatDate(expense.date || expense.created_at);
  const amountFormatted = (Number(expense.amount) || 0).toLocaleString();

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Expense Voucher - ${voucherId}</title>
  <style>
    @page { size: A5 landscape; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; font-size: 12px; line-height: 1.5; }
    .header { text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 12px; margin-bottom: 14px; }
    .shop-name { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #0284c7; }
    .shop-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
    .voucher-title { display: inline-block; background: #fee2e2; color: #dc2626; border: 1px solid #f87171; padding: 3px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 6px; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .details-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    .details-table td.label { width: 35%; font-weight: 600; color: #475569; }
    .details-table td.value { font-weight: 700; color: #0f172a; }
    .amount-box { margin-top: 16px; padding: 12px 16px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .amount-text { font-size: 18px; font-weight: 800; color: #dc2626; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 10px; }
    .sig-line { border-top: 1px solid #475569; width: 140px; text-align: center; font-size: 10px; color: #475569; padding-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-name">${shopName}</div>
    ${shopAddress ? `<div class="shop-meta">${shopAddress}</div>` : ''}
    ${shopPhone ? `<div class="shop-meta">Tel: ${shopPhone}</div>` : ''}
    <div><span class="voucher-title">${isBn ? 'অফিসিয়াল খরচ ভাউচার' : 'Official Expense Voucher'}</span></div>
  </div>

  <table class="details-table">
    <tr>
      <td class="label">${isBn ? 'ভাউচার নম্বর:' : 'Voucher Ref:'}</td>
      <td class="value font-mono">${voucherId}</td>
    </tr>
    <tr>
      <td class="label">${isBn ? 'তারিখ ও সময়:' : 'Date & Time:'}</td>
      <td class="value">${expenseDate}</td>
    </tr>
    <tr>
      <td class="label">${isBn ? 'খরচের বিবরণ / শিরোনাম:' : 'Expense Title / Purpose:'}</td>
      <td class="value">${expense.title || '-'}</td>
    </tr>
    <tr>
      <td class="label">${isBn ? 'খরচের ক্যাটাগরি:' : 'Expense Category:'}</td>
      <td class="value">${expense.category || 'General'}</td>
    </tr>
    <tr>
      <td class="label">${isBn ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}</td>
      <td class="value uppercase">${expense.method || 'Cash'}</td>
    </tr>
    ${expense.description ? `
    <tr>
      <td class="label">${isBn ? 'নোট / মন্তব্য:' : 'Remarks / Note:'}</td>
      <td class="value">${expense.description}</td>
    </tr>` : ''}
  </table>

  <div class="amount-box">
    <div style="font-weight: 700; font-size: 13px;">${isBn ? 'মোট পরিশোধিত খরচের পরিমাণ:' : 'Total Amount Paid:'}</div>
    <div class="amount-text">৳ ${amountFormatted}</div>
  </div>

  <div class="signatures">
    <div class="sig-line">${isBn ? 'গ্রহণকারীর স্বাক্ষর' : 'Receiver Signature'}</div>
    <div class="sig-line">${isBn ? 'অনুমোদনকারীর স্বাক্ষর' : 'Authorized Signature'}</div>
  </div>
</body>
</html>`;

  printHtmlViaIframe(html);
};

export default {
  printHtmlViaIframe,
  printSaleReceipt,
  printPurchaseReceipt,
  printDueReceipt,
  printCustomerStatement,
  printExpenseVoucher,
};
