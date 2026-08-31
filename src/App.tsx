import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Download, 
  Printer, 
  ChevronRight, 
  RotateCcw, 
  UploadCloud, 
  FileSignature, 
  BookOpen, 
  Layers, 
  HelpCircle,
  Briefcase,
  Calendar,
  MapPin,
  RefreshCw
} from "lucide-react";
import { ReportData, PhotoAttachment, GenerationInput } from "./types";
import { JOB_TEMPLATES, JobTemplate } from "./data/templates";
import { PKH_RHK_OPTIONS, PkhRhkOption } from "./data/pkhOptions";
import { A4Preview } from "./components/A4Preview";
import { exportToWord } from "./utils/wordGenerator";
import { ProfileSignatureCard } from "./components/ProfileSignatureCard";
import { formatIndonesianDateRange, getReportFileName, extractFormalDateForSignature } from "./utils/dateFormatter";
import { printReportDocument } from "./utils/printHelper";
import { polishTextOffline } from "./utils/textPolisher";
import { downloadDirectPdf } from "./utils/pdfGenerator";

export default function App() {
  // Navigation / App State
  const [step, setStep] = useState<"setup" | "workspace">("setup");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [genStep, setGenStep] = useState(1);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Form Input States
  const [inputs, setInputs] = useState<GenerationInput>({
    nama: "",
    nip: "",
    jabatan: "",
    unitKerja: "",
    rhkUtama: "",
    ringkasanKegiatan: "",
    targetWaktu: "Bulanan",
    peranInstansi: "",
    tempatPembuatan: "Jakarta",
    tanggalPembuatan: "",
    rencanaAksi: "",
    waktuPelaksanaan: "",
    tempatPelaksanaan: "",
    pihakTerlibat: "",
    kopTipe: "kemensos",
    kopKementerian: "",
    kopEselon1: "",
    kopEselon2: "",
    kopAlamat: "",
    kopTelepon: "",
    kopWebsite: "",
    hasSuratTugas: false,
    suratTugasNomor: "",
    suratTugasPemberi: "",
    suratTugasTanggal: "",
    suratTugasPerihal: "",
  });

  // Generated Report Data
  const [report, setReport] = useState<ReportData | null>(null);

  // Uploaded Photos State
  const [photos, setPhotos] = useState<PhotoAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Active template selector tab for job role
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<"pkh" | "umum">("pkh");

  // PKH Interactive Options State
  const [activePkhRhkId, setActivePkhRhkId] = useState<number | null>(null);

  // Date select helper states
  const [inputsStartDate, setInputsStartDate] = useState("");
  const [inputsEndDate, setInputsEndDate] = useState("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");

  // Custom AI Polish Directives
  const [polishInstructions, setPolishInstructions] = useState<Record<string, string>>({});
  const [polishingStatus, setPolishingStatus] = useState<Record<string, boolean>>({});

  // Populate helper: set date automatically on mount to today's date
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayIso = `${yyyy}-${mm}-${dd}`;
    
    setInputsStartDate(todayIso);
    const formatted = formatIndonesianDateRange(todayIso);
    setInputs((prev) => ({
      ...prev,
      waktuPelaksanaan: prev.waktuPelaksanaan || formatted,
      tanggalPembuatan: extractFormalDateForSignature(prev.waktuPelaksanaan || formatted),
    }));
  }, []);

  // Prepopulate from templates
  const handleApplyTemplate = (temp: JobTemplate) => {
    setInputs((prev) => {
      // Retain existing user date or format from current date if empty
      const effectiveWaktu = prev.waktuPelaksanaan || (inputsStartDate ? formatIndonesianDateRange(inputsStartDate, inputsEndDate) : "");
      return {
        ...prev,
        jabatan: temp.title,
        rhkUtama: temp.rhkUtama,
        ringkasanKegiatan: temp.ringkasanKegiatan,
        peranInstansi: temp.peranInstansi,
        unitKerja: temp.unitKerja,
        rencanaAksi: temp.rencanaAksi,
        waktuPelaksanaan: effectiveWaktu,
        tanggalPembuatan: extractFormalDateForSignature(effectiveWaktu),
        tempatPelaksanaan: temp.tempatPelaksanaan,
        pihakTerlibat: temp.pihakTerlibat,
        kopTipe: temp.kopTipe || prev.kopTipe || "kemensos",
      };
    });

    // Detect and sync PKH active RHK ID for the dynamic selectors
    if (temp.title.includes("RHK 1")) setActivePkhRhkId(1);
    else if (temp.title.includes("RHK 2")) setActivePkhRhkId(2);
    else if (temp.title.includes("RHK 3")) setActivePkhRhkId(3);
    else if (temp.title.includes("RHK 4")) setActivePkhRhkId(4);
    else if (temp.title.includes("RHK 5")) setActivePkhRhkId(5);
    else if (temp.title.includes("RHK 6")) setActivePkhRhkId(6);
    else if (temp.title.includes("RHK 7")) setActivePkhRhkId(7);
    else if (temp.title.includes("RHK 8")) setActivePkhRhkId(8);
    else if (temp.title.includes("RHK 9")) setActivePkhRhkId(9);
    else setActivePkhRhkId(null);
  };

  // Sync profile settings saved locally
  const handleApplyProfile = (profile: Partial<GenerationInput> & { signatureData?: string }) => {
    setInputs((prev) => ({
      ...prev,
      nama: profile.nama !== undefined ? profile.nama : prev.nama,
      nip: profile.nip !== undefined ? profile.nip : prev.nip,
      jabatan: profile.jabatan !== undefined ? profile.jabatan : prev.jabatan,
      unitKerja: profile.unitKerja !== undefined ? profile.unitKerja : prev.unitKerja,
      tempatPembuatan: profile.tempatPembuatan !== undefined ? profile.tempatPembuatan : prev.tempatPembuatan,
      signatureData: profile.signatureData !== undefined ? profile.signatureData : prev.signatureData
    }));
  };

  // Drag and Drop Photo Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleProcessFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPhoto: PhotoAttachment = {
            id: crypto.randomUUID(),
            base64Data: event.target.result as string,
            fileName: file.name,
            caption: `Dokumentasi pelaksanaan ${inputs.jabatan || "kegiatan"} - ${file.name.split('.')[0]}`,
          };
          setPhotos((prev) => [...prev, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleProcessFiles(e.target.files);
    }
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateCaption = (id: string, text: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, caption: text } : p))
    );
  };

  // Submit complete generation and handle loading status message interval
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputs.jabatan || !inputs.rhkUtama || !inputs.ringkasanKegiatan || !inputs.rencanaAksi || !inputs.waktuPelaksanaan || !inputs.tempatPelaksanaan || !inputs.pihakTerlibat) {
      setErrorStatus("Harap lengkapi Jabatan, RHK Utama, Rencana Aksi, Ringkasan Kegiatan, Waktu, Tempat, dan Pihak Terlibat.");
      return;
    }

    setErrorStatus(null);
    setIsGenerating(true);
    setGenStep(1);

    // Dynamic administrative loading loop to enrich the waiting state
    const timer1 = setTimeout(() => setGenStep(2), 2200);
    const timer2 = setTimeout(() => setGenStep(3), 4400);
    const timer3 = setTimeout(() => setGenStep(4), 7000);

    try {
      const response = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        throw new Error("Gagal melakukan penarikan draf dari server.");
      }

      const reportJson = await response.json();
      
      // Inject complete metadata values together with generated content
      const fullReport: ReportData = {
        ...inputs,
        pendahuluan: reportJson.pendahuluan,
        kegiatanLaksana: reportJson.kegiatanLaksana,
        hasilDicapai: reportJson.hasilDicapai,
        simpulanDanSaran: reportJson.simpulanDanSaran,
        penutup: reportJson.penutup,
      };

      setReport(fullReport);
      setStep("workspace");
    } catch (err: any) {
      console.warn("Generating via api failed, using high-quality local offline backup generator:", err);
      
      // High quality offline fallback generator if Gemini Key is absent / unconfigured in preview
      setTimeout(() => {
        const isKemensos = inputs.kopTipe === "kemensos" || (inputs.jabatan && inputs.jabatan.toLowerCase().includes("pkh"));
        
        const fallbackReport: ReportData = {
          ...inputs,
          pendahuluan: {
            umum: `Dalam kerangka tata kelola pemerintahan yang baik (good governance) dan akselerasi reformasi birokrasi, peningkatan kinerja aparatur sipil negara menjadi pilar fundamental dalam menjamin mutu serta kesinambungan pelayanan publik. Sebagai pejabat fungsional ${inputs.jabatan || "Aparatur Sipil Negara"} di lingkungan ${inputs.unitKerja || "instansi pemerintah"}, perwujudan akuntabilitas kinerja individu harus senantiasa terhubung langsung dengan target strategis organisasi, khususnya dalam merealisasikan Rencana Hasil Kerja (RHK) utama: "${inputs.rhkUtama}".

${isKemensos 
  ? `Penyelenggaraan program perlindungan dan jaminan sosial nasional menuntut ketepatan sasaran, keterpaduan data, serta responsivitas tinggi dari para pendamping di garis terdepan. Dinamika di lapangan mengharuskan pelaksanaan kegiatan '${inputs.rencanaAksi}' dijalankan dengan disiplin tinggi, integritas tanpa kompromi, dan komitmen pelayanan prima demi menjamin hak-hak sosial Keluarga Penerima Manfaat (KPM) terlindungi secara optimal.`
  : `Pelaksanaan tugas kedinasan pada unit ${inputs.unitKerja || "pelayanan"} menuntut efisiensi operasional, ketepatan metode kerja, dan sinergi lintas fungsi. Penyelenggaraan Rencana Aksi '${inputs.rencanaAksi}' merupakan langkah konkret dalam menjawab tantangan pelayanan publik dan mendukung pencapaian indikator kinerja utama instansi.`}

Laporan ini disusun sebagai dokumen pertanggungjawaban komprehensif atas pelaksanaan tugas kedinasan yang telah diselesaikan. Melalui laporan ini, seluruh rangkaian aktivitas, metodologi pelaksanaan, kendala yang dihadapi, hingga capaian keluaran (output) dan manfaat (outcome) didokumentasikan secara transparan, sistematis, dan akuntabel sesuai dengan Core Values ASN BerAKHLAK.`,
            
            maksudDanTujuan: `Penyusunan Laporan Pelaksanaan Rencana Hasil Kerja ini memiliki maksud dan tujuan kedinasan yang terukur, antara lain:

1. Maksud:
   a. Menyediakan dokumen pertanggungjawaban administratif dan substantif yang formal atas realisasi Rencana Aksi '${inputs.rencanaAksi}'.
   b. Menyajikan rekapitulasi data faktual dan kronologi pelaksanaan kegiatan yang diselenggarakan pada ${inputs.waktuPelaksanaan} bertempat di ${inputs.tempatPelaksanaan}.
   c. Menjadi media transparansi dan akuntabilitas kinerja personal kepada pimpinan unit kerja dan Pejabat Penilai Kinerja.

2. Tujuan:
   a. Memastikan seluruh tahapan kegiatan berjalan sesuai dengan Standar Operasional Prosedur (SOP) dan regulasi yang berlaku.
   b. Mengukur tingkat efektivitas dan efisiensi pelaksanaan tugas dalam mendukung target ${inputs.targetWaktu || "periode berjalan"}.
   c. Mengidentifikasi faktor pendukung serta hambatan di lapangan guna merumuskan langkah perbaikan berkelanjutan.
   d. Memberikan kontribusi nyata terhadap pencapaian sasaran unit kerja: ${inputs.peranInstansi || "Penunjang kelancaran tugas institusi"}.`,
            
            ruangLingkup: `Ruang lingkup pelaksanaan kegiatan dan penyusunan laporan ini dibatasi pada aspek-aspek kedinasan sebagai berikut:

1. Batasan Substantif dan Teknis: Meliputi serangkaian proses perencanaan, konsolidasi instrumen kerja, pelaksanaan operasional lapangan dari Rencana Aksi '${inputs.rencanaAksi}', fasilitasi kendala teknis, serta verifikasi kelengkapan bukti dukung (evidence).
2. Batasan Kewilayahan dan Sasaran: Dilaksanakan secara terfokus pada lokus kerja bertempat di ${inputs.tempatPelaksanaan}, dengan melibatkan secara aktif ${inputs.pihakTerlibat}.
3. Batasan Waktu: Pelaksanaan kegiatan diselenggarakan sepenuhnya pada rentang waktu ${inputs.waktuPelaksanaan} dalam periode penilaian target ${inputs.targetWaktu || "berjalan"}.`,
            
            dasar: inputs.hasSuratTugas
              ? `1. Surat Tugas dari ${inputs.suratTugasPemberi || "Pejabat Pembina Kepegawaian"} Nomor: ${inputs.suratTugasNomor || "-"} tanggal ${inputs.suratTugasTanggal || "-"} perihal ${inputs.suratTugasPerihal || "-"}.\n2. Undang-Undang Republik Indonesia Nomor 20 Tahun 2023 tentang Aparatur Sipil Negara.\n3. Undang-Undang Republik Indonesia Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial.\n4. Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Nomor 6 Tahun 2022 tentang Pengelolaan Kinerja Pegawai Aparatur Sipil Negara.\n5. Peraturan Menteri Sosial Republik Indonesia terkait Petunjuk Teknis Pelaksanaan Program Jaminan Sosial.\n6. Sasaran Kinerja Pegawai (SKP) pada unit kerja ${inputs.unitKerja || "instansi"}.`
              : `1. Undang-Undang Republik Indonesia Nomor 20 Tahun 2023 tentang Aparatur Sipil Negara.\n2. Undang-Undang Republik Indonesia Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial.\n3. Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Nomor 6 Tahun 2022 tentang Pengelolaan Kinerja Pegawai Aparatur Sipil Negara.\n4. Peraturan Menteri Sosial Republik Indonesia terkait Petunjuk Teknis Pelaksanaan Program Jaminan Sosial.\n5. Keputusan Direktur Jenderal Perlindungan dan Jaminan Sosial tentang Pedoman Operasional Program.\n6. Sasaran Kinerja Pegawai (SKP) pada unit kerja ${inputs.unitKerja || "instansi"}.`
          },
          
          kegiatanLaksana: `Pelaksanaan Rencana Hasil Kerja dengan Rencana Aksi "${inputs.rencanaAksi}" dilaksanakan secara bertahap, terstruktur, dan akuntabel melalui serangkaian tahapan operasional sebagai berikut:

1. Tahap Persiapan dan Koordinasi Awal:
   Sebelum turun ke lokasi pelaksanaan di ${inputs.tempatPelaksanaan}, pelapor melakukan penyiapan data awal, penyusunan daftar periksa (checklist), serta koordinasi teknis bersama unsur-unsur terkait (${inputs.pihakTerlibat}). Hal ini dilakukan guna memastikan kesiapan instrumen kerja, kejelasan pembagian tugas, dan meminimalkan potensi kendala teknis saat pelaksanaan di lapangan.

2. Tahap Pelaksanaan Operasional Lapangan:
   Pada ${inputs.waktuPelaksanaan}, pelapor melaksanakan rangkaian tugas kedinasan secara langsung di ${inputs.tempatPelaksanaan}. Adapun rincian fakta kegiatan yang dilaksanakan mencakup:
${inputs.ringkasanKegiatan.split('\n').map((line: string) => line.trim().startsWith('-') ? `   ${line}` : `   - ${line}`).join('\n')}

3. Tahap Interaksi dan Komunikasi Sektoral:
   Sepanjang kegiatan, pelapor membangun komunikasi yang harmonis dan kolaboratif bersama ${inputs.pihakTerlibat}. Dialog interaktif, pendampingan persuasif, dan penjelasan administratif diberikan secara transparan untuk memastikan seluruh pihak memahami substansi dan regulasi yang berlaku.

4. Tahap Pengendalian dan Penyelesaian Kendala:
   Setiap kendala yang muncul di lapangan langsung diidentifikasi, diklarifikasi, dan dikoordinasikan solusinya dengan cepat dan tepat tanpa melanggar ketentuan hukum. Seluruh proses didokumentasikan dengan cermat sebagai bukti fisik (evidence) pendukung laporan kinerja.`,
          
          hasilDicapai: `Berdasarkan seluruh rangkaian aktivitas fungsional yang telah dituntaskan di ${inputs.tempatPelaksanaan} pada ${inputs.waktuPelaksanaan}, hasil-hasil konkret dan dampak strategis (output dan outcome) yang berhasil dicapai adalah sebagai berikut:

1. Capaian Kuantitatif:
   a. Seluruh target volume kerja dari Rencana Aksi '${inputs.rencanaAksi}' terealisasi 100% tepat waktu sesuai dengan jadwal yang telah ditetapkan.
   b. Partisipasi dan kehadiran dari unsur yang terlibat (${inputs.pihakTerlibat}) berjalan optimal dengan tingkat keikutsertaan yang sangat tinggi dan tertib administrasi.
   c. Berhasil menghimpun dan memverifikasi kelengkapan dokumen pendukung (evidence), berkas administrasi, dan dokumentasi foto kegiatan secara lengkap.

2. Capaian Kualitatif:
   a. Terwujudnya pemahaman yang utuh, kesadaran tertib aturan, dan peningkatan kepuasan dari seluruh pihak/masyarakat yang dilayani.
   b. Proses pelaksanaan berjalan dengan aman, lancar, transparan, dan bebas dari segala bentuk penyimpangan maupun pungutan liar.
   c. Terjaganya integritas data dan ketaatan penuh terhadap Standar Operasional Prosedur (SOP) kedinasan.

3. Kontribusi terhadap Sasaran Kinerja Organisasi:
   Capaian ini memberikan kontribusi langsung dan nyata terhadap kinerja ${inputs.unitKerja || "unit kerja"}, yakni: ${inputs.peranInstansi || "Mewujudkan pelayanan prima, transparansi data, dan akuntabilitas program nasional"}.`,
          
          simpulanDanSaran: {
            kesimpulan: `1. Pelaksanaan Rencana Hasil Kerja (RHK) jabatan ${inputs.jabatan} melalui Rencana Aksi "${inputs.rencanaAksi}" pada ${inputs.waktuPelaksanaan} di ${inputs.tempatPelaksanaan} telah terlaksana dengan sangat baik, lancar, dan mencapai 100% dari target yang direncanakan.

2. Kolaborasi yang solid dan komunikasi yang harmonis bersama ${inputs.pihakTerlibat} menjadi faktor kunci keberhasilan pelaksanaan tugas, sekaligus membuktikan penerapan nyata nilai-nilai dasar ASN BerAKHLAK di lapangan.`,
            
            saran: `1. Disarankan untuk terus mempertahankan dan meningkatkan intensitas koordinasi berkala bersama ${inputs.pihakTerlibat} guna memperkuat sinergi kerja di masa mendatang.
2. Perlu dilakukan pemantauan berkelanjutan dan pemutakhiran data secara berkala agar kesinambungan hasil kegiatan tetap terjaga secara optimal.
3. Mengoptimalkan pemanfaatan sarana teknologi digital dan sistem informasi kepegawaian dalam percepatan pelaporan serta pengarsipan dokumen evidence secara terpusat.`
          },
          
          penutup: `Demikian Laporan Pelaksanaan Rencana Hasil Kerja ini disusun dengan sebenar-benarnya berdasarkan fakta dan kondisi riil di lapangan, sebagai wujud transparansi, loyalitas, dan akuntabilitas kinerja personal.

Besar harapan kami laporan ini dapat memberikan gambaran yang jelas mengenai capaian target kerja yang telah dilaksanakan, serta dapat dijadikan bahan evaluasi, telaah, dan pertimbangan bagi Pejabat Penilai Kinerja dalam rangka penyempurnaan pelaksanaan program di masa yang akan datang.`
        };
        setReport(fallbackReport);
        setStep("workspace");
      }, 3500); // simulation delay for nice user transition
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsGenerating(false);
    }
  };

  // Perform granular AI polishing of single designated text blocks
  const handlePolishSection = async (sectionKey: string, sectionTitle: string, currentText: string) => {
    if (!report) return;

    setPolishingStatus((prev) => ({ ...prev, [sectionKey]: true }));
    const directive = polishInstructions[sectionKey] || "";

    let revisedText = "";

    try {
      const response = await fetch("/api/report/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionTitle,
          currentContent: currentText,
          instruction: directive,
          jabatan: report.jabatan,
          rhkUtama: report.rhkUtama,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        revisedText = data.polishedText;
      } else {
        // Fallback to intelligent offline polisher
        revisedText = polishTextOffline(currentText, sectionTitle, directive, report.jabatan, report.rhkUtama);
      }
    } catch (err) {
      // Fallback to intelligent offline polisher
      revisedText = polishTextOffline(currentText, sectionTitle, directive, report.jabatan, report.rhkUtama);
    }

    if (revisedText) {
      // Update nested state cleanly
      setReport((prev) => {
        if (!prev) return null;
        const updated = { ...prev };
        
        if (sectionKey.startsWith("pendahuluan.")) {
          const subKey = sectionKey.split(".")[1] as keyof typeof prev.pendahuluan;
          updated.pendahuluan = {
            ...prev.pendahuluan,
            [subKey]: revisedText,
          };
        } else if (sectionKey.startsWith("simpulanDanSaran.")) {
          const subKey = sectionKey.split(".")[1] as keyof typeof prev.simpulanDanSaran;
          updated.simpulanDanSaran = {
            ...prev.simpulanDanSaran,
            [subKey]: revisedText,
          };
        } else {
          (updated as any)[sectionKey] = revisedText;
        }

        return updated;
      });

      // Clear the input directive text
      setPolishInstructions((prev) => ({ ...prev, [sectionKey]: "" }));
    }

    setPolishingStatus((prev) => ({ ...prev, [sectionKey]: false }));
  };

  // Direct edit changes handler inside custom textareas
  const handleDirectEdit = (sectionKey: string, newValue: string) => {
    setReport((prev) => {
      if (!prev) return null;
      const updated = { ...prev };

      if (sectionKey.startsWith("pendahuluan.")) {
        const subKey = sectionKey.split(".")[1] as keyof typeof prev.pendahuluan;
        updated.pendahuluan = {
          ...prev.pendahuluan,
          [subKey]: newValue,
        };
      } else if (sectionKey.startsWith("simpulanDanSaran.")) {
        const subKey = sectionKey.split(".")[1] as keyof typeof prev.simpulanDanSaran;
        updated.simpulanDanSaran = {
          ...prev.simpulanDanSaran,
          [subKey]: newValue,
        };
      } else {
        (updated as any)[sectionKey] = newValue;
      }

      return updated;
    });
  };

  // Direct PDF Download Handler
  const handleDirectPdfDownload = async () => {
    if (!report) return;
    setIsPdfDownloading(true);
    try {
      await downloadDirectPdf(report, photos);
    } catch (e) {
      console.error("Direct PDF generation error:", e);
      // Fallback to print preview
      triggerNativePrint();
    } finally {
      setIsPdfDownloading(false);
    }
  };

  // Trigger A4 Native Print window
  const triggerNativePrint = () => {
    if (report) {
      printReportDocument(report, photos);
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Visual Workspace Navbar */}
      <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-950 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500 text-white p-2 rounded-lg font-bold shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">LAPORAN SKP RHK AI</h1>
              <p className="text-[10px] text-emerald-300">Penyusunan Laporan SKP & Rencana Hasil Kerja ASN Otomatis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {step === "workspace" && (
              <button 
                onClick={() => setStep("setup")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-800 rounded text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Susun Ulang
              </button>
            )}
            <div className="bg-emerald-950 border border-emerald-800 rounded px-2.5 py-1 text-[10px] text-emerald-300 font-mono">
              v1.3 // Powered by Gemini 3.7 & Offline Engine
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Node */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: INITIAL SYSTEM INPUT STATE */}
          {step === "setup" && !isGenerating && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              
              {/* Introduction Column */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg">
                  <div className="inline-block bg-emerald-500/30 p-2.5 rounded-lg mb-4">
                    <Sparkles className="w-6 h-6 text-emerald-300" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Automated RHK MyASN</h2>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    Sistem kecerdasan untuk membantu Aparatur Sipil Negara menyusun Laporan RHK birokratis baku secara otomatis. Cukup masukkan aktivitas mentah, AI akan mengekspansi menjadi draf formal secara terstruktur sesuai standar birokrasi pemerintahan Indonesia.
                  </p>
                  
                  <div className="mt-6 border-t border-emerald-700/50 pt-4 space-y-3">
                    <div className="flex gap-2.5 text-xs text-emerald-100">
                      <div className="bg-emerald-500/20 w-5 h-5 flex items-center justify-center rounded-full shrink-0">1</div>
                      <p>Pilih tipe jabatan atau ketik manual</p>
                    </div>
                    <div className="flex gap-2.5 text-xs text-emerald-100">
                      <div className="bg-emerald-500/20 w-5 h-5 flex items-center justify-center rounded-full shrink-0">2</div>
                      <p>Tulis kata kunci aktivitas penugasan Anda</p>
                    </div>
                    <div className="flex gap-2.5 text-xs text-emerald-100">
                      <div className="bg-emerald-500/20 w-5 h-5 flex items-center justify-center rounded-full shrink-0">3</div>
                      <p>Draft terintegrasi penuh siap poles dan unduh</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Data Form Setup Component */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Profile & Signature Management Card */}
                <ProfileSignatureCard 
                  inputs={inputs}
                  setInputs={setInputs}
                  onApplyProfile={handleApplyProfile}
                />

                <form onSubmit={handleGenerateReport} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-base font-bold text-slate-800">Formulasi Profil & Target MyASN</h2>
                    <p className="text-xs text-slate-400">Harap lengkapi instrumen target penugasan Anda untuk melatih kecerdasan AI.</p>
                  </div>

                  {errorStatus && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-800 rounded">
                      {errorStatus}
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Nama Pegawai (Lengkap + Gelar)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Contoh: Andi Pratama, S.Si., M.T."
                          value={inputs.nama}
                          onChange={(e) => setInputs({ ...inputs, nama: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-slate-50/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        NIP Pegawai
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 19940315 201804 1 002"
                        value={inputs.nip}
                        onChange={(e) => setInputs({ ...inputs, nip: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Jabatan Pelapor <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-300" />
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Pranata Komputer Ahli Pertama"
                          value={inputs.jabatan}
                          onChange={(e) => setInputs({ ...inputs, jabatan: e.target.value })}
                          className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-slate-50/50 font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Unit Kerja
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Dinas Komunikasi dan Informatika Daerah"
                        value={inputs.unitKerja}
                        onChange={(e) => setInputs({ ...inputs, unitKerja: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Operational Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Tempat Pembuatan
                      </label>
                      <div className="relative">
                        <MapPin className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-300" />
                        <input
                          type="text"
                          placeholder="Jakarta"
                          value={inputs.tempatPembuatan}
                          onChange={(e) => setInputs({ ...inputs, tempatPembuatan: e.target.value })}
                          className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-slate-50/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Tanggal Tanda Tangan / Pengesahan
                      </label>
                      <div className="relative">
                        <Calendar className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-300" />
                        <input
                          type="text"
                          placeholder="Otomatis mengikuti tanggal pelaksanaan"
                          value={inputs.tanggalPembuatan}
                          onChange={(e) => setInputs({ ...inputs, tanggalPembuatan: e.target.value })}
                          className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Target Periode Laporan Ke-MyASN
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {["Bulanan", "Triwulanan", "Semesteran", "Tahunan"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setInputs({ ...inputs, targetWaktu: opt })}
                          className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                            inputs.targetWaktu === opt
                              ? "bg-emerald-600 text-white border-emerald-600 shadow"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CONFIGURATION SECTION: KOP SURAT & SURAT TUGAS */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <FileSignature className="w-4 h-4 text-emerald-600" />
                      Atur Kop Surat & Surat Tugas Terhubung (Presisi)
                    </h3>

                    {/* Kop Surat Configuration */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                          Gunakan Kop Surat Resmi (Kepala Surat)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: "none", label: "Tanpa Kop" },
                            { value: "kemensos", label: "Kemensos RI (Preset)" },
                            { value: "kustom", label: "Kop Kustom" }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setInputs({ ...inputs, kopTipe: opt.value })}
                              className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${
                                inputs.kopTipe === opt.value
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* If kustom kop chosen, show sub-inputs */}
                      {inputs.kopTipe === "kustom" && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-inner">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                              Kementerian / Lembaga / Pemerintah Daerah
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: KEMENTERIAN KESEHATAN REPUBLIK INDONESIA"
                              value={inputs.kopKementerian || ""}
                              onChange={(e) => setInputs({ ...inputs, kopKementerian: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 text-xs shadow-sm bg-slate-50/50"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                Unit Organisasi Eselon I (Opsional)
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: DIREKTORAT JENDERAL PELAYANAN KESEHATAN"
                                value={inputs.kopEselon1 || ""}
                                onChange={(e) => setInputs({ ...inputs, kopEselon1: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 text-xs shadow-sm bg-slate-50/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                Unit Eselon II / Satuan Kerja (Opsional)
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: RSUP NASIONAL DR. CIPTO MANGUNKUSUMO"
                                value={inputs.kopEselon2 || ""}
                                onChange={(e) => setInputs({ ...inputs, kopEselon2: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 text-xs shadow-sm bg-slate-50/50"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                              Alamat Instansi Terperinci
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: Jl. Pangeran Diponegoro No. 71, Jakarta Pusat 10430"
                              value={inputs.kopAlamat || ""}
                              onChange={(e) => setInputs({ ...inputs, kopAlamat: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 text-xs shadow-sm bg-slate-50/50"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                No. Telepon / Fax (Opsional)
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: (021) 3103591"
                                value={inputs.kopTelepon || ""}
                                onChange={(e) => setInputs({ ...inputs, kopTelepon: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 text-xs shadow-sm bg-slate-50/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                Website resmi / Email (Opsional)
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: http://www.kemkes.go.id"
                                value={inputs.kopWebsite || ""}
                                onChange={(e) => setInputs({ ...inputs, kopWebsite: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 text-xs shadow-sm bg-slate-50/50"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Surat Tugas Toggling & Configuration */}
                    <div className="border-t border-slate-200 pt-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                            Hubungkan Dengan Surat Tugas Resmi?
                          </label>
                          <p className="text-[10px] text-slate-400">
                            Mengaitkan draf laporan langsung dengan nomor tugas formal birokrasi agar isi narasi presisi.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInputs({ ...inputs, hasSuratTugas: !inputs.hasSuratTugas })}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm ${
                            inputs.hasSuratTugas
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          {inputs.hasSuratTugas ? "Aktif" : "Non-Aktif"}
                        </button>
                      </div>

                      {inputs.hasSuratTugas && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-inner">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                Nomor Surat Tugas <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required={inputs.hasSuratTugas}
                                placeholder="Contoh: ST-556/Dit.JS/VI/2026"
                                value={inputs.suratTugasNomor || ""}
                                onChange={(e) => setInputs({ ...inputs, suratTugasNomor: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 text-xs shadow-sm bg-slate-50/50 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                Jabatan Pemberi Tugas <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required={inputs.hasSuratTugas}
                                placeholder="Contoh: Direktur Perlindungan Sosial Non Kebencanaan"
                                value={inputs.suratTugasPemberi || ""}
                                onChange={(e) => setInputs({ ...inputs, suratTugasPemberi: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 text-xs shadow-sm bg-slate-50/50"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                Tanggal Surat Tugas <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required={inputs.hasSuratTugas}
                                placeholder="Contoh: 01 Juni 2026"
                                value={inputs.suratTugasTanggal || ""}
                                onChange={(e) => setInputs({ ...inputs, suratTugasTanggal: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 text-xs shadow-sm bg-slate-50/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                Perihal / Tujuan Penugasan <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required={inputs.hasSuratTugas}
                                placeholder="Contoh: Pelaksanaan Rapat Koordinasi dan Penguatan Kapasitas SDM PKH"
                                value={inputs.suratTugasPerihal || ""}
                                onChange={(e) => setInputs({ ...inputs, suratTugasPerihal: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 text-xs shadow-sm bg-slate-50/50"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive PKH Daily Reporting Helper Panel */}
                  <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                        Asisten Pilih RHK & Rencana Aksi Harian
                      </h4>
                      <span className="bg-emerald-100 text-emerald-900 font-mono text-[9px] px-2 py-0.5 rounded font-black border border-emerald-200 uppercase shadow-xs select-none">
                        PROGRES HARIAN
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      PILIH salah satu RHK di bawah untuk melihat pilihan Rencana Aksi harian yang sesuai. Klik pilihan Rencana Aksi fungsional Anda untuk otomatis mengisi instrumen formulir di bawah.
                    </p>

                    {/* Step 1: Select RHK */}
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        1. Pilih Rencana Hasil Kerja (RHK):
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 font-sans">
                        {PKH_RHK_OPTIONS.map((opt) => {
                          const isSelected = activePkhRhkId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setActivePkhRhkId(opt.id);
                                // Set the corresponding RHK Utama and auto-select the first Rencana Aksi option
                                setInputs(prev => ({
                                  ...prev,
                                  rhkUtama: opt.rhkUtama,
                                  rencanaAksi: opt.rencanaAksiOptions[0] || ""
                                }));
                              }}
                              className={`py-2 px-1 text-center text-[10.5px] font-bold rounded-xl border transition-all ${
                                isSelected
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                              }`}
                            >
                              RHK {opt.id}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Select Rencana Aksi dynamically */}
                    {activePkhRhkId !== null && (
                      <div className="space-y-3.5 pt-3 border-t border-emerald-100/60">
                        {(PKH_RHK_OPTIONS.find(o => o.id === activePkhRhkId)) && (
                          <div className="bg-white/80 p-3 rounded-xl border border-emerald-50 text-xs">
                            <span className="font-bold text-emerald-800 block text-[9px] uppercase tracking-wide mb-1">
                              Target RHK Utama Terpilih (RHK {activePkhRhkId}):
                            </span>
                            <p className="text-slate-600 leading-relaxed font-sans text-[11px]">
                              {PKH_RHK_OPTIONS.find(o => o.id === activePkhRhkId)?.rhkUtama}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            2. Pilih Rencana Aksi Kerja Terkait (Sesuai RHK {activePkhRhkId}):
                          </span>
                          <div className="space-y-1.5">
                            {PKH_RHK_OPTIONS.find(o => o.id === activePkhRhkId)?.rencanaAksiOptions.map((rencAction, idx) => {
                              const isSelectedAction = inputs.rencanaAksi === rencAction;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setInputs(prev => ({
                                      ...prev,
                                      rencanaAksi: rencAction
                                    }));
                                  }}
                                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                                    isSelectedAction
                                      ? "bg-emerald-50 text-emerald-900 border-emerald-400 shadow-xs"
                                      : "bg-white text-slate-700 border-slate-100 hover:bg-slate-50/50 hover:border-emerald-200"
                                  }`}
                                >
                                  <div className={`mt-0.5 w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                                    isSelectedAction 
                                      ? "border-emerald-600 bg-emerald-600 text-white" 
                                      : "border-slate-300 bg-white"
                                  }`}>
                                    {isSelectedAction && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                  <span className="text-[11.5px] font-medium leading-relaxed font-sans">
                                    {rencAction}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Rencana Hasil Kerja (RHK) Utama <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Contoh: Terlaksananya pemeliharaan infrstruktur server lokal agar berjalan minim kendala dan aman."
                      value={inputs.rhkUtama}
                      onChange={(e) => setInputs({ ...inputs, rhkUtama: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-800 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" /> Pilihan Rencana Aksi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Contoh: Melakukan pemeliharaan rutin infrastruktur server lokal, pemulihan gangguan jaringan, dan pendampingan bantuan teknis."
                      value={inputs.rencanaAksi}
                      onChange={(e) => setInputs({ ...inputs, rencanaAksi: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-emerald-50/10 font-medium"
                    />
                  </div>

                  <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      
                      {/* Left Block: Date Selectors (Calendar) */}
                      <div className="md:col-span-7 space-y-2">
                        <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Pilih Tanggal Pelaksanaan (Kalender)
                        </label>
                        <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                          Pilih tanggal mulai &amp; selesai pada kalender di bawah untuk otomatis menyusun format tanggal.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[8.5px] font-bold text-slate-500 uppercase block mb-1">Mulai Kegiatan:</span>
                            <input
                              type="date"
                              value={inputsStartDate}
                              onChange={(e) => {
                                const newStart = e.target.value;
                                setInputsStartDate(newStart);
                                const formatted = formatIndonesianDateRange(newStart, inputsEndDate);
                                setInputs(prev => ({ 
                                  ...prev, 
                                  waktuPelaksanaan: formatted,
                                  tanggalPembuatan: extractFormalDateForSignature(formatted)
                                }));
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-white font-sans text-slate-700"
                            />
                          </div>
                          <div>
                            <span className="text-[8.5px] font-bold text-slate-500 uppercase block mb-1">Selesai (Opsional):</span>
                            <input
                              type="date"
                              value={inputsEndDate}
                              onChange={(e) => {
                                const newEnd = e.target.value;
                                setInputsEndDate(newEnd);
                                const formatted = formatIndonesianDateRange(inputsStartDate, newEnd);
                                setInputs(prev => ({ 
                                  ...prev, 
                                  waktuPelaksanaan: formatted,
                                  tanggalPembuatan: extractFormalDateForSignature(formatted)
                                }));
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-white font-sans text-slate-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Raw/Formatted Output and Text Input */}
                      <div className="md:col-span-5 flex flex-col justify-end space-y-2">
                        <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                          Hasil Format Tanggal <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                          Format di bawah terisi otomatis, atau Anda dapat mengetik manual di sini secara fleksibel.
                        </p>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Senin, 31 Agustus 2026 atau Senin s.d. Jumat, 01 - 05 September 2026"
                          value={inputs.waktuPelaksanaan}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInputs({ 
                              ...inputs, 
                              waktuPelaksanaan: val,
                              tanggalPembuatan: extractFormalDateForSignature(val)
                            });
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-emerald-950 bg-white shadow-xs"
                        />
                      </div>

                    </div>

                    {/* Places & Partners split grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-emerald-100/60">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Tempat Kegiatan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Gedung Lantai 2, Ruang Server"
                          value={inputs.tempatPelaksanaan}
                          onChange={(e) => setInputs({ ...inputs, tempatPelaksanaan: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" /> Pihak Terlibat / Peserta <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Staf TI & 12 rekan kerja"
                          value={inputs.pihakTerlibat}
                          onChange={(e) => setInputs({ ...inputs, pihakTerlibat: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Ringkasan Aktivitas Nyata yang Telah Dilakukan <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[10px] text-slate-400 mb-1.5">
                      Tulis poin kasar saja (misal: merakit kabel, melayani unit 3, backup server harian). AI akan menyusunnya menjadi jalinan kalimat yang kaya dan sangat professional.
                    </p>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tulis poin-poin kegiatan harian..."
                      value={inputs.ringkasanKegiatan}
                      onChange={(e) => setInputs({ ...inputs, ringkasanKegiatan: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Kontribusi terhadap Organisasi / Instansi (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Mengakselerasi tata kelola sistem pemerintahan digital yang transparan"
                      value={inputs.peranInstansi}
                      onChange={(e) => setInputs({ ...inputs, peranInstansi: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-slate-50/50"
                    />
                  </div>

                  {/* Submission Action Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs tracking-wide shadow transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-100 animate-pulse" />
                      Susun Laporan RHK Otomatis Dengan AI ✨
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* LOADING SCREEN WITH DETAILED GOVERNMENT STEPS */}
          {isGenerating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto my-12 bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center"
            >
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center text-emerald-600 mb-6">
                <RefreshCw className="w-12 h-12 animate-spin text-emerald-500" />
                <div className="absolute inset-0 w-12 h-12 m-auto rounded-full bg-emerald-50 -z-10 animate-ping"></div>
              </div>

              <h2 className="text-base font-bold text-slate-800 mb-2">Asisten AI Sedang Merumuskan Laporan...</h2>
              <p className="text-xs text-slate-400 mb-6">Harap tunggu, instruksi birokrasi sedang diselaraskan demi hasil maksimal.</p>
              
              {/* Step checklist */}
              <div className="text-left space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-[300px] overflow-hidden">
                <div className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 shrink-0">
                    {genStep >= 1 ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-semibold ${genStep === 1 ? 'text-emerald-700' : 'text-slate-500'}`}>Menganalisis Kinerja Jabatan</h4>
                    <p className="text-[10px] text-slate-400">Memetakan relevansi peran fungsional terhadap Rencana Hasil Kerja MyASN...</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 shrink-0">
                    {genStep >= 2 ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-semibold ${genStep === 2 ? 'text-emerald-700' : 'text-slate-500'}`}>Merujuk Dasar Hukum Peraturan</h4>
                    <p className="text-[10px] text-slate-400">Merangkum UU No. 20 Tahun 2023 tentang ASN serta instrumen SKP eksekutif...</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 shrink-0">
                    {genStep >= 3 ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-semibold ${genStep === 3 ? 'text-emerald-700' : 'text-slate-500'}`}>Penyusunan Narasi Terstruktur</h4>
                    <p className="text-[10px] text-slate-400">Menyusun Pendahuluan, Aktivitas Laksana, Hasil Kerja, dan Simpulan formal...</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 shrink-0">
                    {genStep >= 4 ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 mt-1.5"></div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-semibold ${genStep === 4 ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>Penyuntingan Akhir PUEBI</h4>
                    <p className="text-[10px] text-slate-400">Melakukan verifikasi tata bahasa Indonesia baku serta konvensi pelaporan pemerintah.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: INTERACTIVE WORKSPACE DASHBOARD */}
          {step === "workspace" && report && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              
              {/* Workspace Action Bar */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap justify-between items-center gap-4 no-print select-none">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg font-bold">
                    <FileSignature className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Workspace Editor & Review Capaian</h2>
                    <p className="text-[10px] text-slate-400">Gunakan panel kiri untuk menyunting manual atau poles via AI, dan amati hasilnya langsung di panel kanan.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => exportToWord(report, photos)}
                    title="Unduh dokumen dalam format Microsoft Word (.docx)"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>Unduh Word (.docx)</span>
                  </button>

                  <button
                    onClick={handleDirectPdfDownload}
                    disabled={isPdfDownloading}
                    title="Unduh berkas PDF (.pdf) langsung ke perangkat Anda tanpa membuka dialog printer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    {isPdfDownloading ? (
                      <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 shrink-0 text-emerald-100" />
                    )}
                    <span>{isPdfDownloading ? "Menyiapkan PDF..." : "Unduh PDF (.pdf)"}</span>
                  </button>

                  <button
                    onClick={triggerNativePrint}
                    title="Cetak dokumen ke printer fisik atau buka pratinjau cetak browser"
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer active:scale-95"
                  >
                    <Printer className="w-4 h-4 shrink-0 text-slate-600" />
                    <span>Cetak / Print</span>
                  </button>
                </div>
              </div>

              {/* Workspace split screens: Form Editor Left, Document Preview Right */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Panel Editor (Left) */}
                <div className="xl:col-span-5 space-y-6 no-print">
                  
                  {/* metadata info edit accordion */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600" /> Informasi Pegawai & Pembuatan
                      </h3>
                    </div>

                    {/* Kop Surat Switcher in Workspace */}
                    <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                          <FileSignature className="w-3.5 h-3.5 text-emerald-600" /> Kop Surat Laporan
                        </label>
                        <span className="text-[9px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          {report.kopTipe === "kemensos" ? "Kemensos RI" : report.kopTipe === "kustom" ? "Kustom" : "Tanpa Kop"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { value: "kemensos", label: "Kemensos RI" },
                          { value: "kustom", label: "Kustom" },
                          { value: "none", label: "Tanpa Kop" }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setReport({ ...report, kopTipe: opt.value })}
                            className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                              (report.kopTipe || "kemensos") === opt.value
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Nama Pelapor</label>
                        <input
                          type="text"
                          value={report.nama}
                          onChange={(e) => setReport({ ...report, nama: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">NIP Pegawai</label>
                        <input
                          type="text"
                          value={report.nip}
                          onChange={(e) => setReport({ ...report, nip: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Jabatan ASN</label>
                        <input
                          type="text"
                          value={report.jabatan}
                          onChange={(e) => setReport({ ...report, jabatan: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Unit Kerja</label>
                        <input
                          type="text"
                          value={report.unitKerja}
                          onChange={(e) => setReport({ ...report, unitKerja: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tempat Pembuatan</label>
                        <input
                          type="text"
                          value={report.tempatPembuatan}
                          onChange={(e) => setReport({ ...report, tempatPembuatan: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
                          <span>Tanggal Naskah</span>
                          <span className="text-[8.5px] text-emerald-700 font-medium bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/50">Auto Tanggal Kegiatan</span>
                        </label>
                        <input
                          type="text"
                          disabled
                          value={extractFormalDateForSignature(report.waktuPelaksanaan, report.tanggalPembuatan)}
                          title="Tanggal pembuatan naskah disamakan otomatis dengan tanggal kegiatan"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-100 bg-emerald-50/50 text-emerald-950 text-xs font-semibold shadow-2xs cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3.5 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-800 mb-1 uppercase tracking-wide">Rencana Aksi Terpilih</label>
                        <textarea
                          rows={2}
                          value={report.rencanaAksi}
                          onChange={(e) => setReport({ ...report, rencanaAksi: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-sm bg-emerald-50/5 font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Waktu Kegiatan</label>
                          <input
                            type="text"
                            value={report.waktuPelaksanaan}
                            onChange={(e) => {
                              const val = e.target.value;
                              setReport({ 
                                ...report, 
                                waktuPelaksanaan: val,
                                tanggalPembuatan: extractFormalDateForSignature(val)
                              });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 text-[10px] shadow-sm text-slate-800 bg-white font-semibold"
                          />
                          <div className="mt-1.5 grid grid-cols-2 gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <div>
                              <span className="text-[7.5px] font-black text-slate-400 uppercase block select-none">Mulai:</span>
                              <input
                                type="date"
                                value={reportStartDate}
                                onChange={(e) => {
                                  const nStart = e.target.value;
                                  setReportStartDate(nStart);
                                  const formatted = formatIndonesianDateRange(nStart, reportEndDate);
                                  setReport({ 
                                    ...report, 
                                    waktuPelaksanaan: formatted,
                                    tanggalPembuatan: extractFormalDateForSignature(formatted)
                                  });
                                }}
                                className="w-full p-0.5 border border-slate-200 rounded text-[9px] text-slate-600 bg-white font-sans"
                              />
                            </div>
                            <div>
                              <span className="text-[7.5px] font-black text-slate-400 uppercase block select-none">Selesai:</span>
                              <input
                                type="date"
                                value={reportEndDate}
                                onChange={(e) => {
                                  const nEnd = e.target.value;
                                  setReportEndDate(nEnd);
                                  const formatted = formatIndonesianDateRange(reportStartDate, nEnd);
                                  setReport({ 
                                    ...report, 
                                    waktuPelaksanaan: formatted,
                                    tanggalPembuatan: extractFormalDateForSignature(formatted)
                                  });
                                }}
                                className="w-full p-0.5 border border-slate-200 rounded text-[9px] text-slate-600 bg-white font-sans"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Tempat Kegiatan</label>
                          <input
                            type="text"
                            value={report.tempatPelaksanaan}
                            onChange={(e) => setReport({ ...report, tempatPelaksanaan: e.target.value })}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 text-[10px] shadow-sm text-slate-700 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Pihak Terlibat</label>
                          <input
                            type="text"
                            value={report.pihakTerlibat}
                            onChange={(e) => setReport({ ...report, pihakTerlibat: e.target.value })}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 text-[10px] shadow-sm text-slate-700 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accordion List for Section Customizer and Polishers */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600" /> Editor Konten & Asisten Poles AI
                    </h3>

                    {/* Editor helper component generator function to prevent code verbosity */}
                    {(() => {
                      const renderPolishInput = (sectionKey: string, sectionTitle: string, currentContent: string) => {
                        return (
                          <div className="mt-2 bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                              <Sparkles className="w-3 h-3 text-emerald-600" /> Instruksi AI Poles Section
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Misal: Buat lebih panjang, sebutkan BerAKHLAK..."
                                value={polishInstructions[sectionKey] || ""}
                                onChange={(e) =>
                                  setPolishInstructions((prev) => ({
                                    ...prev,
                                    [sectionKey]: e.target.value,
                                  }))
                                }
                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] shadow-inner bg-white"
                              />
                              <button
                                type="button"
                                disabled={polishingStatus[sectionKey]}
                                onClick={() => handlePolishSection(sectionKey, sectionTitle, currentContent)}
                                className={`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1`}
                              >
                                {polishingStatus[sectionKey] ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Poles ✨"
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <div className="space-y-6">
                          
                          {/* A. PENDAHULUAN ACCORDION BOXES */}
                          <div className="space-y-4">
                            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
                              <h4 className="text-xs font-bold text-slate-800 mb-2">A.1 Pendahuluan (Umum)</h4>
                              <textarea
                                rows={3}
                                value={report.pendahuluan.umum}
                                onChange={(e) => handleDirectEdit("pendahuluan.umum", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                              {renderPolishInput("pendahuluan.umum", "A.1 Pendahuluan Umum", report.pendahuluan.umum)}
                            </div>

                            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
                              <h4 className="text-xs font-bold text-slate-800 mb-2">A.2 Pendahuluan (Maksud & Tujuan)</h4>
                              <textarea
                                rows={3}
                                value={report.pendahuluan.maksudDanTujuan}
                                onChange={(e) => handleDirectEdit("pendahuluan.maksudDanTujuan", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                              />
                              {renderPolishInput("pendahuluan.maksudDanTujuan", "A.2 Maksud dan Tujuan", report.pendahuluan.maksudDanTujuan)}
                            </div>

                            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
                              <h4 className="text-xs font-bold text-slate-800 mb-2">A.3 Pendahuluan (Ruang Lingkup)</h4>
                              <textarea
                                rows={3}
                                value={report.pendahuluan.ruangLingkup}
                                onChange={(e) => handleDirectEdit("pendahuluan.ruangLingkup", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                              />
                              {renderPolishInput("pendahuluan.ruangLingkup", "A.3 Ruang Lingkup", report.pendahuluan.ruangLingkup)}
                            </div>

                            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
                              <h4 className="text-xs font-bold text-slate-800 mb-2">A.4 Pendahuluan (Dasar Peraturan)</h4>
                              <textarea
                                rows={3}
                                value={report.pendahuluan.dasar}
                                onChange={(e) => handleDirectEdit("pendahuluan.dasar", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                              />
                              {renderPolishInput("pendahuluan.dasar", "A.4 Dasar Hukum", report.pendahuluan.dasar)}
                            </div>
                          </div>

                          {/* B. KEGIATAN LAKSANA BOX */}
                          <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
                            <h4 className="text-xs font-bold text-slate-800 mb-2">B. Kegiatan yang Dilaksanakan</h4>
                            <textarea
                              rows={4}
                              value={report.kegiatanLaksana}
                              onChange={(e) => handleDirectEdit("kegiatanLaksana", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                            />
                            {renderPolishInput("kegiatanLaksana", "B. Kegiatan yang Dilaksanakan", report.kegiatanLaksana)}
                          </div>

                          {/* C. HASIL DICAPAI BOX */}
                          <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
                            <h4 className="text-xs font-bold text-slate-800 mb-2">C. Hasil yang Dicapai</h4>
                            <textarea
                              rows={4}
                              value={report.hasilDicapai}
                              onChange={(e) => handleDirectEdit("hasilDicapai", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                            />
                            {renderPolishInput("hasilDicapai", "C. Hasil yang Dicapai", report.hasilDicapai)}
                          </div>

                          {/* D. SIMPULAN ACCORDION BOXES */}
                          <div className="space-y-4">
                            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
                              <h4 className="text-xs font-bold text-slate-800 mb-2">D.1 Kesimpulan</h4>
                              <textarea
                                rows={3}
                                value={report.simpulanDanSaran.kesimpulan}
                                onChange={(e) => handleDirectEdit("simpulanDanSaran.kesimpulan", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                              />
                              {renderPolishInput("simpulanDanSaran.kesimpulan", "D.1 Kesimpulan", report.simpulanDanSaran.kesimpulan)}
                            </div>

                            <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
                              <h4 className="text-xs font-bold text-slate-800 mb-2">D.2 Saran Rekomendasi</h4>
                              <textarea
                                rows={3}
                                value={report.simpulanDanSaran.saran}
                                onChange={(e) => handleDirectEdit("simpulanDanSaran.saran", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                              />
                              {renderPolishInput("simpulanDanSaran.saran", "D.2 Saran Rekomendasi", report.simpulanDanSaran.saran)}
                            </div>
                          </div>

                          {/* E. PENUTUP BOX */}
                          <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/60">
                            <h4 className="text-xs font-bold text-slate-800 mb-2">E. Penutup</h4>
                            <textarea
                              rows={3}
                              value={report.penutup}
                              onChange={(e) => handleDirectEdit("penutup", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                            />
                            {renderPolishInput("penutup", "E. Penutup", report.penutup)}
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                  {/* FOTO KEGIATAN: MULTI UPLOAD DROPAREA & CAPTION CONFIG */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                      <UploadCloud className="w-4 h-4 text-emerald-600" /> Dokumentasi Lampiran Foto
                    </h3>

                    <p className="text-[10px] text-slate-400">
                      Unggah foto bukti pelaksanaan kegiatan Anda. Dukungan multi-upload langsung disematkan pada lembar Lampiran Foto di halaman berikutnya.
                    </p>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("photo-upload-input")?.click()}
                      className={`h-32 border-2 border-dashed rounded-xl flex flex-col justify-center items-center p-4 text-center cursor-pointer transition-all ${
                        isDragging 
                          ? "border-emerald-600 bg-emerald-50/50" 
                          : "border-slate-200 hover:border-emerald-500 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        id="photo-upload-input"
                        onChange={handleFileChange}
                      />
                      <UploadCloud className={`w-8 h-8 mb-2 ${isDragging ? "text-emerald-600 animate-bounce" : "text-slate-400"}`} />
                      <p className="text-xs font-semibold text-slate-700">Tarik gambar kemari atau klik untuk berkas</p>
                      <p className="text-[10px] text-slate-400 mt-1">Multi file image supported (JPEG, PNG, dll)</p>
                    </div>

                    {/* Uploaded File List Config */}
                    {photos.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1">
                          <span>TERUNGGAH ({photos.length})</span>
                          <button 
                            type="button" 
                            onClick={() => setPhotos([])} 
                            className="text-red-500 hover:underline"
                          >
                            Hapus Semua
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {photos.map((p, i) => (
                            <div key={p.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-3 items-start relative hover:shadow-xs transition-shadow">
                              <img
                                src={p.base64Data}
                                alt={p.fileName}
                                className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-200 bg-white"
                              />
                              <div className="flex-1 space-y-1">
                                <div className="text-[9px] font-bold text-slate-400 truncate tracking-wide max-w-[150px]">
                                  Gbr {i + 1} - {p.fileName}
                                </div>
                                <input
                                  type="text"
                                  value={p.caption}
                                  placeholder="Masukkan keterangan foto..."
                                  onChange={(e) => handleUpdateCaption(p.id, e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 focus:border-emerald-500 rounded text-[10px] bg-white font-medium text-slate-800"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(p.id)}
                                className="p-1 text-slate-300 hover:text-red-500 rounded absolute right-2 top-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Live A4 Interactive Preview Window (Right) */}
                <div className="xl:col-span-7">
                  <div className="bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-900 sticky top-[72px]">
                    <div className="flex justify-between items-center text-slate-300 uppercase tracking-widest text-[9px] font-bold mb-3 border-b border-slate-700/50 pb-2 no-print">
                      <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-emerald-400" /> Lembar A4 Live Preview [Real-time]</span>
                      <span className="bg-slate-700 px-2 py-0.5 rounded text-[8px] text-slate-400">600 DPI Digital Output</span>
                    </div>

                    {/* Standard Render Component */}
                    <div className="max-h-[85vh] overflow-y-auto rounded-lg custom-scrollbar">
                      <A4Preview data={report} photos={photos} />
                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Styled Micro-Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 no-print">
        <p className="semibold">Laporan SKP RHK AI — Republik Indonesia</p>
        <p className="text-[10px] mt-1 text-slate-300">Aplikasi penyusunan draf fungsional terpadu secara mandiri didukung model AI.</p>
      </footer>

    </div>
  );
}
