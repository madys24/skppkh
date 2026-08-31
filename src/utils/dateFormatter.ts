import { PKH_RHK_OPTIONS } from "../data/pkhOptions";

/**
 * Formats a single date or date range beautifully into standard Indonesian formal text.
 * E.g., "Senin, 15 Juni 2026" or "Senin s.d. Rabu, 15 - 17 Juni 2026"
 */
export function formatIndonesianDateRange(startDateStr: string, endDateStr?: string): string {
  if (!startDateStr) return "";
  
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return startDateStr;
  
  const startDayName = days[start.getDay()];
  const startDateNum = start.getDate();
  const startMonthName = months[start.getMonth()];
  const startYear = start.getFullYear();
  
  if (!endDateStr) {
    return `${startDayName}, ${startDateNum} ${startMonthName} ${startYear}`;
  }
  
  const end = new Date(endDateStr);
  if (isNaN(end.getTime()) || startDateStr === endDateStr) {
    return `${startDayName}, ${startDateNum} ${startMonthName} ${startYear}`;
  }
  
  const endDayName = days[end.getDay()];
  const endDateNum = end.getDate();
  const endMonthName = months[end.getMonth()];
  const endYear = end.getFullYear();
  
  // Case 1: Same month and year
  if (start.getMonth() === end.getMonth() && startYear === endYear) {
    return `${startDayName} s.d. ${endDayName}, ${startDateNum} - ${endDateNum} ${startMonthName} ${startYear}`;
  }
  
  // Case 2: Same year, different months
  if (startYear === endYear) {
    return `${startDayName} s.d. ${endDayName}, ${startDateNum} ${startMonthName} - ${endDateNum} ${endMonthName} ${startYear}`;
  }
  
  // Case 3: Different year
  return `${startDayName}, ${startDateNum} ${startMonthName} ${startYear} s.d. ${endDayName}, ${endDateNum} ${endMonthName} ${endYear}`;
}

/**
 * Resolves the formal date for the signature line from the activity date (waktuPelaksanaan).
 * E.g., if waktuPelaksanaan is "Senin, 15 Juni 2026", it returns "15 Juni 2026".
 * If waktuPelaksanaan is "Senin s.d. Jumat, 08 - 12 Juni 2026", it returns "12 Juni 2026".
 */
