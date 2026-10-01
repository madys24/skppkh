import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ReportData, PhotoAttachment } from "../types";
import { getReportFileName, formatJudulLaporan, extractFormalDateForSignature } from "./dateFormatter";
import { printReportDocument } from "./printHelper";

interface FlowItem {
  id: string;
  html: string;
  isHeading?: boolean;
  isMandatoryPage1?: boolean;
}

/**
 * Downloads a pristine, official multi-page A4 PDF report:
 * 1. Exactly 2.5cm Top, 2.5cm Bottom, 2.5cm Left, 2.0cm Right margins on EVERY page.
 * 2. Page 1 begins cleanly with Kop Surat & Title, immediately followed by A. PENDAHULUAN and 1. Umum (NEVER breaking after title).
 * 3. Paragraphs and sentences flow smoothly without being sliced horizontally.
 * 4. Proper footer with page numbers ("Halaman X dari Y") on every page.
 * 5. Clean photo attachments on dedicated sheets (max 2 per page).
 */
export async function downloadDirectPdf(data: ReportData, photos: PhotoAttachment[] = []): Promise<void> {
  const fileName = `${getReportFileName(data)}.pdf`;

  // Wait for web fonts if available
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  // 1. Build Kop Surat HTML
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
      ? `<img src="/logo-kemensos.svg" alt="Logo Kemensos" style="width: 70px; height: 70px; object-fit: contain; display: block;" />`
      : `<svg style="width: 66px; height: 66px;" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 L20 30 L20 60 C 20 80, 50 90, 50 90 C 50 90, 80 80, 80 60 L80 30 Z" fill="#1e293b" />
          <path d="M50 20 L25 33 L25 58 C 25 75, 50 84, 50 84 C 50 84, 75 75, 75 58 L75 33 Z" fill="#f8fafc" />
          <polygon points="50,30 55,42 68,42 58,50 62,62 50,54 38,62 42,50 32,42 45,42" fill="#ca8a04" />
        </svg>`;

    kopHtml = `
      <div style="display: flex; align-items: center; justify-content: center; padding-bottom: 6px; border-bottom: 3px double #000; margin-bottom: 14px;">
        <div style="flex-shrink: 0; margin-right: 14px;">
          ${logoHtml}
        </div>
        <div style="flex-grow: 1; text-align: center; color: #000;">
          <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; line-height: 1.15;">${kementerian}</div>
          ${eselon1 ? `<div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; line-height: 1.15; margin-top: 2px;">${eselon1}</div>` : ""}
          ${eselon2 ? `<div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.15; margin-top: 2px;">${eselon2}</div>` : ""}
          <div style="font-size: 7.5pt; line-height: 1.2; margin-top: 3px; font-family: Arial, sans-serif; color: #333;">${kontak}</div>
        </div>
      </div>
    `;
  }

  const judulLaporan = formatJudulLaporan(data.rencanaAksi);
  const signatureDate = extractFormalDateForSignature(data.waktuPelaksanaan, data.tanggalPembuatan);

  const signatureImgHtml = data.signatureData
    ? `<img src="${data.signatureData}" alt="Tanda Tangan" style="max-height: 55px; max-width: 150px; object-fit: contain;" />`
    : `<div style="height: 44px;"></div>`;

  // 2. Build Atomic Content Items
  const flowItems: FlowItem[] = [];

  // Item 0: Header & Title (Mandatory on Page 1)
  flowItems.push({
    id: "header-title",
    html: `
      <div style="margin-bottom: 12px;">
        ${kopHtml}
        <div style="text-align: center; margin-bottom: 14px;">
          <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">LAPORAN</div>
          <div style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase; margin: 2px 0; color: #000;">TENTANG</div>
          <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; line-height: 1.3;">${judulLaporan}</div>
          ${(!data.kopTipe || data.kopTipe === "none") ? '<div style="width: 100%; border-bottom: 1.5px solid #000; margin-top: 8px; margin-bottom: 12px;"></div>' : ''}
        </div>
      </div>
    `,
    isHeading: false,
    isMandatoryPage1: true,
  });

  // Helper to split text into distinct paragraph flow items
  const addParagraphs = (rawText: string, indent = true) => {
    if (!rawText || !rawText.trim()) return;
    const paras = rawText.split(/\n+/).map(p => p.trim()).filter(Boolean);
    paras.forEach((p) => {
      flowItems.push({
        id: `p-${Math.random().toString(36).substring(2, 8)}`,
        html: `
          <div style="padding-left: 14px; margin-bottom: 7px;">
            <p style="margin: 0; line-height: 1.5; text-align: justify; text-justify: inter-word; font-size: 10.5pt; color: #000; ${indent ? 'text-indent: 26px;' : ''}">
              ${p}
            </p>
          </div>
        `,
        isHeading: false,
      });
    });
  };

  // Section A
  flowItems.push({
    id: "heading-A",
    html: `<div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-top: 6px; margin-bottom: 3px;">A. PENDAHULUAN</div>`,
    isHeading: true,
    isMandatoryPage1: true,
  });

  flowItems.push({
    id: "heading-A1",
    html: `<div style="font-weight: bold; margin-top: 4px; margin-bottom: 3px; padding-left: 14px; font-size: 10.5pt; color: #000;">1. Umum</div>`,
    isHeading: true,
    isMandatoryPage1: true,
  });
  addParagraphs(data.pendahuluan.umum);

  flowItems.push({
    id: "heading-A2",
    html: `<div style="font-weight: bold; margin-top: 6px; margin-bottom: 3px; padding-left: 14px; font-size: 10.5pt; color: #000;">2. Maksud dan Tujuan</div>`,
    isHeading: true,
  });
  addParagraphs(data.pendahuluan.maksudDanTujuan);

  flowItems.push({
    id: "heading-A3",
    html: `<div style="font-weight: bold; margin-top: 6px; margin-bottom: 3px; padding-left: 14px; font-size: 10.5pt; color: #000;">3. Ruang Lingkup</div>`,
    isHeading: true,
  });
  addParagraphs(data.pendahuluan.ruangLingkup);

  flowItems.push({
    id: "heading-A4",
    html: `<div style="font-weight: bold; margin-top: 6px; margin-bottom: 3px; padding-left: 14px; font-size: 10.5pt; color: #000;">4. Dasar</div>`,
    isHeading: true,
  });
  addParagraphs(data.pendahuluan.dasar, false);

  // Section B
  flowItems.push({
    id: "heading-B",
    html: `<div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-top: 10px; margin-bottom: 4px;">B. KEGIATAN YANG DILAKSANAKAN</div>`,
    isHeading: true,
  });
  addParagraphs(data.kegiatanLaksana);

  // Section C
  flowItems.push({
    id: "heading-C",
    html: `<div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-top: 10px; margin-bottom: 4px;">C. HASIL YANG DICAPAI</div>`,
    isHeading: true,
  });
  addParagraphs(data.hasilDicapai);

  // Section D
  flowItems.push({
    id: "heading-D",
    html: `<div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-top: 10px; margin-bottom: 4px;">D. SIMPULAN DAN SARAN</div>`,
    isHeading: true,
  });

  flowItems.push({
    id: "heading-D1",
    html: `<div style="font-weight: bold; margin-top: 4px; margin-bottom: 3px; padding-left: 14px; font-size: 10.5pt; color: #000;">1. Kesimpulan</div>`,
    isHeading: true,
  });
  addParagraphs(data.simpulanDanSaran.kesimpulan);

  flowItems.push({
    id: "heading-D2",
    html: `<div style="font-weight: bold; margin-top: 6px; margin-bottom: 3px; padding-left: 14px; font-size: 10.5pt; color: #000;">2. Saran</div>`,
    isHeading: true,
  });
  addParagraphs(data.simpulanDanSaran.saran);

  // Section E
  flowItems.push({
    id: "heading-E",
    html: `<div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-top: 10px; margin-bottom: 4px;">E. PENUTUP</div>`,
    isHeading: true,
  });
  addParagraphs(data.penutup);

  // Signature Block
  const signatureBlockHtml = `
    <div style="margin-top: 18px; width: 100%;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 48%;"></td>
          <td style="width: 52%; text-align: left; vertical-align: top;">
            <div style="font-size: 10.5pt; color: #000;">${data.tempatPembuatan || "Jakarta"}, ${signatureDate}</div>
            <div style="font-weight: bold; text-transform: uppercase; font-size: 9.5pt; margin-top: 2px; letter-spacing: 0.5px; color: #000;">${data.jabatan || "Pelapor"}</div>
            <div style="height: 58px; display: flex; align-items: center; justify-content: flex-start; margin: 2px 0;">
              ${signatureImgHtml}
            </div>
            <div style="width: 190px; border-bottom: 1.5px solid #000; margin-bottom: 3px;"></div>
            <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase; color: #000; font-size: 10.5pt;">${data.nama || "-"}</div>
            <div style="color: #334155; font-size: 9.5pt;">NIP. ${data.nip || "-"}</div>
          </td>
        </tr>
      </table>
    </div>
  `;

  flowItems.push({
    id: "signature-block",
    html: signatureBlockHtml,
    isHeading: false,
  });

  // 3. Staging and Measurement Setup
  // A4: 794px width x 1123px height
  // Margins: Top 95px (2.5cm), Bottom 95px (2.5cm), Left 95px (2.5cm), Right 76px (2.0cm)
  // Usable Content Width = 794 - 95 - 76 = 623px
  // Content Max Usable Height = 1123 - 95 - 95 = 933px. We use 880px to guarantee safe breathing room from footer.
  const MAX_CONTENT_HEIGHT = 880;

  // Staging container: Placed at document (0, 0) with absolute positioning and negative z-index
  // This guarantees html2canvas at (x: 0, y: 0, scrollX: 0, scrollY: 0) captures the exact element regardless of scroll position!
  const stagingContainer = document.createElement("div");
  stagingContainer.style.position = "absolute";
  stagingContainer.style.left = "0px";
  stagingContainer.style.top = "0px";
  stagingContainer.style.width = "794px";
  stagingContainer.style.zIndex = "-99999";
  stagingContainer.style.backgroundColor = "#ffffff";
  stagingContainer.style.pointerEvents = "none";
  stagingContainer.style.overflow = "hidden";
  document.body.appendChild(stagingContainer);

  const measureBox = document.createElement("div");
  measureBox.style.width = "623px";
  measureBox.style.boxSizing = "border-box";
  measureBox.style.fontFamily = "'Times New Roman', Times, Georgia, serif";
  measureBox.style.fontSize = "10.5pt";
  measureBox.style.lineHeight = "1.5";
  measureBox.style.color = "#000000";
  stagingContainer.appendChild(measureBox);

  // Group items into discrete pages
  const contentPages: string[][] = [];
  let currentPageItems: string[] = [];
  measureBox.innerHTML = "";

  for (let i = 0; i < flowItems.length; i++) {
    const item = flowItems[i];

    // If it's mandatory for Page 1, place it directly on Page 1
    if (contentPages.length === 0 && item.isMandatoryPage1) {
      currentPageItems.push(item.html);
      measureBox.innerHTML = currentPageItems.join("");
      continue;
    }

    // Try appending to current page
    const testHtml = [...currentPageItems, item.html].join("");
    measureBox.innerHTML = testHtml;
    const measuredHeight = measureBox.offsetHeight;

    if (measuredHeight <= MAX_CONTENT_HEIGHT || currentPageItems.length === 0) {
      currentPageItems.push(item.html);
    } else {
      // It exceeds MAX_CONTENT_HEIGHT.
      // If the current page ends with a standalone heading, move that heading to the new page.
      const rescuedHeadings: string[] = [];
      if (currentPageItems.length > 0 && contentPages.length > 0) {
        const lastItemHtml = currentPageItems[currentPageItems.length - 1];
        if (lastItemHtml.includes("font-weight: bold") || lastItemHtml.includes("uppercase")) {
          rescuedHeadings.unshift(currentPageItems.pop()!);
        }
      }

      contentPages.push([...currentPageItems]);

      // Start new page
      currentPageItems = [...rescuedHeadings, item.html];
      measureBox.innerHTML = currentPageItems.join("");
    }
  }

  if (currentPageItems.length > 0) {
    contentPages.push([...currentPageItems]);
  }

  // Safety fallback: Ensure contentPages has at least 1 page
  if (contentPages.length === 0) {
    contentPages.push([flowItems.map(item => item.html).join("")]);
  }

  // 4. Photo Attachments Pages (Max 2 photos per dedicated A4 page)
  const photoPages: string[] = [];
  if (photos && photos.length > 0) {
    const photosPerPage = 2;
    for (let pIdx = 0; pIdx < photos.length; pIdx += photosPerPage) {
      const batch = photos.slice(pIdx, pIdx + photosPerPage);
      const isFirstPhotoPage = pIdx === 0;

      const photoCardsHtml = batch.map((p, idx) => `
        <div style="text-align: center; margin-bottom: 22px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #f8fafc;">
          <img src="${p.base64Data}" alt="${p.caption || p.fileName}" style="max-height: 275px; max-width: 95%; object-fit: contain; border-radius: 4px; background: #ffffff; display: inline-block;" />
          <div style="margin-top: 10px; font-size: 9.5pt; font-style: italic; font-family: Arial, sans-serif; color: #1e293b;">
            <strong>Foto ${pIdx + idx + 1}:</strong> ${p.caption || p.fileName}
          </div>
        </div>
      `).join("");

      const photoPageHtml = `
        <div style="width: 100%;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">
              ${isFirstPhotoPage ? "LAMPIRAN: DOKUMENTASI FOTO KEGIATAN" : "LAMPIRAN: DOKUMENTASI FOTO KEGIATAN (LANJUTAN)"}
            </div>
            <div style="width: 100px; border-bottom: 1.5px solid #000; margin: 6px auto 14px auto;"></div>
          </div>
          <div>
            ${photoCardsHtml}
          </div>
        </div>
      `;

      photoPages.push(photoPageHtml);
    }
  }

  const totalPages = contentPages.length + photoPages.length;

  // 5. Initialize jsPDF
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // Helper to construct exact isolated A4 page sheet
  const buildPageSheetHtml = (innerHtml: string, pageNum: number): string => {
    return `
      <div class="pdf-page-sheet" style="width: 794px; height: 1123px; min-height: 1123px; max-height: 1123px; box-sizing: border-box; background-color: #ffffff; color: #000000; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 10.5pt; line-height: 1.5; padding: 95px 76px 95px 95px; position: relative; overflow: hidden;">
        <div style="width: 623px; box-sizing: border-box;">
          ${innerHtml}
        </div>
        <!-- Standard Government Footer -->
        <div style="position: absolute; bottom: 30px; left: 95px; right: 76px; display: flex; justify-content: space-between; align-items: center; border-top: 0.5px solid #94a3b8; padding-top: 5px; font-family: Arial, sans-serif; font-size: 8pt; color: #475569;">
          <span>Laporan Realisasi Rencana Hasil Kerja (RHK)</span>
          <span>Halaman ${pageNum} dari ${totalPages}</span>
        </div>
      </div>
    `;
  };

  // Helper to ensure all images inside an element are fully loaded
  const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = Array.from(element.querySelectorAll("img"));
    if (images.length === 0) return;
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
              resolve();
            } else {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
              setTimeout(resolve, 800);
            }
          })
      )
    );
  };

  // Check if a canvas has actual drawn content (not blank white/transparent)
  const isCanvasBlank = (c: HTMLCanvasElement): boolean => {
    const ctx = c.getContext("2d");
    if (!ctx) return true;
    const samplePoints = [
      [150, 150], [200, 200], [250, 250], [300, 300], [200, 350], [350, 450], [250, 600]
    ];
    let hasDrawnPixels = false;
    for (const [x, y] of samplePoints) {
      const p = ctx.getImageData(x, y, 1, 1).data;
      if (p[3] > 0 && !(p[0] === 255 && p[1] === 255 && p[2] === 255)) {
        hasDrawnPixels = true;
        break;
      }
    }
    return !hasDrawnPixels;
  };

  let atLeastOnePageRendered = false;

  try {
    // Render text content pages
    for (let p = 0; p < contentPages.length; p++) {
      const pageInnerHtml = contentPages[p].join("");
      const sheetHtml = buildPageSheetHtml(pageInnerHtml, p + 1);

      stagingContainer.innerHTML = sheetHtml;
      const sheetElem = stagingContainer.firstElementChild as HTMLElement;

      await waitForImages(sheetElem);

      const canvas = await html2canvas(sheetElem, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: 1123,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
      });

      if (!isCanvasBlank(canvas)) {
        atLeastOnePageRendered = true;
      }

      const imgData = canvas.toDataURL("image/jpeg", 0.96);
      if (p > 0) {
        pdf.addPage("a4", "portrait");
      }
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    // Render photo attachment pages
    for (let q = 0; q < photoPages.length; q++) {
      const globalPageNum = contentPages.length + q + 1;
      const sheetHtml = buildPageSheetHtml(photoPages[q], globalPageNum);

      stagingContainer.innerHTML = sheetHtml;
      const sheetElem = stagingContainer.firstElementChild as HTMLElement;

      await waitForImages(sheetElem);

      const canvas = await html2canvas(sheetElem, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: 1123,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.96);
      pdf.addPage("a4", "portrait");
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    // If html2canvas produced content successfully, save PDF
    if (atLeastOnePageRendered) {
      pdf.save(fileName);
    } else {
      // Safe fallback: trigger print dialog if canvas was blank
      console.warn("Direct PDF canvas was blank, falling back to print preview dialog.");
      printReportDocument(data, photos);
    }
  } catch (err) {
    console.error("PDF generation encountered an error:", err);
    printReportDocument(data, photos);
  } finally {
    if (document.body.contains(stagingContainer)) {
      document.body.removeChild(stagingContainer);
    }
  }
}
