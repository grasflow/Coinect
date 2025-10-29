import type { InvoiceDetailDTO, Profile, Client } from "@/types";
import { autoTable } from "jspdf-autotable";
import { readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";

export interface GeneratePDFOptions {
  invoice: InvoiceDetailDTO;
  profile: Profile;
}

/**
 * Generuje profesjonalną fakturę VAT zgodną z polskimi standardami
 */
export async function generateInvoicePDF({ invoice, profile }: GeneratePDFOptions): Promise<Blob> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
    compress: true,
  });

  /** FONTY **/
  const publicDir = join(process.cwd(), "public");
  const fontNormal = readFileSync(join(publicDir, "DejaVuSans.ttf")).toString("base64");
  const fontBold = readFileSync(join(publicDir, "DejaVuSans-Bold.ttf")).toString("base64");

  doc.addFileToVFS("DejaVuSans.ttf", fontNormal);
  doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
  doc.addFileToVFS("DejaVuSans-Bold.ttf", fontBold);
  doc.addFont("DejaVuSans-Bold.ttf", "DejaVuSans", "bold");
  doc.setFont("DejaVuSans", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const centerX = pageWidth / 2;

  // Kolor akcentu z profilu lub domyślny
  const accent = hexToRgb(profile.accent_color) || [25, 55, 110];

  let y = 10;

  /** NAGŁÓWEK FAKTURY **/
  // Logo po lewej stronie
  if (profile.logo_url) {
    try {
      const logoData = await loadImageWithDimensions(profile.logo_url);
      const maxLogoW = 40;
      const maxLogoH = 20;

      // Skaluj proporcjonalnie zachowując proporcje
      const aspectRatio = logoData.width / logoData.height;
      let logoW = maxLogoW;
      let logoH = logoW / aspectRatio;

      // Jeśli wysokość przekracza maksimum, skaluj po wysokości
      if (logoH > maxLogoH) {
        logoH = maxLogoH;
        logoW = logoH * aspectRatio;
      }

      doc.addImage(logoData.base64, "PNG", margin, y, logoW, logoH);
    } catch {
      // Logo nie zostało załadowane
    }
  }

  // FAKTURA NR po prawej stronie
  doc.setFont("DejaVuSans", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...accent);
  doc.text("FAKTURA NR", pageWidth - margin, y + 5, { align: "right" });

  // Numer faktury poniżej
  doc.setFontSize(12);
  doc.text(invoice.invoice_number, pageWidth - margin, y + 12, { align: "right" });

  // Dane wystawienia po prawej stronie
  doc.setFontSize(9);
  doc.setFont("DejaVuSans", "normal");
  doc.setTextColor(0, 0, 0);

  const issuePlace = profile.city || "Gdańsk";
  const invoiceDetails = [
    `Miejsce wystawienia: ${issuePlace}`,
    `Data wystawienia: ${formatDate(invoice.issue_date)}`,
    `Data sprzedaży: ${formatDate(invoice.sale_date)}`,
  ];

  invoiceDetails.forEach((detail, i) => {
    doc.text(detail, pageWidth - margin, y + 20 + i * 5, { align: "right" });
  });

  y += 40;

  // Linia separatorowa
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  /** SPRZEDAWCA I NABYWCA **/
  const colWidth = 85;
  const leftX = margin;
  const rightX = pageWidth - margin - colWidth;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawParty = (title: string, data: Record<string, any>, x: number, startY: number) => {
    let yy = startY;

    // Tytuł sekcji
    doc.setFont("DejaVuSans", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...accent);
    doc.text(title, x, yy);
    yy += 8;

    // Ramka dla danych
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, yy, colWidth, 35, 2, 2, "FD");

    // Zawartość
    doc.setFont("DejaVuSans", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    const contentY = yy + 6;
    const lines: string[] = [];

    // Nazwa firmy/osoby
    if (data.full_name || data.name) {
      lines.push(data.full_name || data.name);
    }

    // Adres
    const address = buildAddress(data);
    if (address) lines.push(address);

    // NIP
    if (data.tax_id) lines.push(`NIP: ${data.tax_id}`);

    // Kontakt
    const contact = [];
    if (data.email) contact.push(data.email);
    if (data.phone) contact.push(`Tel: ${data.phone}`);
    if (contact.length > 0) lines.push(contact.join(", "));

    lines.forEach((line, i) => {
      if (contentY + i * 5 < yy + 35) {
        doc.text(line, x + 3, contentY + i * 5);
      }
    });

    return yy + 40;
  };

  const sellerY = drawParty("SPRZEDAWCA", profile, leftX, y);
  const buyerY = drawParty("NABYWCA", invoice.client || {}, rightX, y);
  y = Math.max(sellerY, buyerY) + 10;

  /** POZYCJE FAKTURY **/
  const tableBody =
    invoice.items?.map((item, index: number) => {
      const net = +item.net_amount;
      const vatRate = +invoice.vat_rate;
      const vat = net * (vatRate / 100);
      const gross = net + vat;
      return [
        (index + 1).toString(),
        decodeHtmlEntities(item.description || ""),
        formatNumber(item.quantity),
        formatCurrency(item.unit_price),
        formatCurrency(item.net_amount),
        `${vatRate}%`,
        formatCurrency(vat),
        formatCurrency(gross),
      ];
    }) || [];

  autoTable(doc, {
    startY: y,
    head: [
      ["Lp.", "Nazwa towaru/usługi", "Ilość", "Cena\nnetto", "Wartość\nnetto", "VAT", "Kwota\nVAT", "Wartość\nbrutto"],
    ],
    body: tableBody,
    theme: "grid",
    tableWidth: pageWidth - 20, // szerokość z marginesami 10mm z każdej strony
    styles: {
      font: "DejaVuSans",
      fontSize: 9,
      cellPadding: 3,
      minCellHeight: 14,
      lineColor: [180, 180, 180],
      lineWidth: 0.3,
      valign: "middle",
      overflow: "visible",
      cellWidth: "auto",
    },
    headStyles: {
      fillColor: accent,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
      fontSize: 8,
      cellPadding: 4,
      lineWidth: 0.4,
      overflow: "visible",
    },
    alternateRowStyles: { fillColor: [250, 252, 255] },
    columnStyles: {
      0: { halign: "center", cellWidth: 12, fontStyle: "bold", overflow: "visible" },
      1: { halign: "left", cellWidth: "auto", cellPadding: { left: 3, right: 3 }, overflow: "visible" },
      2: { halign: "right", cellWidth: 16, overflow: "visible" },
      3: { halign: "right", cellWidth: 18, cellPadding: { right: 3 }, overflow: "visible" },
      4: { halign: "right", cellWidth: 20, cellPadding: { right: 3 }, overflow: "visible" },
      5: { halign: "right", cellWidth: 14, fontStyle: "bold", overflow: "visible" },
      6: { halign: "right", cellWidth: 18, cellPadding: { right: 3 }, overflow: "visible" },
      7: { halign: "right", cellWidth: 20, cellPadding: { right: 3 }, fontStyle: "bold", overflow: "visible" },
    },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      y = data.cursor?.y ? data.cursor.y + 12 : y + 12;
    },
  });

  /** PODSUMOWANIE VAT **/
  // Jeśli faktura ma różne stawki VAT, dodaj podsumowanie VAT
  const vatRates =
    invoice.items?.reduce((acc: Record<number, { net: number; vat: number; gross: number }>, item) => {
      const vatRate = +invoice.vat_rate;
      const net = +item.net_amount;
      const vat = net * (vatRate / 100);
      const gross = net + vat;

      if (!acc[vatRate]) {
        acc[vatRate] = { net: 0, vat: 0, gross: 0 };
      }
      acc[vatRate].net += net;
      acc[vatRate].vat += vat;
      acc[vatRate].gross += gross;

      return acc;
    }, {}) || {};

  const vatRatesCount = Object.keys(vatRates).length;
  if (vatRatesCount > 1) {
    y += 5;

    // Nagłówek podsumowania VAT
    doc.setFont("DejaVuSans", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...accent);
    doc.text("PODSUMOWANIE STAWKI VAT", margin, y);
    y += 8;

    // Tabela podsumowania VAT
    const vatSummaryBody = Object.entries(vatRates).map(([rate, values]) => [
      `${rate}%`,
      formatCurrency(values.net),
      formatCurrency(values.vat),
      formatCurrency(values.gross),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Stawka VAT", "Wartość netto", "Kwota VAT", "Wartość brutto"]],
      body: vatSummaryBody,
      theme: "grid",
      tableWidth: "auto",
      styles: {
        font: "DejaVuSans",
        fontSize: 7.5,
        cellPadding: 3,
        minCellHeight: 10,
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
        valign: "middle",
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: accent,
        fontStyle: "bold",
        halign: "center",
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 20 },
        1: { halign: "right", cellWidth: 28 },
        2: { halign: "right", cellWidth: 28 },
        3: { halign: "right", cellWidth: 28 },
      },
      margin: { left: margin + 20, right: margin + 20 },
      didDrawPage: (data) => {
        y = data.cursor?.y ? data.cursor.y + 8 : y + 8;
      },
    });
  }

  /** PODSUMOWANIE **/
  const net = +invoice.net_amount;
  const vat = +invoice.vat_amount;
  const gross = +invoice.gross_amount;

  // Podsumowanie wartości w ramce
  const summaryW = 85;
  const summaryH = 35;
  const summaryX = pageWidth - margin - summaryW;
  const summaryY = y;

  doc.setDrawColor(...accent);
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(summaryX, summaryY, summaryW, summaryH, 3, 3, "FD");

  doc.setFont("DejaVuSans", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("DO ZAPŁATY", summaryX + summaryW / 2, summaryY + 7, { align: "center" });

  doc.setFont("DejaVuSans", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const summary = [
    ["Wartość netto:", net],
    ["Kwota VAT:", vat],
    ["Razem brutto:", gross],
  ];
  let sy = summaryY + 15;
  summary.forEach(([label, val]) => {
    doc.text(String(label), summaryX + 5, sy);
    doc.setFont("DejaVuSans", "bold");
    doc.text(`${formatNumber(val)} PLN`, summaryX + summaryW - 5, sy, { align: "right" });
    doc.setFont("DejaVuSans", "normal");
    sy += 6;
  });

  // Informacje o płatności obok podsumowania
  const paymentX = margin;
  const paymentY = y;

  doc.setFont("DejaVuSans", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("WARUNKI PŁATNOŚCI", paymentX, paymentY + 7);

  doc.setFont("DejaVuSans", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const paymentInfo = [
    "Sposób płatności: przelew bankowy",
    `Termin płatności: ${formatDate(invoice.due_date || invoice.issue_date)}`,
  ];

  if (profile.bank_account) {
    paymentInfo.push(`Numer konta: ${profile.bank_account}`);
  }
  if (profile.bank_name) {
    paymentInfo.push(`Bank: ${profile.bank_name}`);
  }
  if (profile.bank_swift) {
    paymentInfo.push(`SWIFT/BIC: ${profile.bank_swift}`);
  }

  let py = paymentY + 15;
  paymentInfo.forEach((info) => {
    doc.text(info, paymentX, py);
    py += 6;
  });

  y = Math.max(summaryY + summaryH, py) + 15;

  /** UWAGI **/
  if (invoice.notes) {
    const notes = doc.splitTextToSize(invoice.notes, contentWidth - 20);
    const notesH = notes.length * 6 + 10;
    const notesY = y;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, notesY, contentWidth, notesH, 3, 3, "FD");
    doc.setFont("DejaVuSans", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...accent);
    doc.text("UWAGI:", margin + 5, notesY + 8);
    doc.setFont("DejaVuSans", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(notes, margin + 5, notesY + 15);
    y += notesH + 10;
  }

  /** STOPKA **/
  const totalPages = doc.internal.pages.filter((p) => p != null).length;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Linia separatorowa
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

    // Informacje o wystawieniu faktury
    doc.setFont("DejaVuSans", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    const footerLeft = `Fakturę wystawił: ${profile.full_name || "Nie podano"}`;
    const footerRight = `Data wystawienia: ${formatDate(invoice.issue_date)}`;

    doc.text(footerLeft, margin, pageHeight - 15);
    doc.text(footerRight, pageWidth - margin, pageHeight - 15, { align: "right" });

    // Numerowanie stron
    doc.setFontSize(7);
    doc.text(`Strona ${i} z ${totalPages}`, centerX, pageHeight - 8, { align: "center" });

    // Informacja prawna (opcjonalna)
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    const legalInfo = "Faktura została wystawiona zgodnie z obowiązującymi przepisami prawa polskiego.";
    doc.text(legalInfo, centerX, pageHeight - 5, { align: "center" });
  }

  return doc.output("blob");
}

/** Pomocnicze **/
async function loadImageWithDimensions(url: string): Promise<{ base64: string; width: number; height: number }> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const buffer = Buffer.from(buf);

  // Sprawdź wymiary za pomocą sharp
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Konwertuj do base64
  const base64 = buffer.toString("base64");
  const type = res.headers.get("content-type") || "image/png";
  const base64Data = `data:${type};base64,${base64}`;

  return {
    base64: base64Data,
    width,
    height,
  };
}

function formatDate(date: string) {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${d.getFullYear()}`;
}

function formatNumber(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrency(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return n.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
}

function decodeHtmlEntities(text: string): string {
  const map: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">" };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (m) => map[m] || m);
}

function hexToRgb(hex?: string | null): [number, number, number] | null {
  if (!hex) return null;
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildAddress(obj: Partial<Profile> | Partial<Client>): string {
  const parts = [];
  if (obj.street) parts.push(obj.street);
  const city = [obj.postal_code, obj.city].filter(Boolean).join(" ");
  if (city) parts.push(city);
  if (obj.country && obj.country !== "Polska") parts.push(obj.country);
  return parts.join(", ");
}
