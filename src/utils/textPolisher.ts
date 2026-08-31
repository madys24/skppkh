/**
 * Smart Indonesian Bureaucratic Text Polisher (PUEBI & Tata Naskah Dinas ASN).
 * Used as an ultra-resilient offline fallback when API is unreachable or deployed statically.
 */
export function polishTextOffline(
  currentText: string,
  sectionTitle: string,
  instruction?: string,
  jabatan?: string,
  rhkUtama?: string
): string {
  if (!currentText || !currentText.trim()) return currentText;

  let text = currentText.trim();

  // 1. Vocabulary formalization dictionary for Indonesian Civil Service
  const formalReplacements: Array<[RegExp, string]> = [
    [/\bbikin\b/gi, "menyusun"],
    [/\bngasih\b/gi, "memberikan"],
    [/\bpakai\b/gi, "menggunakan"],
    [/\bpake\b/gi, "menggunakan"],
    [/\bcuma\b/gi, "hanya"],
    [/\bbanget\b/gi, "sangat"],
    [/\bnggak\b/gi, "tidak"],
    [/\bgak\b/gi, "tidak"],
    [/\btapi\b/gi, "namun"],
    [/\budah\b/gi, "telah"],
    [/\bsudah\b/gi, "telah"],
    [/\bngerjain\b/gi, "melaksanakan"],
    [/\bngerjakan\b/gi, "melaksanakan"],
    [/\bngurus\b/gi, "mengelola"],
    [/\bngurusin\b/gi, "mengkoordinasikan"],
    [/\bketemu\b/gi, "melakukan koordinasi dengan"],
    [/\bcek\b/gi, "melakukan verifikasi"],
    [/\bngecek\b/gi, "memverifikasi dan memvalidasi"],
    [/\bngeliat\b/gi, "memantau"],
    [/\bliat\b/gi, "meninjau"],
    [/\blaporan\s+oke\b/gi, "laporan telah diselesaikan secara akuntabel"],
    [/\bhasilnya\s+bagus\b/gi, "capaian kinerja memenuhi indikator keberhasilan yang ditetapkan"],
    [/\blancar\b/gi, "terlaksana secara tertib, lancar, dan kondusif"],
    [/\bselesai\b/gi, "telah dituntaskan secara optimal"],
  ];

  for (const [pattern, replacement] of formalReplacements) {
    text = text.replace(pattern, replacement);
  }

  // 2. Ensure formal punctuation and spacing
  text = text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.:;?!])/g, "$1")
    .replace(/([,.:;?!])(?=[^\s\d])/g, "$1 ")
    .replace(/\.\s*\./g, ".")
    .trim();

  // 3. Capitalize first letter of sentences
  text = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

  // 4. If specific user instruction was provided, enrich closing or context
  if (instruction && instruction.trim()) {
    const cleanInst = instruction.trim().toLowerCase();
    if (cleanInst.includes("formal") || cleanInst.includes("baku") || cleanInst.includes("resmi")) {
      if (!text.includes("prinsip akuntabilitas") && !text.includes("BerAKHLAK")) {
        text += `\n\nSeluruh rangkaian pelaksanaan tugas diselaraskan dengan tata kelola birokrasi yang transparan, akuntabel, dan berorientasi pada pelayanan prima sesuai core values ASN BerAKHLAK.`;
      }
    } else if (cleanInst.includes("hasil") || cleanInst.includes("capaian") || cleanInst.includes("dampak")) {
      if (!text.includes("output")) {
        text += `\n\nCapaian kegiatan ini memberikan kontribusi nyata terhadap kelancaran operasional unit kerja dan terwujudnya tertib administrasi pelaporan.`;
      }
    } else if (cleanInst.includes("singkat") || cleanInst.includes("padat") || cleanInst.includes("ringkas")) {
      // already tightened
    } else {
      text += `\n\n(Catatan Tindak Lanjut: ${instruction.trim()})`;
    }
  }

  return text;
}
