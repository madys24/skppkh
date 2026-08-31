import { ReportData, PhotoAttachment } from "../types";
import { getReportFileName, formatJudulLaporan } from "./dateFormatter";

/**
 * Robust print helper that prints the A4 Report document cleanly into PDF or Paper
 * using an isolated, dedicated print frame. This guarantees:
 * 1. Zero blank pages caused by outer parent overflow/flexbox/transform constraints.
 * 2. Proper multi-page pagination (Page 1+: Report, Page N: Photo Attachments).
 * 3. Correct default PDF filename matching "ddmmyyyy_Nama RHK_Pelaksanaan [konversi Rencana aksi]".
 */
export function printReportDocument(data: ReportData, photos: PhotoAttachment[] = []): void {
  const fileName = getReportFileName(data);

  // Build Kop Surat HTML
  let kopHtml = "";
  if (data.kopTipe && data.kopTipe !== "none") {
    const isKemensos = data.kopTipe === "kemensos";
    const kementerian = isKemensos 
      ? "KEMENTERIAN SOSIAL REPUBLIK INDONESIA" 
      : (data.kopKementerian || "INSTANSI / KEMENTERIAN KUSTOM");
    const eselon1 = isKemensos 
      ? "DIREKTORAT JENDERAL PERLINDUNGAN DAN JAMINAN SOSIAL" 
      : (data.kopEselon1 || "");
    const eselon2 = isKemensos 
      ? "DIREKTORAT PERLINDUNGAN SOSIAL NON KEBENCANAAN" 
      : (data.kopEselon2 || "");
    const kontak = isKemensos
      ? "Jl. Salemba Raya No. 28 Jakarta Pusat 10430 Telp. (021) 3103591 http://www.kemsos.go.id"
      : [data.kopAlamat, data.kopTelepon ? `Telp. ${data.kopTelepon}` : "", data.kopWebsite].filter(Boolean).join(" ");

    const logoHtml = isKemensos
      ? `<img src="/logo-kemensos.svg" alt="Logo Kemensos" style="width: 80px; height: 80px; object-fit: contain;" />`
      : `<svg style="width: 75px; height: 75px;" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 L20 30 L20 60 C 20 80, 50 90, 50 90 C 50 90, 80 80, 80 60 L80 30 Z" fill="#1e293b" />
          <path d="M50 20 L25 33 L25 58 C 25 75, 50 84, 50 84 C 50 84, 75 75, 75 58 L75 33 Z" fill="#f8fafc" />
          <polygon points="50,30 55,42 68,42 58,50 62,62 50,54 38,62 42,50 32,42 45,42" fill="#ca8a04" />
        </svg>`;

    kopHtml = `
      <div style="display: flex; align-items: center; text-align: center; padding-bottom: 12px; border-bottom: 4px double #000; margin-bottom: 24px;">
        <div style="flex-shrink: 0; margin-right: 16px;">
          ${logoHtml}
        </div>
        <div style="flex-grow: 1; text-align: center; color: #000;">
          <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase; line-height: 1.2;">${kementerian}</div>
          ${eselon1 ? `<div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; margin-top: 2px;">${eselon1}</div>` : ""}
          ${eselon2 ? `<div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; margin-top: 2px;">${eselon2}</div>` : ""}
          <div style="font-size: 8.5pt; line-height: 1.3; margin-top: 6px; font-family: Arial, sans-serif;">${kontak}</div>
        </div>
      </div>
    `;
  }

  // Build Photo Attachments HTML
  let photosHtml = "";
  if (photos && photos.length > 0) {
    const photosItems = photos.map((p, idx) => `
      <div style="page-break-inside: avoid; break-inside: avoid; text-align: center; margin-bottom: 24px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
        <img src="${p.base64Data}" alt="${p.caption || p.fileName}" style="max-height: 320px; max-width: 95%; object-fit: contain; border-radius: 4px; background: #fff;" />
        <div style="margin-top: 10px; font-size: 10pt; font-style: italic; font-family: Arial, sans-serif; color: #334155;">
          <strong>Foto ${idx + 1}:</strong> ${p.caption || p.fileName}
        </div>
      </div>
    `).join("");

    photosHtml = `
      <div style="page-break-before: always; break-before: page; padding-top: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">LAMPIRAN: DOKUMENTASI FOTO KEGIATAN</div>
          <div style="width: 120px; border-bottom: 2px solid #000; margin: 8px auto 20px auto;"></div>
        </div>
        <div>
          ${photosItems}
        </div>
      </div>
    `;
  }

  // Build Signature Section
  const signatureImgHtml = data.signatureData
    ? `<img src="${data.signatureData}" alt="Tanda Tangan" style="max-height: 70px; max-width: 180px; object-fit: contain;" />`
    : `<div style="height: 50px;"></div>`;

  const judulLaporan = formatJudulLaporan(data.rencanaAksi);

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 2.5cm 2.5cm 2.5cm 2.5cm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111827;
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 11pt;
      line-height: 1.6;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
    }
    .document-wrapper {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #000;
      text-transform: uppercase;
      margin-top: 20px;
      margin-bottom: 8px;
      page-break-after: avoid;
      break-after: avoid;
    }
    .section-content {
      padding-left: 18px;
      text-align: justify;
      text-justify: inter-word;
    }
    .sub-item {
      margin-bottom: 12px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sub-item-title {
      font-weight: bold;
      margin-bottom: 3px;
    }
    .text-paragraph {
      white-space: pre-line;
      margin: 0;
      color: #1f2937;
    }
    .block-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signature-container {
      margin-top: 36px;
      page-break-inside: avoid;
      break-inside: avoid;
      width: 100%;
    }
    .signature-table {
      width: 100%;
      border-collapse: collapse;
    }
    .signature-table td {
      vertical-align: top;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="document-wrapper">
    ${kopHtml}

    <!-- Header Judul Laporan -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #000;">LAPORAN</div>
      <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 4px 0; color: #000;">TENTANG</div>
      <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #000; line-height: 1.3;">${judulLaporan}</div>
      ${(!data.kopTipe || data.kopTipe === "none") ? '<div style="width: 100%; border-bottom: 2px solid #000; margin-top: 12px; margin-bottom: 20px;"></div>' : ''}
    </div>

    <!-- A. PENDAHULUAN -->
    <div class="block-break">
      <div class="section-title">A. PENDAHULUAN</div>
      <div class="section-content">
        <div class="sub-item">
          <div class="sub-item-title">1. Umum</div>
          <p class="text-paragraph">${data.pendahuluan.umum || "-"}</p>
        </div>
        <div class="sub-item">
          <div class="sub-item-title">2. Maksud dan Tujuan</div>
          <p class="text-paragraph">${data.pendahuluan.maksudDanTujuan || "-"}</p>
        </div>
        <div class="sub-item">
          <div class="sub-item-title">3. Ruang Lingkup</div>
          <p class="text-paragraph">${data.pendahuluan.ruangLingkup || "-"}</p>
        </div>
        <div class="sub-item">
          <div class="sub-item-title">4. Dasar</div>
          <p class="text-paragraph">${data.pendahuluan.dasar || "-"}</p>
        </div>
      </div>
    </div>

    <!-- B. KEGIATAN YANG DILAKSANAKAN -->
    <div class="block-break" style="margin-top: 16px;">
      <div class="section-title">B. KEGIATAN YANG DILAKSANAKAN</div>
      <div class="section-content">
        <p class="text-paragraph">${data.kegiatanLaksana || "-"}</p>
      </div>
    </div>

    <!-- C. HASIL YANG DICAPAI -->
    <div class="block-break" style="margin-top: 16px;">
      <div class="section-title">C. HASIL YANG DICAPAI</div>
      <div class="section-content">
        <p class="text-paragraph">${data.hasilDicapai || "-"}</p>
      </div>
    </div>

    <!-- D. SIMPULAN DAN SARAN -->
    <div class="block-break" style="margin-top: 16px;">
      <div class="section-title">D. SIMPULAN DAN SARAN</div>
      <div class="section-content">
        <div class="sub-item">
          <div class="sub-item-title">1. Kesimpulan</div>
          <p class="text-paragraph">${data.simpulanDanSaran.kesimpulan || "-"}</p>
        </div>
        <div class="sub-item">
          <div class="sub-item-title">2. Saran</div>
          <p class="text-paragraph">${data.simpulanDanSaran.saran || "-"}</p>
        </div>
      </div>
    </div>

    <!-- E. PENUTUP -->
    <div class="block-break" style="margin-top: 16px;">
      <div class="section-title">E. PENUTUP</div>
      <div class="section-content">
        <p class="text-paragraph">${data.penutup || "-"}</p>
      </div>
    </div>

    <!-- Tanda Tangan -->
    <div class="signature-container">
      <table class="signature-table">
        <tr>
          <td style="width: 52%;"></td>
          <td style="width: 48%; text-align: left;">
            <div>${data.tempatPembuatan || "Jakarta"}, ${data.tanggalPembuatan || "15 Juni 2026"}</div>
            <div style="font-weight: bold; text-transform: uppercase; font-size: 9.5pt; margin-top: 2px; letter-spacing: 0.5px;">${data.jabatan || "Pelapor"}</div>
            <div style="height: 75px; display: flex; align-items: center; justify-content: flex-start; margin: 4px 0;">
              ${signatureImgHtml}
            </div>
            <div style="width: 200px; border-bottom: 1px solid #475569; margin-bottom: 6px;"></div>
            <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase; color: #000;">${data.nama || "-"}</div>
            <div style="color: #4b5563;">NIP. ${data.nip || "-"}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Lampiran Dokumentasi Foto -->
    ${photosHtml}
  </div>
</body>
</html>`;

  // Create isolated iframe
  let printFrame = document.getElementById("pdf-print-iframe") as HTMLIFrameElement;
  if (printFrame) {
    document.body.removeChild(printFrame);
  }

  const origTitle = document.title;
  document.title = fileName;

  printFrame = document.createElement("iframe");
  printFrame.id = "pdf-print-iframe";
  printFrame.style.position = "fixed";
  printFrame.style.top = "0";
  printFrame.style.left = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "none";
  printFrame.style.visibility = "hidden";
  printFrame.style.zIndex = "-9999";

  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (!frameDoc) {
    // Fallback: direct window.print()
    window.print();
    setTimeout(() => {
      document.title = origTitle;
    }, 2000);
    return;
  }

  frameDoc.open();
  frameDoc.write(fullHtml);
  frameDoc.close();

  // Ensure title is also set on the frame document
  try {
    frameDoc.title = fileName;
  } catch {}

  // Wait for images and layout inside iframe to be fully ready before printing
  setTimeout(() => {
    try {
      const frameWin = printFrame.contentWindow;
      if (frameWin) {
        frameWin.focus();
        frameWin.print();
      } else {
        window.print();
      }
    } catch (e) {
      console.warn("Iframe print error, falling back to window.print():", e);
      window.print();
    } finally {
      // Restore title after dialog closes
      setTimeout(() => {
        document.title = origTitle;
      }, 3000);
    }
  }, 400);
}
