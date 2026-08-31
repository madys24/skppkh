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
Generate a fully structured, hyper-focused, and highly detailed RHK (Rencana Hasil Kerja) report for MyASN with properties matching the job of a "${jabatan}" focusing on RHK Utama: "${rhkUtama}".

CRITICAL DISCIPLINE & DIRECTIVE:
1. STRICT TRUTH-ANCHORING (TIDAK NGELANTUR): Do NOT make up, assume, or hallucinate arbitrary locations, dates, or participants. Focus 100% of the narrative on the concrete problem, chosen action plan, and activities provided.
2. NARRATIVE GROUNDING:
   - "Rencana Aksi" yang dipilih: "${rencanaAksi}"
   - "Kegiatan yang dilaksanakan" (Ringkasan Kasar): "${ringkasanKegiatan}"
   - "Waktu Kegiatan": "${waktuPelaksanaan}"
   - "Tempat Kegiatan": "${tempatPelaksanaan}"
   - "Pihak yang Terlibat / Diikuti Oleh": "${pihakTerlibat}"

3. REQUIRED NARRATIVE EXPANSION (Must be covered in detail in the generated blocks below):
   - Pelaksanaan: Detail the technical and administrative steps of how the action plan "${rencanaAksi}" was executed using "${ringkasanKegiatan}".
   - Waktu: Elaborate directly on "${waktuPelaksanaan}" as the formal duration of the work.
   - Tempat: Explicitly describe the condition and physical setting of "${tempatPelaksanaan}" where the tasks took place.
   - Diikuti oleh siapa saja: Describe the roles, coordination, and interactions with "${pihakTerlibat}" during the implementation.

${assignmentLetterContext}
${letterheadContext}

Additional information:
- Reporter Name: ${nama || "(Belum Diatur)"}
- NIP: ${nip || "(Belum Diatur)"}
- Unit Kerja: ${unitKerja || "(Belum Diatur)"}
- Target Waktu Periode: ${targetWaktu || "Bulanan/Tahunan"}
- Kontribusi terhadap Unit Kerja: ${peranInstansi || "(Belum Diatur)"}

Generate comprehensive, professional, and detailed content in formal Indonesian governmental language (Bahasa Indonesia Baku/PUEBI). Make every section rich, highly realistic, and tightly cohesive with the facts provided.

For 'dasar' (A.4), please include realistic citations of relevant legal bases (such as Undang-Undang No. 20 Tahun 2023 tentang Aparatur Sipil Negara, Peraturan Pemerintah/Permenpan-RB that corresponds to the job position e.g., for computer staff/teachers/etc., and internal local policies) in addition to any Assignment Letter mentioned.

Return exactly a JSON object conforming to this schema (do not wrap in markdown tags other than the raw JSON output):
{
  "pendahuluan": {
    "umum": "Latar belakang umum yang mendalam dan kontekstual terkait tugas jabatan ini dalam mendukung pembangunan instansi nasional.",
    "maksudDanTujuan": "Penjelasan rinci maksud penyusunan laporan Rencana Hasil Kerja ini dan tujuan pencapaian indikator kinerja individu.",
    "ruangLingkup": "Batasan serta cakupan kegiatan yang dilaporkan selama periode waktu yang ditentukan.",
    "dasar": "Daftar dasar hukum dan peraturan perundang-undangan (UU ASN, Permenpan, Perpres, SK, dll) yang relevan dan mendasari penugasan."
  },
  "kegiatanLaksana": "Deskripsi rinci mengenai proses pelaksanaan kegiatan sehari-hari dari hulu ke hilir untuk merealisasikan RHK tersebut.",
  "hasilDicapai": "Kuantitas, kualitas, serta dampak nyata (output & outcome) dari hasil kerja keras yang telah dicapai, diselaraskan dengan sasaran unit kerja.",
  "simpulanDanSaran": {
    "kesimpulan": "Deskripsi penarikan kesimpulan akhir yang kritis mengenai tingkat keberhasilan pencapaian target kerja.",
    "saran": "Rekomendasi taktis dan konstruktif untuk perbaikan berkelanjutan pelaksanaan kegiatan di masa mendatang."
  },
  "penutup": "Pernyataan penutup formal serta ucapan terima kasih atas kolaborasi yang terjalin."
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
Anda adalah asisten admin ASN (Aparatur Sipil Negara) yang sangat ahli dalam menyunting laporan birokrasi Indonesia.
Tugas Anda adalah memperkeras, merapikan, dan menuangkan tata bahasa formal (Bahasa Indonesia Baku/PUEBI) ke bagian laporan "${sectionTitle}" saat ini.

Informasi Pekerjaan:
- Jabatan: ${jabatan || "Pegawai ASN"}
- Rencana Hasil Kerja (RHK) Utama: ${rhkUtama || "Kinerja Utama"}

Instruksi Tambahan dari Pengguna: "${instruction || "Membuat kalimat lebih formal, terstruktur, kaya akan penjelasan akademis dan profesional"}"

Konten Saat Ini:
"""
${currentContent}
"""

Tulis ulang bagian tersebut agar sangat elegan, kaya informasi, dan rapi sesuai struktur serta standar instansi pemerintah RI. 
PENTING: Hanya keluarkan teks hasil revisi akhir saja tanpa pengantar, tanpa penutup, tanpa tambahan komentar/pesan, dan tanpa tanda petik pembuka/penutup.
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
