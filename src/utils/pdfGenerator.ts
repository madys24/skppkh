import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ReportData, PhotoAttachment } from "../types";
import { getReportFileName, formatJudulLaporan, extractFormalDateForSignature } from "./dateFormatter";

/**
 * Generate and directly download a crisp, multi-page A4 PDF file
 * without requiring the user to navigate the browser/OS print dialogue.
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
      ? `<img src="/logo-kemensos.svg" alt="Logo Kemensos" style="width: 75px; height: 75px; object-fit: contain; display: block;" />`
      : `<svg style="width: 70px; height: 70px;" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 L20 30 L20 60 C 20 80, 50 90, 50 90 C 50 90, 80 80, 80 60 L80 30 Z" fill="#1e293b" />
          <path d="M50 20 L25 33 L25 58 C 25 75, 50 84, 50 84 C 50 84, 75 75, 75 58 L75 33 Z" fill="#f8fafc" />
          <polygon points="50,30 55,42 68,42 58,50 62,62 50,54 38,62 42,50 32,42 45,42" fill="#ca8a04" />
        </svg>`;

    kopHtml = `
      <div style="display: flex; align-items: center; justify-content: center; padding-bottom: 10px; border-bottom: 3.5px double #000; margin-bottom: 16px;">
        <div style="flex-shrink: 0; margin-right: 14px;">
          ${logoHtml}
        </div>
        <div style="flex-grow: 1; text-align: center; color: #000;">
          <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; line-height: 1.2;">${kementerian}</div>
          ${eselon1 ? `<div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; margin-top: 2px;">${eselon1}</div>` : ""}
          ${eselon2 ? `<div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; margin-top: 2px;">${eselon2}</div>` : ""}
          <div style="font-size: 7.5pt; line-height: 1.25; margin-top: 4px; font-family: Arial, sans-serif; color: #333;">${kontak}</div>
        </div>
      </div>
    `;
  }

  // Build Photo Attachments HTML
  let photosHtml = "";
  if (photos && photos.length > 0) {
    const photosItems = photos.map((p, idx) => `
      <div style="text-align: center; margin-bottom: 20px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #f8fafc; break-inside: avoid;">
        <img src="${p.base64Data}" alt="${p.caption || p.fileName}" style="max-height: 280px; max-width: 95%; object-fit: contain; border-radius: 4px; background: #fff;" />
        <div style="margin-top: 8px; font-size: 9pt; font-style: italic; font-family: Arial, sans-serif; color: #334155;">
          <strong>Foto ${idx + 1}:</strong> ${p.caption || p.fileName}
        </div>
      </div>
    `).join("");

    photosHtml = `
      <div style="margin-top: 28px; padding-top: 14px; border-top: 1px dashed #cbd5e1;">
        <div style="text-align: center; margin-bottom: 18px;">
          <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">LAMPIRAN: DOKUMENTASI FOTO KEGIATAN</div>
          <div style="width: 100px; border-bottom: 1.5px solid #000; margin: 6px auto 14px auto;"></div>
        </div>
        <div>
          ${photosItems}
        </div>
      </div>
    `;
  }

  const signatureImgHtml = data.signatureData
    ? `<img src="${data.signatureData}" alt="Tanda Tangan" style="max-height: 60px; max-width: 160px; object-fit: contain;" />`
    : `<div style="height: 45px;"></div>`;

  const judulLaporan = formatJudulLaporan(data.rencanaAksi);

  // Create temporary off-screen container for rendering
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "750px"; // Fixed standard width for clean A4 conversion
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#000000";
  container.style.fontFamily = "'Times New Roman', Times, Georgia, serif";
  container.style.fontSize = "10.5pt";
  container.style.lineHeight = "1.5";
  container.style.padding = "30px 40px";
  container.style.boxSizing = "border-box";

  container.innerHTML = `
    <div>
      ${kopHtml}

      <!-- Header Judul Laporan -->
      <div style="text-align: center; margin-bottom: 18px;">
        <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">LAPORAN</div>
        <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 2px 0; color: #000;">TENTANG</div>
        <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; line-height: 1.3;">${judulLaporan}</div>
        ${(!data.kopTipe || data.kopTipe === "none") ? '<div style="width: 100%; border-bottom: 1.5px solid #000; margin-top: 8px; margin-bottom: 14px;"></div>' : ''}
      </div>

      <!-- A. PENDAHULUAN -->
      <div style="margin-top: 10px;">
        <div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px;">A. PENDAHULUAN</div>
        <div style="padding-left: 14px; text-align: justify;">
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; margin-bottom: 2px;">1. Umum</div>
            <p style="white-space: pre-line; margin: 0; color: #111;">${data.pendahuluan.umum || "-"}</p>
          </div>
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; margin-bottom: 2px;">2. Maksud dan Tujuan</div>
            <p style="white-space: pre-line; margin: 0; color: #111;">${data.pendahuluan.maksudDanTujuan || "-"}</p>
          </div>
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; margin-bottom: 2px;">3. Ruang Lingkup</div>
            <p style="white-space: pre-line; margin: 0; color: #111;">${data.pendahuluan.ruangLingkup || "-"}</p>
          </div>
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; margin-bottom: 2px;">4. Dasar</div>
            <p style="white-space: pre-line; margin: 0; color: #111;">${data.pendahuluan.dasar || "-"}</p>
          </div>
        </div>
      </div>

      <!-- B. KEGIATAN YANG DILAKSANAKAN -->
      <div style="margin-top: 12px;">
        <div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px;">B. KEGIATAN YANG DILAKSANAKAN</div>
        <div style="padding-left: 14px; text-align: justify;">
          <p style="white-space: pre-line; margin: 0; color: #111;">${data.kegiatanLaksana || "-"}</p>
        </div>
      </div>

      <!-- C. HASIL YANG DICAPAI -->
      <div style="margin-top: 12px;">
        <div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px;">C. HASIL YANG DICAPAI</div>
        <div style="padding-left: 14px; text-align: justify;">
          <p style="white-space: pre-line; margin: 0; color: #111;">${data.hasilDicapai || "-"}</p>
        </div>
      </div>

      <!-- D. SIMPULAN DAN SARAN -->
      <div style="margin-top: 12px;">
        <div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px;">D. SIMPULAN DAN SARAN</div>
        <div style="padding-left: 14px; text-align: justify;">
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; margin-bottom: 2px;">1. Kesimpulan</div>
            <p style="white-space: pre-line; margin: 0; color: #111;">${data.simpulanDanSaran.kesimpulan || "-"}</p>
          </div>
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; margin-bottom: 2px;">2. Saran</div>
            <p style="white-space: pre-line; margin: 0; color: #111;">${data.simpulanDanSaran.saran || "-"}</p>
          </div>
        </div>
      </div>

      <!-- E. PENUTUP -->
      <div style="margin-top: 12px;">
        <div style="font-size: 11pt; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px;">E. PENUTUP</div>
        <div style="padding-left: 14px; text-align: justify;">
          <p style="white-space: pre-line; margin: 0; color: #111;">${data.penutup || "-"}</p>
        </div>
      </div>

      <!-- Tanda Tangan -->
      <div style="margin-top: 24px; width: 100%;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; text-align: left; vertical-align: top;">
              <div>${data.tempatPembuatan || "Jakarta"}, ${extractFormalDateForSignature(data.waktuPelaksanaan, data.tanggalPembuatan)}</div>
              <div style="font-weight: bold; text-transform: uppercase; font-size: 9.5pt; margin-top: 2px; letter-spacing: 0.5px;">${data.jabatan || "Pelapor"}</div>
              <div style="height: 65px; display: flex; align-items: center; justify-content: flex-start; margin: 4px 0;">
                ${signatureImgHtml}
              </div>
              <div style="width: 190px; border-bottom: 1px solid #475569; margin-bottom: 4px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase; color: #000;">${data.nama || "-"}</div>
              <div style="color: #4b5563; font-size: 9.5pt;">NIP. ${data.nip || "-"}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Lampiran Foto -->
      ${photosHtml}
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF("p", "mm", "a4");
    let position = 0;

    // First page
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    // Subsequent pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}
