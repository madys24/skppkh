/**
 * Smart Indonesian Field Officer Text Polisher & Narrative Expander.
 * Used as an ultra-resilient offline fallback when API is unreachable or deployed statically.
 * Formats content into fluid, natural field officer narrative paragraphs without rigid bullet points.
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

  // 1. Natural field officer vocabulary polish (refined yet communicative and not overly stiff)
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
    [/\bketemu\b/gi, "berkoordinasi dan berdialog dengan"],
    [/\bcek\b/gi, "melakukan pengecekan"],
    [/\bngecek\b/gi, "memeriksa dan memverifikasi"],
    [/\bngeliat\b/gi, "mengamati langsung"],
    [/\bliat\b/gi, "meninjau"],
    [/\blaporan\s+oke\b/gi, "laporan dan administrasi telah tersusun secara rapi"],
    [/\bhasilnya\s+bagus\b/gi, "kegiatan berjalan dengan baik dan mencapai target"],
    [/\blancar\b/gi, "terlaksana secara tertib, lancar, dan aman"],
    [/\bselesai\b/gi, "telah dituntaskan dengan baik"],
  ];

  for (const [pattern, replacement] of formalReplacements) {
    text = text.replace(pattern, replacement);
  }

  // 2. Remove rigid bullet points / numbering markers and turn them into flowing narrative sentences
  text = text
    .split("\n")
    .map((line) => {
      let l = line.trim();
      // Remove leading bullets or numbers like "1.", "a.", "-", "*", "•", "1)", "a)"
      l = l.replace(/^(\d+[\.\)]|[a-zA-Z][\.\)]|[-*•–—])\s+/, "");
      return l;
    })
    .filter((line) => line.length > 0)
    .join("\n\n");

  // 3. Ensure clean punctuation and spacing
  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.:;?!])/g, "$1")
    .replace(/([,.:;?!])(?=[^\s\d])/g, "$1 ")
    .replace(/\.\s*\./g, ".")
    .trim();

  // 4. Capitalize first letter of sentences
  text = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

  // 5. If specific user instruction was provided, enrich or adapt
  if (instruction && instruction.trim()) {
    const cleanInst = instruction.trim().toLowerCase();
    if (cleanInst.includes("lapangan") || cleanInst.includes("petugas") || cleanInst.includes("perluas")) {
      if (!text.includes("langsung di lokasi")) {
        text += `\n\nSeluruh rangkaian kegiatan terlaksana melalui interaksi langsung di lokasi penugasan dengan tetap mengedepankan pendekatan komunikatif dan keterbukaan bersama warga serta pihak terkait.`;
      }
    } else if (cleanInst.includes("hasil") || cleanInst.includes("capaian")) {
      if (!text.includes("capaian")) {
        text += `\n\nCapaian positif ini memberikan manfaat nyata bagi masyarakat dan mendukung kelancaran operasional pelayanan di unit kerja.`;
      }
    }
  }

  return text;
}

