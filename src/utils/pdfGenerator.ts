import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ReportData, PhotoAttachment } from "../types";
import { getReportFileName, formatJudulLaporan, extractFormalDateForSignature } from "./dateFormatter";

/**
 * Generate and directly download a clean, multi-page A4 PDF file
 * where page breaks occur cleanly between blocks/paragraphs,
 * never slicing across a line of text.
 */
export async function downloadDirectPdf(data: ReportData, photos: PhotoAttachment[] = []): Promise<void> {
  const fileName = `${getReportFileName(data)}.pdf`;

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
      ? `<img src="/logo-kemensos.svg" alt="Logo Kemensos" style="width: 72px; height: 72px; object-fit: contain; display: block;" />`
      : `<svg style="width: 68px; height: 68px;" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 L20 30 L20 60 C 20 80, 50 90, 50 90 C 50 90, 80 80, 80 60 L80 30 Z" fill="#1e293b" />
          <path d="M50 20 L25 33 L25 58 C 25 75, 50 84, 50 84 C 50 84, 75 75, 75 58 L75 33 Z" fill="#f8fafc" />
          <polygon points="50,30 55,42 68,42 58,50 62,62 50,54 38,62 42,50 32,42 45,42" fill="#ca8a04" />
        </svg>`;

    kopHtml = `
      <div style="display: flex; align-items: center; justify-content: center; padding-bottom: 8px; border-bottom: 3.5px double #000; margin-bottom: 14px;">
        <div style="flex-shrink: 0; margin-right: 14px;">
          ${logoHtml}
        </div>
        <div style="flex-grow: 1; text-align: center; color: #000;">
          <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; line-height: 1.2;">${kementerian}</div>
          ${eselon1 ? `<div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; margin-top: 2px;">${eselon1}</div>` : ""}
          ${eselon2 ? `<div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; margin-top: 2px;">${eselon2}</div>` : ""}
          <div style="font-size: 7.5pt; line-height: 1.25; margin-top: 3px; font-family: Arial, sans-serif; color: #333;">${kontak}</div>
        </div>
      </div>
    `;
  }

  const judulLaporan = formatJudulLaporan(data.rencanaAksi);
  const signatureDate = extractFormalDateForSignature(data.waktuPelaksanaan, data.tanggalPembuatan);

  const signatureImgHtml = data.signatureData
    ? `<img src="${data.signatureData}" alt="Tanda Tangan" style="max-height: 55px; max-width: 150px; object-fit: contain;" />`
    : `<div style="height: 40px;"></div>`;

  // Define atomic structural HTML blocks for dynamic page layout
  const blocks: string[] = [];

  // Block 0: Kop Surat + Title
  blocks.push(`
    <div style="margin-bottom: 12px;">
      ${kopHtml}
      <div style="text-align: center; margin-bottom: 14px;">
        <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">LAPORAN</div>
        <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 2px 0; color: #000;">TENTANG</div>
        <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; line-height: 1.3;">${judulLaporan}</div>
        ${(!data.kopTipe || data.kopTipe === "none") ? '<div style="width: 100%; border-bottom: 1.5px solid #000; margin-top: 8px; margin-bottom: 12px;"></div>' : ''}
      </div>
    </div>
  `);

  // Block 1: A. PENDAHULUAN Header + 1. Umum
  blocks.push(`
    <div style="margin-bottom: 10px;">
      <div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px;">A. PENDAHULUAN</div>
      <div style="padding-left: 14px; text-align: justify;">
        <div style="font-weight: bold; margin-bottom: 2px;">1. Umum</div>
        <p style="white-space: pre-line; margin: 0; color: #111;">${data.pendahuluan.umum || "-"}</p>
      </div>
    </div>
  `);

  // Block 2: 2. Maksud dan Tujuan
  blocks.push(`
    <div style="margin-bottom: 10px; padding-left: 14px; text-align: justify;">
      <div style="font-weight: bold; margin-bottom: 2px;">2. Maksud dan Tujuan</div>
      <p style="white-space: pre-line; margin: 0; color: #111;">${data.pendahuluan.maksudDanTujuan || "-"}</p>
    </div>
  `);

  // Block 3: 3. Ruang Lingkup
  blocks.push(`
    <div style="margin-bottom: 10px; padding-left: 14px; text-align: justify;">
      <div style="font-weight: bold; margin-bottom: 2px;">3. Ruang Lingkup</div>
      <p style="white-space: pre-line; margin: 0; color: #111;">${data.pendahuluan.ruangLingkup || "-"}</p>
    </div>
  `);

  // Block 4: 4. Dasar
  blocks.push(`
    <div style="margin-bottom: 12px; padding-left: 14px; text-align: justify;">
      <div style="font-weight: bold; margin-bottom: 2px;">4. Dasar</div>
      <p style="white-space: pre-line; margin: 0; color: #111;">${data.pendahuluan.dasar || "-"}</p>
    </div>
  `);

  // Block 5: B. KEGIATAN YANG DILAKSANAKAN
  blocks.push(`
    <div style="margin-bottom: 12px;">
      <div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px;">B. KEGIATAN YANG DILAKSANAKAN</div>
      <div style="padding-left: 14px; text-align: justify;">
        <p style="white-space: pre-line; margin: 0; color: #111;">${data.kegiatanLaksana || "-"}</p>
      </div>
    </div>
  `);

  // Block 6: C. HASIL YANG DICAPAI
  blocks.push(`
    <div style="margin-bottom: 12px;">
      <div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px;">C. HASIL YANG DICAPAI</div>
      <div style="padding-left: 14px; text-align: justify;">
        <p style="white-space: pre-line; margin: 0; color: #111;">${data.hasilDicapai || "-"}</p>
      </div>
    </div>
  `);

  // Block 7: D. SIMPULAN DAN SARAN
  blocks.push(`
    <div style="margin-bottom: 12px;">
      <div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px;">D. SIMPULAN DAN SARAN</div>
      <div style="padding-left: 14px; text-align: justify;">
        <div style="margin-bottom: 6px;">
          <div style="font-weight: bold; margin-bottom: 2px;">1. Kesimpulan</div>
          <p style="white-space: pre-line; margin: 0; color: #111;">${data.simpulanDanSaran.kesimpulan || "-"}</p>
        </div>
        <div>
          <div style="font-weight: bold; margin-bottom: 2px;">2. Saran</div>
          <p style="white-space: pre-line; margin: 0; color: #111;">${data.simpulanDanSaran.saran || "-"}</p>
        </div>
      </div>
    </div>
  `);

  // Block 8: E. PENUTUP
  blocks.push(`
    <div style="margin-bottom: 14px;">
      <div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px;">E. PENUTUP</div>
      <div style="padding-left: 14px; text-align: justify;">
        <p style="white-space: pre-line; margin: 0; color: #111;">${data.penutup || "-"}</p>
      </div>
    </div>
  `);

  // Block 9: Tanda Tangan (Signature Block)
  const signatureBlockHtml = `
    <div style="margin-top: 14px; width: 100%;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 50%;"></td>
          <td style="width: 50%; text-align: left; vertical-align: top;">
            <div>${data.tempatPembuatan || "Jakarta"}, ${signatureDate}</div>
            <div style="font-weight: bold; text-transform: uppercase; font-size: 9.5pt; margin-top: 2px; letter-spacing: 0.5px;">${data.jabatan || "Pelapor"}</div>
            <div style="height: 58px; display: flex; align-items: center; justify-content: flex-start; margin: 2px 0;">
              ${signatureImgHtml}
            </div>
            <div style="width: 190px; border-bottom: 1px solid #475569; margin-bottom: 4px;"></div>
            <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase; color: #000;">${data.nama || "-"}</div>
            <div style="color: #4b5563; font-size: 9.5pt;">NIP. ${data.nip || "-"}</div>
          </td>
        </tr>
      </table>
    </div>
  `;

  // Off-screen master container
  const masterContainer = document.createElement("div");
  masterContainer.style.position = "absolute";
  masterContainer.style.left = "-9999px";
  masterContainer.style.top = "0";
  masterContainer.style.width = "794px"; // Exact 210mm at 96 DPI
  masterContainer.style.backgroundColor = "#ffffff";
  document.body.appendChild(masterContainer);

  try {
    const pageElements: HTMLElement[] = [];
    const MAX_PAGE_CONTENT_HEIGHT = 1010; // 1123px total A4 height - 110px padding/footer margin

    const createNewPageElement = (): { page: HTMLElement; content: HTMLElement } => {
      const page = document.createElement("div");
      page.style.width = "794px";
      page.style.height = "1123px";
      page.style.maxHeight = "1123px";
      page.style.padding = "42px 48px 30px 48px";
      page.style.boxSizing = "border-box";
      page.style.backgroundColor = "#ffffff";
      page.style.color = "#000000";
      page.style.fontFamily = "'Times New Roman', Times, Georgia, serif";
      page.style.fontSize = "10.5pt";
      page.style.lineHeight = "1.45";
      page.style.overflow = "hidden";
      page.style.display = "flex";
      page.style.flexDirection = "column";
      page.style.justifyContent = "space-between";
      page.style.position = "relative";

      const content = document.createElement("div");
      content.style.flex = "1";
      content.style.overflow = "hidden";
      page.appendChild(content);

      masterContainer.appendChild(page);
      pageElements.push(page);
      return { page, content };
    };

    // Initialize first page
    let { page: currentPage, content: currentContent } = createNewPageElement();

    // Distribute report text blocks
    for (let i = 0; i < blocks.length; i++) {
      const blockHtml = blocks[i];
      const tempWrapper = document.createElement("div");
      tempWrapper.innerHTML = blockHtml;
      const elementToAdd = tempWrapper.firstElementChild as HTMLElement;

      if (!elementToAdd) continue;

      currentContent.appendChild(elementToAdd);

      // Check if current content overflows page budget
      if (currentContent.scrollHeight > MAX_PAGE_CONTENT_HEIGHT && currentContent.children.length > 1) {
        // Remove from current page and place on new page
        currentContent.removeChild(elementToAdd);
        const newPageRes = createNewPageElement();
        currentPage = newPageRes.page;
        currentContent = newPageRes.content;
        currentContent.appendChild(elementToAdd);
      }
    }

    // Append signature block
    const sigWrapper = document.createElement("div");
    sigWrapper.innerHTML = signatureBlockHtml;
    const sigElement = sigWrapper.firstElementChild as HTMLElement;
    if (sigElement) {
      currentContent.appendChild(sigElement);
      // If signature block causes overflow, move to new page
      if (currentContent.scrollHeight > MAX_PAGE_CONTENT_HEIGHT && currentContent.children.length > 1) {
        currentContent.removeChild(sigElement);
        const newPageRes = createNewPageElement();
        currentPage = newPageRes.page;
        currentContent = newPageRes.content;
        currentContent.appendChild(sigElement);
      }
    }

    // Append Photo Attachment pages if photos exist (up to 2 photos per page)
    if (photos && photos.length > 0) {
      const photosPerPage = 2;
      for (let pIdx = 0; pIdx < photos.length; pIdx += photosPerPage) {
        const { content: photoContent } = createNewPageElement();
        const batch = photos.slice(pIdx, pIdx + photosPerPage);
        const isFirstPhotoPage = pIdx === 0;

        const photoItemsHtml = batch.map((p, idx) => `
          <div style="text-align: center; margin-bottom: 16px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #f8fafc;">
            <img src="${p.base64Data}" alt="${p.caption || p.fileName}" style="max-height: 290px; max-width: 95%; object-fit: contain; border-radius: 4px; background: #fff;" />
            <div style="margin-top: 6px; font-size: 9pt; font-style: italic; font-family: Arial, sans-serif; color: #334155;">
              <strong>Foto ${pIdx + idx + 1}:</strong> ${p.caption || p.fileName}
            </div>
          </div>
        `).join("");

        const photoPageHtml = `
          <div>
            <div style="text-align: center; margin-bottom: 16px;">
              <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                ${isFirstPhotoPage ? "LAMPIRAN: DOKUMENTASI FOTO KEGIATAN" : "LAMPIRAN: DOKUMENTASI FOTO KEGIATAN (LANJUTAN)"}
              </div>
              <div style="width: 100px; border-bottom: 1.5px solid #000; margin: 6px auto 12px auto;"></div>
            </div>
            <div>
              ${photoItemsHtml}
            </div>
          </div>
        `;

        photoContent.innerHTML = photoPageHtml;
      }
    }

    // Add page numbers at the bottom of each page
    const totalPages = pageElements.length;
    pageElements.forEach((page, idx) => {
      const footer = document.createElement("div");
      footer.style.textAlign = "right";
      footer.style.fontSize = "8pt";
      footer.style.color = "#64748b";
      footer.style.fontFamily = "Arial, sans-serif";
      footer.style.paddingTop = "6px";
      footer.style.borderTop = "0.5px solid #e2e8f0";
      footer.innerText = `Halaman ${idx + 1} dari ${totalPages}`;
      page.appendChild(footer);
    });

    // Render each page into a crisp PDF page
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.96);
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    pdf.save(fileName);
  } finally {
    if (document.body.contains(masterContainer)) {
      document.body.removeChild(masterContainer);
    }
  }
}
