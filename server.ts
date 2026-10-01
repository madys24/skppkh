import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload sizes for base64 images if needed, but we keep reports lightweight
app.use(express.json({ limit: '15mb' }));

// Lazy instance helper for Gemini API
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Please configure it in your Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// API Route: Generate Complete RHK Report Draft
app.post("/api/report/generate", async (req, res) => {
  try {
    const { 
      nama, 
      nip, 
      jabatan, 
      unitKerja, 
      rhkUtama, 
      ringkasanKegiatan, 
      targetWaktu,
      peranInstansi,
      rencanaAksi,
      waktuPelaksanaan,
      tempatPelaksanaan,
      pihakTerlibat,
      
      // Kop Surat
      kopTipe,
      kopKementerian,
      kopEselon1,
      kopEselon2,
      kopAlamat,
      kopTelepon,
      kopWebsite,

      // Surat Tugas
      hasSuratTugas,
      suratTugasNomor,
      suratTugasPemberi,
      suratTugasTanggal,
      suratTugasPerihal
    } = req.body;

    if (!jabatan || !rhkUtama || !ringkasanKegiatan || !rencanaAksi || !waktuPelaksanaan || !tempatPelaksanaan || !pihakTerlibat) {
      return res.status(400).json({ 
        error: "Harap isi Jabatan, RHK Utama, Rencana Aksi, Ringkasan Kegiatan, Waktu, Tempat, dan Pihak Terlibat terlebih dahulu." 
      });
    }

    const ai = getGeminiClient();

    // Prepare helper instruction if Assignment Letter is present
    let assignmentLetterContext = "";
    if (hasSuratTugas) {
      assignmentLetterContext = `
The work is formally assigned under Surat Tugas (Assignment Letter) with the following exact details:
- Surat Tugas Number: "${suratTugasNomor || "-"}"
- Issued by/Signee: "${suratTugasPemberi || "-"}"
- Date of Surat Tugas: "${suratTugasTanggal || "-"}"
- Purpose described in Assignment Letter: "${suratTugasPerihal || "-"}"

INTEGRATE THIS ASSIGNMENT LETTER INTO THE REPORT:
1. Under "Pendahuluan > Dasar" (A.4), you MUST prioritize listing this Surat Tugas as an official underlying assignment. E.g., "Surat Tugas Kepala/Direktur ${suratTugasPemberi || "-"} Nomor ${suratTugasNomor || "-"} tanggal ${suratTugasTanggal || "-"} perihal ${suratTugasPerihal || "-"}" as the prominent legal baseline.
2. In the "Kegiatan yang Dilaksanakan" (Section B) and "Hasil yang Dicapai" (Section C), reference that the activities were carried out in accordance with Surat Tugas Nomor ${suratTugasNomor || "-"} issued by ${suratTugasPemberi || "-"} to maintain strict professional accountability.
`;
    }

    // Let's add Kop Surat context if applicable
    let letterheadContext = "";
    if (kopTipe === "kemensos") {
      letterheadContext = `The reporting officer works under: Kementerian Sosial Republik Indonesia, Direktorat Jenderal Perlindungan dan Jaminan Sosial, Direktorat Perlindungan Sosial Non Kebencanaan. Frame the opening general background (Pendahuluan > Umum) with relevant context relating to Social Protection (Perlindungan Sosial / PKH / Kemsos).`;
    } else if (kopTipe === "kustom" && kopKementerian) {
      letterheadContext = `The reporting officer works under: ${kopKementerian} ${kopEselon1 ? `, ${kopEselon1}` : ""} ${kopEselon2 ? `, ${kopEselon2}` : ""}. Contextualize the general background corresponding to this institution's main public mission.`;
    }

    const prompt = `
Anda adalah seorang petugas/pendamping lapangan profesional yang berpengalaman dalam menyusun laporan pertanggungjawaban kegiatan operasional riil.
Tugas Anda adalah menyusun Laporan Rencana Hasil Kerja (RHK) jabatan "${jabatan}" yang berfokus pada RHK Utama: "${rhkUtama}".

PANDUAN GAYA BAHASA LAPORAN PETUGAS LAPANGAN:
1. GAYA BAHASA: Bersifat naratif deskriptif, mengalir, natural, komunikatif, dan tidak kaku/tidak terlalu formal teoritis. Ceritakan secara hidup apa yang sebenarnya dilakukan, diamati, dan dihadapi langsung oleh petugas di lapangan.
2. SUDUT PANDANG: Laporan praktisi/petugas lapangan yang bertindak secara nyata, menyapa warga/sasaran, berkoordinasi dengan aparat setempat, melakukan pengecekan data langsung, menyelesaikan kendala riil di lapangan, dan mencatat hasil secara tertib.
3. WAJIB HILANGKAN POIN-POIN & PENOMORAN: DILARANG KERAS menggunakan format daftar berbutir, simbol strip (-), bullet (•), maupun penomoran angka/huruf (seperti 1., 2., a., b.) di dalam teks isi narasi. Seluruh bagian laporan WAJIB ditulis murni dalam bentuk PARAGRAF NARASI yang mengalir rapi.
4. PERLUAS NARASI LAPANGAN: Jabarkan secara rinci dan mendalam dalam beberapa paragraf panjang di tiap bagian untuk menghasilkan laporan yang utuh, komprehensif, dan kaya detail operasional.

INFORMASI FAKTUAN KEGIATAN:
- Rencana Aksi yang dijalankan: "${rencanaAksi}"
- Ringkasan Catatan Kegiatan Lapangan: "${ringkasanKegiatan}"
- Waktu Pelaksanaan: "${waktuPelaksanaan}"
- Tempat / Lokasi Kegiatan: "${tempatPelaksanaan}"
- Pihak yang Terlibat / Ditemui: "${pihakTerlibat}"

${assignmentLetterContext}
${letterheadContext}

RINCIAN PENYUSUNAN SETIAP BAGIAN DALAM BENTUK PARAGRAF NARASI:
- A. PENDAHULUAN:
  * 1. Umum: 2-3 paragraf narasi mengalir yang memaparkan latar belakang pelaksanaan tugas lapangan ini, pentingnya kegiatan bagi masyarakat di lokasi kerja, serta peran aktif petugas dalam memastikan program berjalan lancar.
  * 2. Maksud dan Tujuan: 2 paragraf narasi mengalir (tanpa poin 1/2 atau a/b) yang menguraikan maksud kehadiran petugas di lapangan serta target praktis yang ingin dicapai demi keteraturan pelayanan dan kepuasan warga.
  * 3. Ruang Lingkup: 2 paragraf narasi mengalir yang merinci cakupan wilayah di "${tempatPelaksanaan}", sasaran warga/pihak yang ditemui ("${pihakTerlibat}"), serta batas waktu pelaksanaan kegiatan tanpa penomoran baris.
  * 4. Dasar: WAJIB berisi format poin rujukan hukum berikut secara persis:
a. Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial.
b. Peraturan Menteri Sosial Republik Indonesia Nomor 8 Tahun 2026 tentang Program Keluarga Harapan.
c. Keputusan Direktur Jenderal Perlindungan dan Jaminan Sosial Nomor 20/3/HK.01/3/2025.${hasSuratTugas ? `\nd. Surat Tugas ${suratTugasPemberi || "Pimpinan"} Nomor ${suratTugasNomor || "-"} tanggal ${suratTugasTanggal || "-"} perihal ${suratTugasPerihal || "-"}.` : ""}
- B. KEGIATAN YANG DILAKSANAKAN:
  * 4-5 paragraf narasi kronologis yang menceritakan perjalanan dan aktivitas petugas dari awal persiapan perlengkapan, kehadiran di lokasi "${tempatPelaksanaan}", interaksi ramah dan dialog bersama "${pihakTerlibat}", penanganan teknis/proses kerja lapangan, hingga verifikasi akhir dan dokumentasi bukti kegiatan.
- C. HASIL YANG DICAPAI:
  * 3-4 paragraf narasi deskriptif yang menjelaskan capaian nyata di lapangan, antusiasme dan respons positif dari warga/pihak yang dilayani, ketepatan penyelesaian target 100%, serta manfaat langsung kegiatan bagi kelancaran operasional "${unitKerja}".
- D. SIMPULAN DAN SARAN:
  * Kesimpulan: 2 paragraf narasi evaluasi menyeluruh atas kelancaran pelaksanaan tugas di lapangan, dinamika yang berhasil diatasi, dan komitmen pelayanan yang telah diwujudkan.
  * Saran: 2 paragraf narasi berkesinambungan (tanpa angka 1, 2, 3) yang memuat usulan praktis, langkah tindak lanjut lapangan, dan penguatan koordinasi untuk kegiatan mendatang.
- E. PENUTUP:
  * 2 paragraf narasi penutup laporan pertanggungjawaban petugas lapangan dengan harapan agar laporan ini menjadi bahan evaluasi dan perbaikan program ke depan.

Nama Petugas: ${nama || "(Belum Diatur)"}
NIP: ${nip || "(Belum Diatur)"}
Unit Kerja: ${unitKerja || "(Belum Diatur)"}
Target Periode: ${targetWaktu || "Periode Berjalan"}

Keluarkan HANYA objek JSON sesuai skema berikut tanpa tanda markdown lain:
{
  "pendahuluan": {
    "umum": "Paragraf-paragraf narasi mengalir tentang latar belakang tugas lapangan tanpa poin-poin.",
    "maksudDanTujuan": "Paragraf narasi mengalir tentang maksud dan tujuan kegiatan lapangan tanpa penomoran.",
    "ruangLingkup": "Paragraf narasi mengalir tentang batasan wilayah, sasaran, dan waktu tanpa butir daftar.",
    "dasar": "a. Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial.\\nb. Peraturan Menteri Sosial Republik Indonesia Nomor 8 Tahun 2026 tentang Program Keluarga Harapan.\\nc. Keputusan Direktur Jenderal Perlindungan dan Jaminan Sosial Nomor 20/3/HK.01/3/2025."
  },
  "kegiatanLaksana": "Paragraf-paragraf narasi kronologis mendalam yang menceritakan detail proses kegiatan petugas di lapangan tanpa poin/bullet.",
  "hasilDicapai": "Paragraf-paragraf narasi capaian nyata, respons warga, dan ketercapaian target di lapangan tanpa format list.",
  "simpulanDanSaran": {
    "kesimpulan": "Paragraf narasi kesimpulan evaluasi pelaksanaan tugas lapangan.",
    "saran": "Paragraf narasi saran dan tindak lanjut perbaikan ke depan dalam bentuk narasi mengalir tanpa angka/poin."
  },
  "penutup": "Paragraf narasi penutup laporan pertanggungjawaban petugas lapangan."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["pendahuluan", "kegiatanLaksana", "hasilDicapai", "simpulanDanSaran", "penutup"],
          properties: {
            pendahuluan: {
              type: Type.OBJECT,
              required: ["umum", "maksudDanTujuan", "ruangLingkup", "dasar"],
              properties: {
                umum: { type: Type.STRING },
                maksudDanTujuan: { type: Type.STRING },
                ruangLingkup: { type: Type.STRING },
                dasar: { type: Type.STRING }
              }
            },
            kegiatanLaksana: { type: Type.STRING },
            hasilDicapai: { type: Type.STRING },
            simpulanDanSaran: {
              type: Type.OBJECT,
              required: ["kesimpulan", "saran"],
              properties: {
                kesimpulan: { type: Type.STRING },
                saran: { type: Type.STRING }
              }
            },
            penutup: { type: Type.STRING }
          }
        },
        temperature: 0.2, // Keep it highly professional and coherent
      }
    });

    if (!response.text) {
      throw new Error("Model did not return any text response.");
    }

    const reportJson = JSON.parse(response.text.trim());
    res.json(reportJson);

  } catch (error: any) {
    console.error("Error generating report draft:", error);
    res.status(500).json({ error: error?.message || "Gagal menyusun laporan otomatis menggunakan AI." });
  }
});

// API Route: Polish Section of Report
app.post("/api/report/polish", async (req, res) => {
  try {
    const { sectionTitle, currentContent, instruction, jabatan, rhkUtama } = req.body;

    if (!currentContent) {
      return res.status(400).json({ error: "Konten yang ingin dipoles tidak boleh kosong." });
    }

    const ai = getGeminiClient();

    const prompt = `
Anda adalah penyunting laporan operasional lapangan ASN/petugas pelayanan publik di Indonesia.
Tugas Anda adalah memoles dan memperluas narasi pada bagian "${sectionTitle}" agar menjadi narasi laporan petugas lapangan yang hidup, mengalir, deskriptif, tidak kaku/tidak teoritis berlebihan, namun tetap tertib dan profesional.

Informasi Jabatan:
- Jabatan: ${jabatan || "Petugas Lapangan"}
- Rencana Hasil Kerja (RHK) Utama: ${rhkUtama || "Kinerja Utama"}

Instruksi Tambahan dari Pengguna: "${instruction || "Perluas narasi gaya bahasa laporan petugas lapangan, deskripsikan proses dan dinamika secara mengalir, dan pastikan dalam bentuk paragraf narasi tanpa poin-poin/angka"}"

Konten Saat Ini:
"""
${currentContent}
"""

ATURAN UTAMA:
1. Tuliskan dalam bentuk PARAGRAF NARASI yang mengalir rapi.
2. DILARANG KERAS menggunakan poin-poin berbutir, simbol (-), bullet (•), maupun penomoran angka/huruf (1., 2., a., b.).
3. Gunakan gaya bahasa naratif petugas lapangan yang natural, komunikatif, dan menggambarkan pelaksanaan tugas secara jelas.
4. HANYA keluarkan teks hasil revisi akhir saja tanpa pengantar, tanpa penutup, tanpa tambahan komentar/pesan, dan tanpa tanda petik pembuka/penutup.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    const polishedText = response.text ? response.text.trim() : currentContent;
    res.json({ polishedText });

  } catch (error: any) {
    console.error("Error polishing report section:", error);
    res.status(500).json({ error: error?.message || "Gagal memoles konten laporan dengan AI." });
  }
});

// Serve frontend assets via Vite during development, or static build in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server RHK MyASN running on port ${PORT}`);
  });
}

startServer();