export function extractFormalDateForSignature(waktuPelaksanaan?: string, fallbackDate?: string): string {
  const text = (waktuPelaksanaan || fallbackDate || "").trim();
  
  if (!text) {
    const today = new Date();
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  }

  // If text is in range format like "Senin s.d. Jumat, 08 - 12 Juni 2026" or "15 - 17 Juni 2026"
  // Extract the end date: e.g. "12 Juni 2026" or "17 Juni 2026"
  const rangeMatch = text.match(/(?:-|s\.d\.|sampai)\s*(?:[a-zA-Z]+,)?\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
  if (rangeMatch) {
    const d = parseInt(rangeMatch[1], 10);
    const m = rangeMatch[2];
    const y = rangeMatch[3];
    return `${d} ${m} ${y}`;
  }

  // Single date format: e.g. "Senin, 15 Juni 2026" or "15 Juni 2026"
  const singleDateMatch = text.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
  if (singleDateMatch) {
    const d = parseInt(singleDateMatch[1], 10);
    const m = singleDateMatch[2];
    const y = singleDateMatch[3];
    return `${d} ${m} ${y}`;
  }

  // If already clean text without day name
  const stripped = text.replace(/^[a-zA-Z\s]+,\s*/, "").trim();
  return stripped || text;
}

/**
 * Extracts ddmmyyyy format string from Indonesian dates or standard ISO dates
 */
export function formatFilenameDate(tanggalPembuatan?: string, waktuPelaksanaan?: string): string {
  const now = new Date();

  const monthMap: Record<string, string> = {
    jan: "01", januari: "01",
    feb: "02", februari: "02",
    mar: "03", maret: "03",
    apr: "04", april: "04",
    mei: "05",
    jun: "06", juni: "06",
    jul: "07", juli: "07",
    agu: "08", agustus: "08",
    sep: "09", september: "09",
    okt: "10", oktober: "10",
    nov: "11", november: "11",
    des: "12", desember: "12",
  };

  const tryParse = (str?: string): string | null => {
    if (!str) return null;
    const cleanStr = str.trim();

    // Match DD/MM/YYYY or DD-MM-YYYY
    const matchDmy = cleanStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (matchDmy) {
      const d = matchDmy[1].padStart(2, "0");
      const m = matchDmy[2].padStart(2, "0");
      const y = matchDmy[3];
      return `${d}${m}${y}`;
    }

    // Match YYYY-MM-DD
    const matchYmd = cleanStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (matchYmd) {
      const y = matchYmd[1];
      const m = matchYmd[2].padStart(2, "0");
      const d = matchYmd[3].padStart(2, "0");
      return `${d}${m}${y}`;
    }

    // Match Indonesian date like "15 Juni 2026" or "Senin, 15 - 20 Juni 2026"
    const matchIndo = cleanStr.match(/(\d{1,2})\s*(?:-|s\/d|s\.d\.|sampai)?\s*(?:\d{1,2})?\s+([a-zA-Z]+)\s+(\d{4})/i);
    if (matchIndo) {
      const d = matchIndo[1].padStart(2, "0");
      const mWord = matchIndo[2].toLowerCase();
      const y = matchIndo[3];
      const m = monthMap[mWord] || "01";
      return `${d}${m}${y}`;
    }

    return null;
  };

  // Prioritize activity date (waktuPelaksanaan) then fallback to tanggalPembuatan
  const parsed = tryParse(waktuPelaksanaan) || tryParse(tanggalPembuatan);
  if (parsed) return parsed;

  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = String(now.getFullYear());
  return `${d}${m}${y}`;
}

/**
 * Converts active action verbs in Rencana Aksi (e.g. "Melaksanakan Monitoring", "Melakukan pendampingan", "Menyusun laporan", "Mengikuti rapat")
 * into formal "Pelaksanaan ..." noun phrases for report titles and file names.
 */
export function convertRencanaAksiToPelaksanaan(rencanaAksi?: string): string {
  if (!rencanaAksi) return "Pelaksanaan Rencana Aksi";

  let text = rencanaAksi
    .trim()
    .replace(/^[-•*–—\s]+/, "") // remove leading bullet points or dashes
    .replace(/\.+$/, "") // remove trailing dot
    .trim();

  if (!text) return "Pelaksanaan Rencana Aksi";

  // If already starts with "Pelaksanaan" or "pelaksanaan"
  if (/^pelaksanaan\b/i.test(text)) {
    const remainder = text.replace(/^pelaksanaan\s+/i, "").trim();
    return remainder ? `Pelaksanaan ${remainder}` : "Pelaksanaan Rencana Aksi";
  }

  // 1. "Melaksanakan ..." -> "Pelaksanaan ..."
  // Example: "Melaksanakan Monitoring" -> "Pelaksanaan Monitoring"
  // "Melaksanakan Pertemuan Kelompok P2K2" -> "Pelaksanaan Pertemuan Kelompok P2K2"
  if (/^melaksanakan\s+/i.test(text)) {
    return "Pelaksanaan " + text.replace(/^melaksanakan\s+/i, "").trim();
  }

  // 2. "Melakukan ..." -> "Pelaksanaan ..."
  // Example: "Melakukan edukasi dan sosialisasi..." -> "Pelaksanaan edukasi dan sosialisasi..."
  // "Melakukan klasifikasi..." -> "Pelaksanaan klasifikasi..."
  // "Melakukan pendampingan..." -> "Pelaksanaan pendampingan..."
  if (/^melakukan\s+/i.test(text)) {
    return "Pelaksanaan " + text.replace(/^melakukan\s+/i, "").trim();
  }

  // 3. "Menyelenggarakan ..."
  // Example: "Menyelenggarakan Pertemuan..." -> "Pelaksanaan Pertemuan..."
  if (/^menyelenggarakan\s+pertemuan/i.test(text)) {
    return "Pelaksanaan Pertemuan " + text.replace(/^menyelenggarakan\s+pertemuan\s+/i, "").trim();
  }
  if (/^menyelenggarakan\s+/i.test(text)) {
    return "Pelaksanaan Penyelenggaraan " + text.replace(/^menyelenggarakan\s+/i, "").trim();
  }

  // 4. "Menyusun ..." -> "Pelaksanaan Penyusunan ..."
  if (/^menyusun\s+/i.test(text)) {
    return "Pelaksanaan Penyusunan " + text.replace(/^menyusun\s+/i, "").trim();
  }

  // 5. "Membuat ..." -> "Pelaksanaan Pembuatan ..."
  if (/^membuat\s+/i.test(text)) {
    return "Pelaksanaan Pembuatan " + text.replace(/^membuat\s+/i, "").trim();
  }

  // 6. "Mempersiapkan ..." / "Menyiapkan ..." -> "Pelaksanaan Penyiapan ..."
  if (/^(?:mempersiapkan|menyiapkan)\s+/i.test(text)) {
    return "Pelaksanaan Penyiapan " + text.replace(/^(?:mempersiapkan|menyiapkan)\s+/i, "").trim();
  }

  // 7. "Mengompilasi ..." -> "Pelaksanaan Kompilasi ..."
  if (/^mengompilasi\s+/i.test(text)) {
    return "Pelaksanaan Kompilasi " + text.replace(/^mengompilasi\s+/i, "").trim();
  }

  // 8. "Mengikuti ..." (e.g. "Mengikuti Rapat Koordinasi...", "Mengikuti kegiatan...")
  if (/^mengikuti\s+(?:rapat|pertemuan|koordinasi|kegiatan|pelatihan|sosialisasi|bimtek|forum|workshop|seminar|audiensi)/i.test(text)) {
    return "Pelaksanaan " + text.replace(/^mengikuti\s+/i, "").trim();
  }
  if (/^mengikuti\s+/i.test(text)) {
    return "Pelaksanaan Keikutsertaan " + text.replace(/^mengikuti\s+/i, "").trim();
  }

  // 9. "Menghadiri ..."
  if (/^menghadiri\s+/i.test(text)) {
    return "Pelaksanaan " + text.replace(/^menghadiri\s+/i, "").trim();
  }

  // 10. "Menerima, mencatat..." -> "Pelaksanaan Penerimaan, Pencatatan..."
  if (/^menerima[,\s]+/i.test(text)) {
    return "Pelaksanaan Penerimaan " + text.replace(/^menerima[,\s]+/i, "").trim();
  }

  // 11. "Membantu ..."
  if (/^membantu\s+proses\s+/i.test(text)) {
    return "Pelaksanaan " + text.replace(/^membantu\s+/i, "").trim();
  }
  if (/^membantu\s+/i.test(text)) {
    return "Pelaksanaan Bantuan " + text.replace(/^membantu\s+/i, "").trim();
  }

  // 12. "Memfasilitasi ..." -> "Pelaksanaan Fasilitasi ..."
  if (/^memfasilitasi\s+/i.test(text)) {
    return "Pelaksanaan Fasilitasi " + text.replace(/^memfasilitasi\s+/i, "").trim();
  }

  // 13. "Mengkoordinasikan ..." / "Mengoordinasikan ..." -> "Pelaksanaan Koordinasi ..."
  if (/^(?:mengkoordinasikan|mengoordinasikan)\s+/i.test(text)) {
    return "Pelaksanaan Koordinasi " + text.replace(/^(?:mengkoordinasikan|mengoordinasikan)\s+/i, "").trim();
  }

  // 14. "Mendampingi ..." -> "Pelaksanaan Pendampingan ..."
  if (/^mendampingi\s+/i.test(text)) {
    return "Pelaksanaan Pendampingan " + text.replace(/^mendampingi\s+/i, "").trim();
  }

  // 15. "Mengembangkan ..." -> "Pelaksanaan Pengembangan ..."
  if (/^mengembangkan\s+/i.test(text)) {
    return "Pelaksanaan Pengembangan " + text.replace(/^mengembangkan\s+/i, "").trim();
  }

  // 16. "Mengelola ..." -> "Pelaksanaan Pengelolaan ..."
  if (/^mengelola\s+/i.test(text)) {
    return "Pelaksanaan Pengelolaan " + text.replace(/^mengelola\s+/i, "").trim();
  }

  // 17. "Memverifikasi ..." -> "Pelaksanaan Verifikasi ..."
  if (/^memverifikasi\s+/i.test(text)) {
    return "Pelaksanaan Verifikasi " + text.replace(/^memverifikasi\s+/i, "").trim();
  }

  // 18. "Memvalidasi ..." -> "Pelaksanaan Validasi ..."
  if (/^memvalidasi\s+/i.test(text)) {
    return "Pelaksanaan Validasi " + text.replace(/^memvalidasi\s+/i, "").trim();
  }

  // 19. "Memutakhirkan ..." -> "Pelaksanaan Pemutakhiran ..."
  if (/^memutakhirkan\s+/i.test(text)) {
    return "Pelaksanaan Pemutakhiran " + text.replace(/^memutakhirkan\s+/i, "").trim();
  }

  // 20. "Berperan aktif dalam..." -> "Pelaksanaan Publikasi dan Pemanfaatan Media Sosial"
  if (/^berperan\s+aktif\s+dalam\s+/i.test(text)) {
    return "Pelaksanaan Pemanfaatan " + text.replace(/^berperan\s+aktif\s+dalam\s+(?:memanfaatkan,\s*menggunakan,\s*melibatkan\s*dan\s*menyebarkan\s*)?/i, "").trim();
  }

  // 21. "Terlaksananya ..." -> "Pelaksanaan ..."
  if (/^terlaksananya\s+/i.test(text)) {
    return "Pelaksanaan " + text.replace(/^terlaksananya\s+/i, "").trim();
  }

  // Default: Prepend "Pelaksanaan "
  return `Pelaksanaan ${text}`;
}

export function formatJudulLaporan(rencanaAksi?: string): string {
  const converted = convertRencanaAksiToPelaksanaan(rencanaAksi);
  return converted.toUpperCase();
}

export function sanitizeRhkName(rhk?: string): string {
  if (!rhk) return "RHK 1";
  
  const trimmed = rhk.trim();

  // 1. Direct match with PKH options
  for (const opt of PKH_RHK_OPTIONS) {
    if (
      opt.rhkUtama.toLowerCase() === trimmed.toLowerCase() ||
      trimmed.toLowerCase().includes(opt.rhkUtama.substring(0, 30).toLowerCase()) ||
      opt.label.toLowerCase().includes(trimmed.toLowerCase())
    ) {
      return `RHK ${opt.id}`;
    }
  }

  // Check unique keywords from PKH RHKs
  if (trimmed.includes("prinsip 6T") || trimmed.includes("Bantuan Sosial PKH secara berkala")) {
    return "RHK 1";
  }
  if (trimmed.includes("P2K2") || trimmed.includes("Family Development Session")) {
    return "RHK 2";
  }
  if (trimmed.includes("verifikasi komitmen") || trimmed.includes("pendidikan (sekolah) dan kesehatan")) {
    return "RHK 3";
  }
  if (trimmed.includes("Graduasi") || trimmed.includes("PPSE")) {
    return "RHK 4";
  }
  if (trimmed.includes("pemutakhiran data") || trimmed.includes("DTSEN") || trimmed.includes("verifikasi validasi")) {
    return "RHK 5";
  }
  if (trimmed.includes("pengaduan") || trimmed.includes("Respon Kasus") || trimmed.includes("Kebencanaan")) {
    return "RHK 6";
  }
  if (trimmed.includes("laporan bulanan") || trimmed.includes("kinerja Pendamping Sosial")) {
    return "RHK 7";
  }
  if (trimmed.includes("rapat koordinasi") || trimmed.includes("TLHP") || trimmed.includes("Tugas Lainnya")) {
    return "RHK 8";
  }
  if (trimmed.includes("media sosial") || trimmed.includes("publikasi edukasi") || trimmed.includes("Media Sosial")) {
    return "RHK 9";
  }

  // 2. Check if string has explicit "RHK 1", "RHK 2", "RHK Utama 3", etc.
  const rhkNumMatch = trimmed.match(/(?:RHK|rhk)\s*(?:Utama\s*)?(\d+)/i);
  if (rhkNumMatch) {
    return `RHK ${rhkNumMatch[1]}`;
  }

  // 3. If string starts with "RHK", extract short title
  if (/^RHK/i.test(trimmed)) {
    let cleanRhk = trimmed
      .replace(/[/\\:*?"<>|\r\n]+/g, " ")
      .split(/[:\-\–\—\n]/)[0]
      .trim();
    if (cleanRhk.length > 20) {
      cleanRhk = cleanRhk.substring(0, 20).trim();
    }
    return cleanRhk || "RHK";
  }

  // 4. Custom RHK: sanitize and keep concise
  let clean = trimmed
    .replace(/[/\\:*?"<>|\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  if (clean.length > 25) {
    clean = clean.substring(0, 25).trim();
  }
  return clean ? `RHK_${clean}` : "RHK 1";
}

export function sanitizeRencanaAksi(rencanaAksi?: string): string {
  const converted = convertRencanaAksiToPelaksanaan(rencanaAksi);
  let clean = converted
    .replace(/[/\\:*?"<>|,\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  if (clean.length > 80) {
    clean = clean.substring(0, 80).trim();
  }

  return clean || "Pelaksanaan Rencana Aksi";
}

export function getReportFileName(
  data: { tanggalPembuatan?: string; waktuPelaksanaan?: string; rhkUtama?: string; rencanaAksi?: string },
  ext: "docx" | "pdf" | "" = ""
): string {
  const datePart = formatFilenameDate(data.tanggalPembuatan, data.waktuPelaksanaan);
  const rhkPart = sanitizeRhkName(data.rhkUtama);
  const aksiPart = sanitizeRencanaAksi(data.rencanaAksi);
  const baseName = `${datePart}_${rhkPart}_${aksiPart}`;
  return ext ? `${baseName}.${ext}` : baseName;
}
