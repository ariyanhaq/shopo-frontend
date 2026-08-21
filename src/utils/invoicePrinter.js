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
 * Print a Sales Cash Memo / POS Receipt
 */
export const printSaleReceipt = ({ order, shop, lang = 'en' }) => {
  if (!order) return;

  const isBn = lang === 'bn';
  const shopName = shop?.name || 'Shopo Store';
  const shopAddress = shop?.address?.line1 || shop?.address_line1 || '';
  const shopCity = shop?.address?.city || shop?.city || '';
  const fullAddress = [shopAddress, shopCity].filter(Boolean).join(', ');
  const shopPhone = shop?.phone || '';

  const invoiceNo = order.invoice_number || order.invoiceNumber || order.id || 'N/A';
  const dateStr = formatDate(order.created_at || order.createdAt || order.date);

  const customerName = order.customer_id?.name || order.customer_name || (isBn ? 'খুচরা ক্রেতা' : 'Walk-in Customer');
  const customerPhone = order.customer_id?.phone || order.customer_phone || '';
  const paymentMethod = (order.payment_method || order.paymentMethod || 'cash').toUpperCase();

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.total || (subtotal - discount));
  const paid = Number(order.paid_amount !== undefined ? order.paid_amount : (order.paid !== undefined ? order.paid : total));
  const due = Number(order.due_amount !== undefined ? order.due_amount : (order.due || Math.max(0, total - paid)));
  const customerTotalDue = Number(order.customer_id?.total_due || 0);

  const cashReceived = Number(order.tendered_amount || order.cashReceived || 0);
  const changeReturned = Number(order.change_amount || order.changeToReturn || 0);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isBn ? 'ক্যাশ মেমো' : 'Cash Memo'} - ${invoiceNo}</title>
  <style>
    @page {
      margin: 4mm;
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
      padding: 8px 10px;
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
    .border-t { border-top: 1px solid #000; }
    .border-b { border-bottom: 1px solid #000; }
    .border-b-2 { border-bottom: 2px solid #000; }
    .border-dashed { border-top: 1px dashed #777; }
    .my-1 { margin-top: 4px; margin-bottom: 4px; }
    .my-2 { margin-top: 6px; margin-bottom: 6px; }
    .py-1 { padding-top: 3px; padding-bottom: 3px; }
    .py-2 { padding-top: 5px; padding-bottom: 5px; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-center { align-items: center; }
    table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    th { padding: 4px 2px; font-size: 10.5px; border-bottom: 1px solid #000; text-align: left; }
    td { padding: 3px 2px; font-size: 10.5px; border-bottom: 1px dashed #ddd; }
    .shop-title { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .receipt-title { display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #000; padding: 2px 8px; border-radius: 4px; margin-top: 4px; }
    .badge { font-weight: bold; font-size: 9px; padding: 1px 4px; border: 1px solid #000; border-radius: 3px; }
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
    ${shopPhone ? `<div style="font-size: 10px; color: #333;">${isBn ? 'মোবাইল' : 'Phone'}: ${shopPhone}</div>` : ''}
    <div><span class="receipt-title">${isBn ? 'ক্যাশ মেমো / রশিদ' : 'CASH MEMO / INVOICE'}</span></div>
  </div>

  <!-- Meta Info -->
  <div style="font-size: 10.5px; margin-top: 6px; margin-bottom: 6px; line-height: 1.4;">
    <div class="flex justify-between">
      <span><span class="font-bold">${isBn ? 'চালান নং' : 'Invoice'}:</span> #${invoiceNo}</span>
      <span><span class="font-bold">${isBn ? 'মাধ্যম' : 'Pay'}:</span> ${paymentMethod}</span>
    </div>
    <div class="flex justify-between">
      <span><span class="font-bold">${isBn ? 'তারিখ' : 'Date'}:</span> ${dateStr}</span>
    </div>
    <div style="margin-top: 2px; padding-top: 2px; border-top: 1px dashed #ddd;">
      <div><span class="font-bold">${isBn ? 'ক্রেতা' : 'Customer'}:</span> ${customerName}</div>
      ${customerPhone ? `<div><span class="font-bold">${isBn ? 'ফোন' : 'Phone'}:</span> ${customerPhone}</div>` : ''}
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width: 45%;">${isBn ? 'বিবরণ' : 'Item'}</th>
        <th class="text-right" style="width: 25%;">${isBn ? 'দর × পরিমাণ' : 'Rate × Qty'}</th>
        <th class="text-right" style="width: 30%;">${isBn ? 'মোট' : 'Total'}</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it) => {
        const { baseName, variantName, sku } = extractItemVariantInfo(it);
        const price = Number(it.unit_price || it.price || 0);
        const qty = Number(it.quantity || it.qty || 1);
        const lineTotal = Number(it.subtotal || (price * qty));
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
            <td class="text-right">${price.toLocaleString()} × ${qty}</td>
            <td class="text-right font-bold">৳${lineTotal.toLocaleString()}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <!-- Calculation Breakdown -->
  <div style="margin-top: 4px;">
    <div class="totals-row">
      <span>${isBn ? 'উপমোট (Subtotal):' : 'Subtotal:'}</span>
      <span>৳${subtotal.toLocaleString()}</span>
    </div>

    ${discount > 0 ? `
      <div class="totals-row" style="color: #b91c1c;">
        <span>${isBn ? 'ছাড় (Discount):' : 'Discount:'}</span>
        <span>- ৳${discount.toLocaleString()}</span>
      </div>
    ` : ''}

    <div class="grand-total">
      <span>${isBn ? 'সর্বমোট বিল (Net Total):' : 'Grand Total:'}</span>
      <span>৳${total.toLocaleString()}</span>
    </div>

    <div class="totals-row" style="margin-top: 3px;">
      <span>${isBn ? 'পরিশোধ (Paid):' : 'Paid Amount:'}</span>
      <span class="font-bold">৳${paid.toLocaleString()}</span>
    </div>

    ${due > 0 ? `
      <div class="totals-row font-bold" style="color: #b45309; border-top: 1px dashed #777; padding-top: 2px;">
        <span>${isBn ? 'এই বিলের বকেয়া (Due):' : 'Current Due:'}</span>
        <span>৳${due.toLocaleString()}</span>
      </div>
    ` : ''}

    ${customerTotalDue > 0 ? `
      <div class="totals-row" style="font-size: 10px; color: #666;">
        <span>${isBn ? 'কাস্টমারের মোট বকেয়া:' : 'Total Outstanding Due:'}</span>
        <span class="font-bold">৳${customerTotalDue.toLocaleString()}</span>
      </div>
    ` : ''}

    ${paymentMethod === 'CASH' && cashReceived > 0 && due === 0 ? `
      <div class="totals-row" style="font-size: 10px; border-top: 1px dashed #ddd; padding-top: 2px; margin-top: 2px;">
        <span>${isBn ? 'নগদ গ্রহণ (Cash Received):' : 'Cash Received:'}</span>
        <span>৳${cashReceived.toLocaleString()}</span>
      </div>
      <div class="totals-row font-bold" style="font-size: 10.5px;">
        <span>${isBn ? 'ফেরত দেওয়া হয়েছে (Change):' : 'Change Returned:'}</span>
        <span>৳${changeReturned.toLocaleString()}</span>
      </div>
    ` : ''}
  </div>

  <!-- Footer -->
  <div class="footer-note">
    <div class="font-bold">${isBn ? 'আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!' : 'Thank you for shopping with us!'}</div>
    <div style="font-size: 8.5px; color: #777; margin-top: 2px;">Powered by Shopo (shopo.com.bd)</div>
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

export default {
  printHtmlViaIframe,
  printSaleReceipt,
  printPurchaseReceipt,
  printDueReceipt,
  printCustomerStatement,
};
