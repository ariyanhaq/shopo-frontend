/**
 * @file barcodePrinter.js
 * @description Barcode & Product Label Printing Engine with SVG Barcodes,
 * Customizable Templates (A4 Grid Sheets, Thermal Rolls, Jewelry Tags),
 * and Isolated Iframe Print Execution.
 */

import JsBarcode from 'jsbarcode';

/**
 * Auto-generate standard unique 12-13 digit retail barcode with checksum (e.g. 20XXXXXXXXXX)
 */
export const generateUniqueBarcode = (prefix = '20') => {
  const timestampPart = Date.now().toString().slice(-6);
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  const raw11 = `${prefix}${timestampPart}${randomPart}`;
  let sum = 0;
  for (let i = 0; i < raw11.length; i++) {
    const digit = parseInt(raw11[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return `${raw11}${checksum}`;
};

/**
 * Standard Barcode Label Presets
 */
export const BARCODE_PRESETS = [
  {
    id: 'thermal_50x30',
    name: 'Thermal Roll (50mm x 30mm)',
    nameBn: 'থার্মাল রোল (৫০মিমি x ৩০মিমি)',
    type: 'roll',
    widthMm: 50,
    heightMm: 30,
    columns: 1,
    rowsPerPage: 1,
    gapMm: 2,
    barcodeHeight: 28,
    barcodeWidth: 1.4,
    fontSize: 9,
    description: 'Standard 2" x 1.2" thermal barcode sticker',
  },
  {
    id: 'thermal_40x25',
    name: 'Thermal Roll (40mm x 25mm)',
    nameBn: 'থার্মাল রোল (৪০মিমি x ২৫মিমি)',
    type: 'roll',
    widthMm: 40,
    heightMm: 25,
    columns: 1,
    rowsPerPage: 1,
    gapMm: 2,
    barcodeHeight: 22,
    barcodeWidth: 1.2,
    fontSize: 8,
    description: 'Compact retail sticker roll',
  },
  {
    id: 'thermal_38x25',
    name: 'Thermal Roll (38mm x 25mm / 1.5" x 1")',
    nameBn: 'থার্মাল রোল (৩৮মিমি x ২৫মিমি)',
    type: 'roll',
    widthMm: 38,
    heightMm: 25,
    columns: 1,
    rowsPerPage: 1,
    gapMm: 2,
    barcodeHeight: 20,
    barcodeWidth: 1.1,
    fontSize: 8,
    description: 'Small 1.5" x 1" barcode roll',
  },
  {
    id: 'thermal_58x40',
    name: 'Thermal Garment / Apparel (58mm x 40mm)',
    nameBn: 'গার্মেন্টস / অ্যাপারেল ট্যাগ (৫৮মিমি x ৪০মিমি)',
    type: 'roll',
    widthMm: 58,
    heightMm: 40,
    columns: 1,
    rowsPerPage: 1,
    gapMm: 3,
    barcodeHeight: 35,
    barcodeWidth: 1.5,
    fontSize: 10,
    description: 'Large clothing price tag',
  },
  {
    id: 'custom_roll',
    name: 'Custom Dimensions (Roll / Label)',
    nameBn: 'কাস্টম সাইজ (রোল / থার্মাল)',
    type: 'roll',
    widthMm: 50,
    heightMm: 30,
    columns: 1,
    rowsPerPage: 1,
    gapMm: 2,
    barcodeHeight: 26,
    barcodeWidth: 1.3,
    fontSize: 9,
    description: 'User-specified width & height in millimeters',
  },
  {
    id: 'a4_24',
    name: 'A4 Sheet - 24 Labels (3 x 8)',
    nameBn: 'A4 স্টিকার শিট - ২৪টি (৩ x ৮)',
    type: 'sheet',
    pageWidthMm: 210,
    pageHeightMm: 297,
    columns: 3,
    rowsPerPage: 8,
    widthMm: 70,
    heightMm: 37,
    gapMm: 1,
    marginMm: 5,
    barcodeHeight: 30,
    barcodeWidth: 1.4,
    fontSize: 9,
    description: 'Standard A4 24-up label sheet',
  },
  {
    id: 'a4_30',
    name: 'A4 Sheet - 30 Labels (3 x 10)',
    nameBn: 'A4 স্টিকার শিট - ৩০টি (৩ x ১০)',
    type: 'sheet',
    pageWidthMm: 210,
    pageHeightMm: 297,
    columns: 3,
    rowsPerPage: 10,
    widthMm: 70,
    heightMm: 29.7,
    gapMm: 1,
    marginMm: 4,
    barcodeHeight: 24,
    barcodeWidth: 1.3,
    fontSize: 8.5,
    description: 'Standard A4 30-up label sheet',
  },
  {
    id: 'a4_40',
    name: 'A4 Sheet - 40 Labels (4 x 10)',
    nameBn: 'A4 স্টিকার শিট - ৪০টি (৪ x ১০)',
    type: 'sheet',
    pageWidthMm: 210,
    pageHeightMm: 297,
    columns: 4,
    rowsPerPage: 10,
    widthMm: 52.5,
    heightMm: 29.7,
    gapMm: 1,
    marginMm: 4,
    barcodeHeight: 22,
    barcodeWidth: 1.1,
    fontSize: 8,
    description: 'Compact A4 40-up label sheet',
  },
  {
    id: 'a4_65',
    name: 'A4 Sheet - 65 Labels (5 x 13 Micro)',
    nameBn: 'A4 স্টিকার শিট - ৬৫টি মাইক্রো (৫ x ১৩)',
    type: 'sheet',
    pageWidthMm: 210,
    pageHeightMm: 297,
    columns: 5,
    rowsPerPage: 13,
    widthMm: 38,
    heightMm: 21.2,
    gapMm: 1,
    marginMm: 3,
    barcodeHeight: 18,
    barcodeWidth: 0.9,
    fontSize: 7,
    description: 'High-density micro labels',
  },
];

/**
 * Generate an SVG barcode string safely using JsBarcode
 */
export const generateBarcodeSvg = (code, options = {}) => {
  if (!code) code = '00000000';
  const cleanCode = String(code).trim();

  try {
    const xmlSerializer = new XMLSerializer();
    const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    JsBarcode(svgNode, cleanCode, {
      format: options.format || 'CODE128',
      width: options.width || 1.3,
      height: options.height || 26,
      displayValue: false, // We render the human-readable text in our custom styled HTML
      margin: 0,
      font: 'monospace',
      background: 'transparent',
      lineColor: '#000000',
    });

    return xmlSerializer.serializeToString(svgNode);
  } catch (err) {
    console.warn(`JsBarcode fallback for code "${cleanCode}":`, err);
    // Fallback vector SVG barcode placeholder
    return `<div style="font-family:monospace;font-size:9px;font-weight:bold;letter-spacing:1px;border:1px dashed #666;padding:2px 4px;">*${cleanCode}*</div>`;
  }
};

/**
 * Render barcode directly into an SVG DOM element (useful for React component live preview)
 */
export const renderBarcodeElement = (svgElement, code, options = {}) => {
  if (!svgElement || !code) return;
  try {
    JsBarcode(svgElement, String(code).trim(), {
      format: options.format || 'CODE128',
      width: options.width || 1.3,
      height: options.height || 26,
      displayValue: false,
      margin: 0,
      font: 'monospace',
      background: 'transparent',
      lineColor: '#000000',
    });
  } catch (err) {
    console.warn('Failed to render barcode element:', err);
  }
};

/**
 * Print Barcode Labels via Isolated Hidden Iframe
 */
export const printBarcodeLabelsViaIframe = ({ items = [], settings = {}, shopInfo = {} }) => {
  try {
    const existingIframe = document.getElementById('shopo-barcode-print-frame');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'shopo-barcode-print-frame';
    iframe.setAttribute('style', 'position:fixed;left:-9999px;top:0;width:900px;height:1200px;border:none;visibility:visible;z-index:-9999;');
    document.body.appendChild(iframe);

    let preset = BARCODE_PRESETS.find((p) => p.id === settings.presetId) || BARCODE_PRESETS[0];
    if (settings.presetId === 'custom_roll' || settings.customWidthMm || settings.customHeightMm) {
      const w = Math.max(15, parseFloat(settings.customWidthMm) || preset.widthMm || 50);
      const h = Math.max(10, parseFloat(settings.customHeightMm) || preset.heightMm || 30);
      preset = {
        ...preset,
        widthMm: w,
        heightMm: h,
        barcodeHeight: Math.max(16, Math.min(70, Math.round(h * 0.75))),
        barcodeWidth: Math.max(0.8, Math.min(2.5, +(w / 38).toFixed(2))),
        fontSize: Math.max(7, Math.min(13, Math.round(h * 0.28))),
      };
    }

    // Flatten items according to each item's requested print quantity
    const labelList = [];
    items.forEach((item) => {
      const copies = Math.max(0, parseInt(item.copies, 10) || 0);
      for (let i = 0; i < copies; i++) {
        labelList.push(item);
      }
    });

    if (labelList.length === 0) {
      return;
    }

    const htmlContent = generateBarcodePrintHtml({
      labelList,
      preset,
      settings,
      shopInfo,
    });

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Error invoking barcode print dialog:', err);
      }
    };

    setTimeout(triggerPrint, 350);
  } catch (error) {
    console.error('Failed to generate barcode print frame:', error);
  }
};

/**
 * Generate full HTML document for barcode printing
 */
const generateBarcodePrintHtml = ({ labelList, preset, settings, shopInfo }) => {
  const isRoll = preset.type === 'roll';
  const showShopName = settings.showShopName !== false;
  const shopNameText = settings.customShopName || shopInfo?.name || 'SHOPO STORE';
  const showProductName = settings.showProductName !== false;
  const showVariantName = settings.showVariantName !== false;
  const showBarcode = settings.showBarcode !== false;
  const showBarcodeText = settings.showBarcodeText !== false;
  const showPrice = settings.showPrice !== false;
  const currencySymbol = settings.currencySymbol || '৳';
  const pricePrefix = settings.pricePrefix || 'MRP:';
  const customFooter = settings.customFooter || '';

  // Generate label items HTML
  const labelsHtml = labelList
    .map((item, idx) => {
      const code = item.barcode || item.sku || item.code || String(item._id || item.id || '00000000').slice(-8).toUpperCase();
      const barcodeSvg = showBarcode
        ? generateBarcodeSvg(code, {
            height: preset.barcodeHeight || 24,
            width: preset.barcodeWidth || 1.3,
          })
        : '';

      const price = Number(item.selling_price || item.sellPrice || item.price || 0);

      return `
        <div class="barcode-label" style="width: ${preset.widthMm}mm; height: ${preset.heightMm}mm;">
          <div class="label-inner">
            ${showShopName ? `<div class="label-shop-name">${shopNameText}</div>` : ''}
            
            <div class="label-center-block">
              ${
                showBarcode
                  ? `
                  <div class="label-barcode-svg">
                    ${barcodeSvg}
                  </div>
                `
                  : ''
              }
              ${showBarcodeText ? `<div class="label-code-text">${code}</div>` : ''}
            </div>

            <div class="label-bottom-row">
              <div class="label-bottom-left">
                ${showProductName ? `<div class="label-prod-name" title="${item.name || ''}">${item.name || 'Product'}</div>` : ''}
                ${showVariantName && item.variant_name ? `<div class="label-variant-name">${item.variant_name}</div>` : ''}
                ${customFooter ? `<div class="label-custom-footer">${customFooter}</div>` : ''}
              </div>
              ${
                showPrice
                  ? `
                  <div class="label-bottom-right">
                    <div class="label-price-val">
                      ${pricePrefix ? `<span class="label-price-prefix">${pricePrefix} </span>` : ''}${currencySymbol}${price.toLocaleString()}
                    </div>
                  </div>
                `
                  : ''
              }
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Print Barcode Labels - Shopo</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: ${isRoll ? `${preset.widthMm}mm ${preset.heightMm}mm` : 'A4 portrait'};
          margin: ${isRoll ? '0mm' : `${preset.marginMm || 4}mm`};
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body {
          font-family: 'Inter', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #ffffff;
          color: #000000;
          margin: 0;
          padding: 0;
        }

        .labels-container {
          ${
            isRoll
              ? `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: ${preset.widthMm}mm;
          `
              : `
            display: grid;
            grid-template-columns: repeat(${preset.columns}, ${preset.widthMm}mm);
            gap: ${preset.gapMm || 1}mm;
            justify-content: center;
            align-content: start;
            width: 100%;
          `
          }
        }

        .barcode-label {
          box-sizing: border-box;
          overflow: hidden;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          page-break-inside: avoid;
          break-inside: avoid;
          ${
            isRoll
              ? `
            margin: 0 auto;
            page-break-after: always;
          `
              : `
            border: 0.25pt dashed rgba(0,0,0,0.15); /* Light cut-guide on sheets */
          `
          }
        }

        .label-inner {
          width: 100%;
          height: 100%;
          padding: 1.5mm 2mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          line-height: 1.15;
          text-align: center;
        }

        .label-shop-name {
          font-size: ${Math.max(6.5, preset.fontSize - 0.5)}pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0f172a;
          text-align: center;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .label-center-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin: auto 0;
        }

        .label-barcode-svg {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin: 0.2mm 0;
        }

        .label-barcode-svg svg {
          max-width: 98%;
          height: ${preset.barcodeHeight}px;
          display: block;
        }

        .label-code-text {
          font-family: 'Inter', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: ${Math.max(7.5, preset.fontSize + 0.5)}pt;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #000000;
          line-height: 1;
          margin-top: 0.3mm;
          text-align: center;
        }

        .label-bottom-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          width: 100%;
          gap: 1.5mm;
          margin-top: auto;
        }

        .label-bottom-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          min-width: 0;
          flex: 1;
        }

        .label-prod-name {
          font-size: ${Math.max(6, preset.fontSize - 1.5)}pt;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          line-height: 1.2;
        }

        .label-variant-name {
          font-size: ${Math.max(5.5, preset.fontSize - 2.2)}pt;
          font-weight: 600;
          color: #475569;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          line-height: 1.1;
        }

        .label-custom-footer {
          font-size: ${Math.max(5, preset.fontSize - 3)}pt;
          color: #64748b;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        .label-bottom-right {
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          text-align: right;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .label-price-val {
          font-size: ${Math.max(9, preset.fontSize + 3.5)}pt;
          font-weight: 800;
          color: #000000;
          font-family: 'Inter', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          line-height: 1;
        }

        .label-price-prefix {
          font-size: ${Math.max(5.5, preset.fontSize - 2.5)}pt;
          font-weight: 700;
          color: #475569;
        }

        @media screen {
          body {
            background: #f1f5f9;
            padding: 20px;
            display: flex;
            justify-content: center;
          }
          .labels-container {
            background: #ffffff;
            padding: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
        }
      </style>
    </head>
    <body>
      <div class="labels-container">
        ${labelsHtml}
      </div>
    </body>
    </html>
  `;
};
