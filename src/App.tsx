import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Sparkles, 
  Trash2, 
  Check, 
  Download, 
  Printer, 
  ChevronRight, 
  RotateCcw, 
  UploadCloud, 
  FileSignature, 
  Layers, 
  Briefcase,
  Calendar,
  MapPin,
  RefreshCw,
  Camera,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";
import { ReportData, PhotoAttachment, GenerationInput } from "./types";
import { JOB_TEMPLATES, JobTemplate } from "./data/templates";
import { PKH_RHK_OPTIONS } from "./data/pkhOptions";
import { A4Preview } from "./components/A4Preview";
import { exportToWord } from "./utils/wordGenerator";
import { ProfileSignatureCard } from "./components/ProfileSignatureCard";
import { formatIndonesianDateRange, getReportFileName, extractFormalDateForSignature } from "./utils/dateFormatter";
import { printReportDocument } from "./utils/printHelper";
import { downloadDirectPdf } from "./utils/pdfGenerator";

export const OFFICIAL_DASAR_TEXT = (hasSuratTugas?: boolean, pemberi?: string, nomor?: string, tanggal?: string, perihal?: string) => {
  const base = `a. Undang-Undang Nomor 11 Tahun 2009 tentang Kesejahteraan Sosial.\nb. Peraturan Menteri Sosial Republik Indonesia Nomor 8 Tahun 2026 tentang Program Keluarga Harapan.\nc. Keputusan Direktur Jenderal Perlindungan dan Jaminan Sosial Nomor 20/3/HK.01/3/2025.`;
  if (hasSuratTugas && nomor) {
    return `${base}\nd. Surat Tugas ${pemberi || "Pimpinan"} Nomor ${nomor} tanggal ${tanggal || "-"} perihal ${perihal || "-"}.`;
  }
  return base;
};

export default function App() {
  // Navigation / Workflow State: 1. details -> 2. photos -> 3. report
  const [currentStep, setCurrentStep] = useState<"details" | "photos" | "report">("details");
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

  // PKH Interactive Options State
  const [activePkhRhkId, setActivePkhRhkId] = useState<number | null>(null);

  // Date select helper states
  const [inputsStartDate, setInputsStartDate] = useState("");
  const [inputsEndDate, setInputsEndDate] = useState("");

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
            caption: `Dokumentasi pelaksanaan ${inputs.rencanaAksi ? inputs.rencanaAksi.substring(0, 50) : (inputs.jabatan || "kegiatan")} - Foto ${photos.length + 1}`,
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

  // Validate Step 1 before moving to Step 2
  const handleProceedToPhotos = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputs.jabatan || !inputs.rhkUtama || !inputs.ringkasanKegiatan || !inputs.rencanaAksi || !inputs.waktuPelaksanaan || !inputs.tempatPelaksanaan || !inputs.pihakTerlibat) {
      setErrorStatus("Harap lengkapi Jabatan, RHK Utama, Rencana Aksi, Ringkasan Kegiatan, Waktu, Tempat, dan Pihak Terlibat.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrorStatus(null);
    setCurrentStep("photos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit complete generation and open report view (without individual bab editing)
  const handleGenerateReport = async () => {
    if (!inputs.jabatan || !inputs.rhkUtama || !inputs.ringkasanKegiatan || !inputs.rencanaAksi || !inputs.waktuPelaksanaan || !inputs.tempatPelaksanaan || !inputs.pihakTerlibat) {
      setErrorStatus("Harap lengkapi detail kegiatan terlebih dahulu.");
      setCurrentStep("details");
      return;
    }

    setErrorStatus(null);
    setIsGenerating(true);
    setGenStep(1);

    const timer1 = setTimeout(() => setGenStep(2), 1500);
    const timer2 = setTimeout(() => setGenStep(3), 3000);
    const timer3 = setTimeout(() => setGenStep(4), 4500);

    const exactDasar = OFFICIAL_DASAR_TEXT(
      inputs.hasSuratTugas, 
      inputs.suratTugasPemberi, 
      inputs.suratTugasNomor, 
      inputs.suratTugasTanggal, 
      inputs.suratTugasPerihal
    );

    try {
      const response = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil data dari server, beralih ke generator lokal.");
      }

      const reportJson = await response.json();
      
      const fullReport: ReportData = {
        ...inputs,
        pendahuluan: {
          ...reportJson.pendahuluan,
          dasar: exactDasar, // Guaranteed exact official Dasar required by user
        },
        kegiatanLaksana: reportJson.kegiatanLaksana,
        hasilDicapai: reportJson.hasilDicapai,
        simpulanDanSaran: reportJson.simpulanDanSaran,
        penutup: reportJson.penutup,
      };

      setReport(fullReport);
      setCurrentStep("report");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.warn("Generating via api failed, using high-quality local offline fallback generator:", err);
      
      setTimeout(() => {
        const cleanRingkasan = inputs.ringkasanKegiatan
          .split("\n")
          .map((line: string) => line.trim().replace(/^[-*•\d+.\s]+/, "").trim())
          .filter(Boolean)
          .join(". ");

        const fallbackReport: ReportData = {
          ...inputs,
          pendahuluan: {
            umum: `Kegiatan pelayanan dan pendampingan masyarakat di lapangan merupakan bagian penting dari pelaksanaan tugas operasional sehari-hari sebagai ${inputs.jabatan || "petugas pelaksana"} di lingkungan ${inputs.unitKerja || "unit kerja"}. Agar program kerja yang telah direncanakan dapat dirasakan manfaatnya secara langsung oleh masyarakat, pelaksanaan di lokasi penugasan senantiasa dijalankan dengan penuh tanggung jawab, ketelitian, serta pendekatan komunikasi yang ramah dan terbuka.

Melalui pelaksanaan Rencana Hasil Kerja utama "${inputs.rhkUtama}", petugas hadir secara langsung di lokasi untuk memastikan setiap tahapan kegiatan '${inputs.rencanaAksi}' dapat berjalan dengan lancar, tertib, dan sesuai dengan petunjuk teknis kedinasan yang berlaku.

Laporan ini disusun sebagai bentuk pertanggungjawaban riil atas apa yang telah dilaksanakan, diamati, dan dihadapi langsung oleh petugas di lapangan. Seluruh catatan alur kegiatan, dialog interaktif bersama warga, serta hasil capaian yang diperoleh disajikan secara transparan dan terperinci dalam laporan ini.`,
            
            maksudDanTujuan: `Penyusunan laporan ini dimaksudkan untuk mendokumentasikan seluruh rangkaian kegiatan penugasan lapangan yang dilaksanakan pada ${inputs.waktuPelaksanaan} bertempat di ${inputs.tempatPelaksanaan}. Melalui laporan ini, pimpinan dan pihak terkait dapat memperoleh gambaran utuh mengenai proses kerja nyata, dinamika di lapangan, serta langkah solutif yang diambil petugas di lokasi kegiatan.

Tujuan utama dari kegiatan ini adalah memastikan terlaksananya '${inputs.rencanaAksi}' secara aman, tertib, dan memberikan manfaat langsung bagi ${inputs.pihakTerlibat}. Selain itu, kegiatan ini juga ditujukan untuk memperkuat koordinasi di tingkat lapangan, menjaring aspirasi warga, serta mendukung ketercapaian target kinerja ${inputs.peranInstansi || "pada unit kerja"}.`,
            
            ruangLingkup: `Ruang lingkup laporan ini mencakup seluruh tahapan penugasan lapangan yang dilaksanakan oleh petugas, mulai dari persiapan awal, pelaksanaan pendampingan dan koordinasi langsung, hingga evaluasi serta perapian data hasil kegiatan.

Wilayah pelaksanaan kegiatan dipusatkan di ${inputs.tempatPelaksanaan} dengan sasaran pihak yang terlibat meliputi ${inputs.pihakTerlibat}. Seluruh rangkaian kegiatan ini dilaksanakan pada rentang waktu ${inputs.waktuPelaksanaan} dalam rangka pemenuhan target kinerja ${inputs.targetWaktu || "periode berjalan"}.`,
            
            dasar: exactDasar
          },
          
          kegiatanLaksana: `Pelaksanaan kegiatan dimulai dengan persiapan perlengkapan administrasi dan instrumen pendukung sebelum petugas berangkat ke lokasi tugas. Setibanya di ${inputs.tempatPelaksanaan} pada ${inputs.waktuPelaksanaan}, petugas langsung menemui dan berkoordinasi dengan ${inputs.pihakTerlibat} untuk menyelaraskan alur kegiatan agar seluruh tahapan dapat berlangsung tertib dan teratur.

Selanjutnya, petugas melaksanakan agenda utama secara langsung di lapangan. Dalam prosesnya, petugas melakukan rangkaian tindakan nyata, antara lain ${cleanRingkasan ? cleanRingkasan + "." : "melakukan pendampingan teknis dan verifikasi data faktual secara langsung."} Setiap tahapan diarahkan dengan penjelasan yang jelas dan mudah dipahami, sehingga warga maupun pihak terkait merasa nyaman dalam berinteraksi.

Selama kegiatan berlangsung, komunikasi dua arah dibangun secara terbuka dan bersahabat. Segala pertanyaan, masukan, maupun kendala administratif yang ditemui di lapangan langsung ditangani dan diberikan solusi di tempat. Petugas juga mendokumentasikan setiap momen penting sebagai bukti otentik pelaksanaan tugas. Seluruh rangkaian kegiatan selesai dengan aman, lancar, dan penuh kebersamaan.`,
          
          hasilDicapai: `Pelaksanaan kegiatan di ${inputs.tempatPelaksanaan} pada ${inputs.waktuPelaksanaan} telah membuahkan hasil yang memuaskan dan mencapai seluruh target yang diharapkan. Seluruh agenda dalam rencana aksi terlaksana seratus persen tepat waktu, dan warga maupun pihak yang terlibat (${inputs.pihakTerlibat}) dapat mengikuti seluruh tahapan dengan tertib dan lancar.

Dari segi pelayanan dan interaksi sosial, kehadiran petugas disambut dengan sangat baik dan terbuka oleh masyarakat setempat. Warga merasa terbantu dengan adanya pendampingan langsung, penjelasan yang gamblang, serta kemudahan dalam menyelesaikan urusan yang berkaitan dengan program.

Seluruh data administrasi, catatan hasil kunjungan, dan dokumentasi foto di lapangan telah berhasil dihimpun secara lengkap dan akurat. Hasil capaian ini secara nyata mendukung kelancaran operasional pada ${inputs.unitKerja || "unit kerja"} dan memperkuat mutu pelayanan publik yang diberikan.`,
          
          simpulanDanSaran: {
            kesimpulan: `Secara keseluruhan, pelaksanaan tugas lapangan untuk Rencana Aksi "${inputs.rencanaAksi}" di ${inputs.tempatPelaksanaan} telah berjalan dengan aman, tertib, dan berhasil mencapai tujuan yang telah ditetapkan. Pendekatan persuasif dan komunikasi yang baik dengan ${inputs.pihakTerlibat} menjadi faktor utama kelancaran kegiatan di lapangan.

Kegiatan ini membuktikan pentingnya kehadiran petugas secara langsung di lokasi untuk memantau kondisi riil, mendengar kebutuhan warga, dan memastikan setiap kendala administratif maupun teknis dapat diselesaikan dengan cepat dan tepat.`,
            
            saran: `Berdasarkan pengalaman dan pengamatan langsung selama bertugas di lapangan, disarankan agar komunikasi dan koordinasi berkala bersama ${inputs.pihakTerlibat} terus dipertahankan dan ditingkatkan agar pelaksanaan kegiatan serupa di masa mendatang dapat berjalan lebih efisien.

Selain itu, diperlukan pemantauan dan pemutakhiran data secara berkelanjutan pasca kegiatan, serta penguatan sarana penunjang pendataan di lapangan agar pelayanan kepada masyarakat dapat terus ditingkatkan kualitasnya.`
          },
          
          penutup: `Demikian laporan kegiatan lapangan ini kami susun dengan sebenarnya berdasarkan pengamatan, interaksi, dan fakta riil yang terjadi di lokasi penugasan.

Semoga laporan ini dapat memberikan gambaran yang jelas mengenai proses serta hasil kerja petugas di lapangan, sekaligus menjadi bahan evaluasi dan masukan yang bermanfaat bagi penyempurnaan program kerja ke depan.`
        };

        setReport(fallbackReport);
        setCurrentStep("report");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 2500);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsGenerating(false);
    }
  };

  // Direct PDF Download Handler
  const handleDirectPdfDownload = async () => {
    if (!report) return;
    setIsPdfDownloading(true);
    try {
      await downloadDirectPdf(report, photos);
    } catch (e) {
      console.error("Direct PDF generation error:", e);
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-950 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-xl font-bold shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">LAPORAN SKP RHK</h1>
              <p className="text-[10px] text-emerald-300">Penyusunan Laporan Penugasan RHK &amp; Foto Dokumentasi Otomatis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {report && currentStep !== "report" && (
              <button 
                onClick={() => setCurrentStep("report")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-semibold"
              >
                <FileText className="w-3.5 h-3.5" /> Lihat Dokumen
              </button>
            )}
            <div className="bg-emerald-950 border border-emerald-800 rounded px-2.5 py-1 text-[10px] text-emerald-300 font-mono">
              Format Baku A4
            </div>
          </div>
        </div>
      </header>

      {/* Modern Workflow Step Indicator Bar */}
      <div className="bg-white border-b border-slate-200 py-3 shadow-xs no-print">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            
            {/* Step 1: Detail Kegiatan */}
            <button
              onClick={() => setCurrentStep("details")}
              className={`flex items-center gap-2.5 transition-all text-left ${
                currentStep === "details"
                  ? "text-emerald-700 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === "details"
                  ? "bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100"
                  : "bg-slate-100 text-slate-600 border border-slate-300"
              }`}>
                1
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold leading-tight">Detail Kegiatan</div>
                <div className="text-[10px] text-slate-400">Identitas &amp; Pelaksanaan</div>
              </div>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />

            {/* Step 2: Foto Dokumentasi */}
            <button
              onClick={() => {
                if (!inputs.jabatan || !inputs.rhkUtama || !inputs.ringkasanKegiatan || !inputs.rencanaAksi) {
                  setErrorStatus("Harap lengkapi detail kegiatan terlebih dahulu.");
                  return;
                }
                setErrorStatus(null);
                setCurrentStep("photos");
              }}
              className={`flex items-center gap-2.5 transition-all text-left ${
                currentStep === "photos"
                  ? "text-emerald-700 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === "photos"
                  ? "bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100"
                  : photos.length > 0
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-slate-100 text-slate-600 border border-slate-300"
              }`}>
                {photos.length > 0 ? "✓" : "2"}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold leading-tight">Foto Dokumentasi</div>
                <div className="text-[10px] text-slate-400">
                  {photos.length > 0 ? `${photos.length} Foto Siap` : "Unggah Bukti Lapangan"}
                </div>
              </div>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />

            {/* Step 3: Hasil Laporan & PDF */}
            <button
              onClick={() => {
                if (report) {
                  setCurrentStep("report");
                } else {
                  handleGenerateReport();
                }
              }}
              className={`flex items-center gap-2.5 transition-all text-left ${
                currentStep === "report"
                  ? "text-emerald-700 font-bold"
                  : report
                    ? "text-slate-700 hover:text-emerald-700"
                    : "text-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === "report"
                  ? "bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100"
                  : report
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}>
                3
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold leading-tight">Hasil Laporan &amp; PDF</div>
                <div className="text-[10px] text-slate-400">Pratinjau &amp; Ekspor A4</div>
              </div>
            </button>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: FORM DETAIL KEGIATAN */}
          {currentStep === "details" && !isGenerating && (
            <motion.div
              key="step-details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              
              {/* Profile & Signature Card */}
              <ProfileSignatureCard 
                inputs={inputs}
                setInputs={setInputs}
                onApplyProfile={handleApplyProfile}
              />

              {/* Form Input Detail Kegiatan */}
              <form onSubmit={handleProceedToPhotos} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
                
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-800">Detail Kegiatan &amp; Penugasan Lapangan</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Isi rincian penugasan Anda. Setelah selesai, Anda langsung diarahkan untuk mengisi foto dokumentasi.</p>
                </div>

                {errorStatus && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-800 rounded-lg">
                    {errorStatus}
                  </div>
                )}

                {/* Metadata Pegawai */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Nama Pegawai (Lengkap + Gelar)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Andi Pratama, S.Si., M.T."
                      value={inputs.nama}
                      onChange={(e) => setInputs({ ...inputs, nama: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      NIP Pegawai
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 19940315 201804 1 002"
                      value={inputs.nip}
                      onChange={(e) => setInputs({ ...inputs, nip: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Jabatan Pelapor <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Pendamping Sosial PKH / Pranata Komputer"
                        value={inputs.jabatan}
                        onChange={(e) => setInputs({ ...inputs, jabatan: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/50 font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Unit Kerja
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Balai Besar Perlindungan dan Jaminan Sosial"
                      value={inputs.unitKerja}
                      onChange={(e) => setInputs({ ...inputs, unitKerja: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Tempat Pembuatan Laporan
                    </label>
                    <div className="relative">
                      <MapPin className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Jakarta"
                        value={inputs.tempatPembuatan}
                        onChange={(e) => setInputs({ ...inputs, tempatPembuatan: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Tanggal Tanda Tangan
                    </label>
                    <div className="relative">
                      <Calendar className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Otomatis mengikuti tanggal pelaksanaan"
                        value={inputs.tanggalPembuatan}
                        onChange={(e) => setInputs({ ...inputs, tanggalPembuatan: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                {/* ASISTEN PKH RHK PILIHAN CEPAT */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Asisten Pilihan Cepat RHK PKH Harian
                    </h4>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      RHK 1 - 9
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Klik nomor RHK di bawah untuk memilih Rencana Hasil Kerja dan pilihan Rencana Aksi secara otomatis:
                  </p>

                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                    {PKH_RHK_OPTIONS.map((opt) => {
                      const isSelected = activePkhRhkId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setActivePkhRhkId(opt.id);
                            setInputs(prev => ({
                              ...prev,
                              rhkUtama: opt.rhkUtama,
                              rencanaAksi: opt.rencanaAksiOptions[0] || ""
                            }));
                          }}
                          className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-105"
                              : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                          }`}
                        >
                          RHK {opt.id}
                        </button>
                      );
                    })}
                  </div>

                  {activePkhRhkId !== null && (
                    <div className="space-y-3 pt-3 border-t border-emerald-200/60">
                      <div className="space-y-1.5">
                        <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Pilihan Rencana Aksi Terkait (RHK {activePkhRhkId}):
                        </span>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
                                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                                  isSelectedAction
                                    ? "bg-emerald-100 text-emerald-950 border-emerald-400 font-semibold shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <div className={`mt-0.5 w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                                  isSelectedAction 
                                    ? "border-emerald-600 bg-emerald-600 text-white" 
                                    : "border-slate-300 bg-white"
                                }`}>
                                  {isSelectedAction && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className="leading-relaxed">{rencAction}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RHK & Rencana Aksi Inputs */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Rencana Hasil Kerja (RHK) Utama <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Contoh: Terlaksananya monitoring, evaluasi, dan pengawalan penyaluran Bantuan Sosial PKH..."
                    value={inputs.rhkUtama}
                    onChange={(e) => setInputs({ ...inputs, rhkUtama: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Pilihan Rencana Aksi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Contoh: Melakukan monitoring dan fasilitasi kelancaran penyaluran bantuan sosial Program Keluarga Harapan..."
                    value={inputs.rencanaAksi}
                    onChange={(e) => setInputs({ ...inputs, rencanaAksi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-emerald-50/20 font-medium text-emerald-950"
                  />
                </div>

                {/* Waktu, Tempat, Pihak Terlibat Grid */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                  
                  {/* Tanggal Kalender */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Waktu Pelaksanaan Kegiatan <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mulai Kegiatan:</span>
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
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 text-xs bg-white text-slate-700 shadow-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Selesai (Opsional jika beberapa hari):</span>
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
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 text-xs bg-white text-slate-700 shadow-xs"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Senin, 31 Agustus 2026 atau Senin s.d. Jumat, 01 - 05 September 2026"
                      value={inputs.waktuPelaksanaan}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInputs({ 
                          ...inputs, 
                          waktuPelaksanaan: val,
                          tanggalPembuatan: extractFormalDateForSignature(val)
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:border-emerald-500 text-xs font-semibold text-emerald-950 bg-white shadow-xs"
                    />
                  </div>

                  {/* Tempat & Pihak Terlibat */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        Tempat Pelaksanaan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Balai Desa Kadilangu dan E-Warong PKH"
                        value={inputs.tempatPelaksanaan}
                        onChange={(e) => setInputs({ ...inputs, tempatPelaksanaan: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 text-xs shadow-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Pihak yang Terlibat / Ditemui <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Keluarga Penerima Manfaat (KPM), Aparat Desa, Agen Bank"
                        value={inputs.pihakTerlibat}
                        onChange={(e) => setInputs({ ...inputs, pihakTerlibat: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 text-xs shadow-xs bg-white"
                      />
                    </div>
                  </div>

                </div>

                {/* Ringkasan Aktivitas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Ringkasan Catatan Kegiatan Lapangan <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Tuliskan poin-poin aktivitas nyata yang Anda lakukan di lapangan. Sistem akan menyusunnya menjadi laporan naratif dinas yang utuh dan profesional.
                  </p>
                  <textarea
                    required
                    rows={4}
                    placeholder="Contoh:
- Melakukan pengecekan langsung ke lokasi agen bank terkait saldo bantuan PKH
- Memberikan sosialisasi cara penarikan bansos mandiri
- Membantu KPM yang mengalami KKS terblokir
- Mencatat hasil kehadiran dan rekapitulasi data"
                    value={inputs.ringkasanKegiatan}
                    onChange={(e) => setInputs({ ...inputs, ringkasanKegiatan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/50"
                  />
                </div>

                {/* Kop Surat & Surat Tugas Accordion / Settings */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                    <FileSignature className="w-4 h-4 text-emerald-600" />
                    Kop Surat &amp; Surat Tugas
                  </h3>

                  {/* Kop Surat Tipe */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Pilihan Kop Surat Resmi
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "kemensos", label: "Kemensos RI (Preset)" },
                        { value: "kustom", label: "Kop Kustom" },
                        { value: "none", label: "Tanpa Kop" }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setInputs({ ...inputs, kopTipe: opt.value })}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                            inputs.kopTipe === opt.value
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {inputs.kopTipe === "kustom" && (
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                          Kementerian / Lembaga / Pemda
                        </label>
                        <input
                          type="text"
                          placeholder="KEMENTERIAN SOSIAL REPUBLIK INDONESIA"
                          value={inputs.kopKementerian || ""}
                          onChange={(e) => setInputs({ ...inputs, kopKementerian: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Unit Eselon I</label>
                          <input
                            type="text"
                            placeholder="DIREKTORAT JENDERAL..."
                            value={inputs.kopEselon1 || ""}
                            onChange={(e) => setInputs({ ...inputs, kopEselon1: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Unit Eselon II</label>
                          <input
                            type="text"
                            placeholder="DIREKTORAT..."
                            value={inputs.kopEselon2 || ""}
                            onChange={(e) => setInputs({ ...inputs, kopEselon2: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Alamat &amp; Kontak</label>
                        <input
                          type="text"
                          placeholder="Jl. Salemba Raya No. 28 Jakarta Pusat"
                          value={inputs.kopAlamat || ""}
                          onChange={(e) => setInputs({ ...inputs, kopAlamat: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Surat Tugas Toggle */}
                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Surat Tugas Resmi</span>
                      <span className="text-[10px] text-slate-400">Aktifkan jika penugasan memiliki nomor surat tugas khusus</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInputs({ ...inputs, hasSuratTugas: !inputs.hasSuratTugas })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all shadow-xs ${
                        inputs.hasSuratTugas
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      {inputs.hasSuratTugas ? "Aktif" : "Non-Aktif"}
                    </button>
                  </div>

                  {inputs.hasSuratTugas && (
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nomor Surat Tugas</label>
                          <input
                            type="text"
                            placeholder="ST-556/Dit.JS/VI/2026"
                            value={inputs.suratTugasNomor || ""}
                            onChange={(e) => setInputs({ ...inputs, suratTugasNomor: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Pemberi Tugas</label>
                          <input
                            type="text"
                            placeholder="Direktur Jaminan Sosial"
                            value={inputs.suratTugasPemberi || ""}
                            onChange={(e) => setInputs({ ...inputs, suratTugasPemberi: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Primary Button to Step 2 */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Lanjut ke Foto Dokumentasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </form>
            </motion.div>
          )}

          {/* STEP 2: FOTO DOKUMENTASI KEGIATAN */}
          {currentStep === "photos" && !isGenerating && (
            <motion.div
              key="step-photos"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
                
                <div className="border-b border-slate-100 pb-4 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-emerald-600" />
                      Dokumentasi Foto Kegiatan Lapangan
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Unggah foto bukti pelaksanaan kegiatan. Foto akan otomatis disusun pada lembar lampiran resmi A4 (maksimal 2 foto per halaman dengan margin rapi).
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                    {photos.length} Foto Ditambahkan
                  </span>
                </div>

                {/* Dropzone Upload */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("step2-photo-input")?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
                    isDragging 
                      ? "border-emerald-600 bg-emerald-50/70 scale-101" 
                      : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50/80 bg-slate-50/40"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="step2-photo-input"
                    onChange={handleFileChange}
                  />
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Klik untuk memilih berkas foto atau tarik foto kemari
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Mendukung berkas gambar JPG, JPEG, PNG (bisa pilih banyak foto sekaligus)
                  </p>
                </div>

                {/* List of Uploaded Photos */}
                {photos.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600 border-b border-slate-100 pb-2">
                      <span>DAFTAR FOTO TERLAMPIR ({photos.length})</span>
                      <button 
                        type="button" 
                        onClick={() => setPhotos([])} 
                        className="text-red-500 hover:underline text-xs cursor-pointer"
                      >
                        Hapus Semua Foto
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {photos.map((p, i) => (
                        <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-3 items-start relative hover:shadow-xs transition-shadow">
                          <img
                            src={p.base64Data}
                            alt={p.fileName}
                            className="w-20 h-20 object-cover rounded-lg shrink-0 border border-slate-200 bg-white"
                          />
                          <div className="flex-1 space-y-1.5 pr-6">
                            <div className="text-[11px] font-bold text-slate-700 truncate">
                              Foto {i + 1}: {p.fileName}
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold uppercase text-slate-400 block mb-0.5">Keterangan Foto:</label>
                              <input
                                type="text"
                                value={p.caption}
                                placeholder="Masukkan keterangan foto..."
                                onChange={(e) => handleUpdateCaption(p.id, e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 focus:border-emerald-500 rounded-lg text-xs bg-white text-slate-800"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            title="Hapus foto ini"
                            onClick={() => handleDeletePhoto(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white absolute right-2 top-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Navigation Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep("details")}
                    className="w-full sm:w-auto px-5 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Detail Kegiatan</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{report ? "Perbarui & Tampilkan Laporan" : "Buat & Tampilkan Laporan (PDF / A4)"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* LOADING STATE DURING GENERATION */}
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

              <h2 className="text-base font-bold text-slate-800 mb-1">Menyusun Laporan &amp; Format PDF...</h2>
              <p className="text-xs text-slate-400 mb-6">Menerapkan format A4 baku dan dasar hukum yang berlaku.</p>
              
              <div className="text-left space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${genStep >= 1 ? "bg-emerald-500 text-white" : "border border-slate-300"}`}>
                    {genStep >= 1 ? "✓" : ""}
                  </div>
                  <span className={genStep >= 1 ? "font-semibold text-emerald-800" : "text-slate-400"}>
                    Memproses detail kegiatan &amp; peran jabatan
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${genStep >= 2 ? "bg-emerald-500 text-white" : "border border-slate-300"}`}>
                    {genStep >= 2 ? "✓" : ""}
                  </div>
                  <span className={genStep >= 2 ? "font-semibold text-emerald-800" : "text-slate-400"}>
                    Menerapkan Dasar Hukum Kesejahteraan Sosial &amp; PKH
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${genStep >= 3 ? "bg-emerald-500 text-white" : "border border-slate-300"}`}>
                    {genStep >= 3 ? "✓" : ""}
                  </div>
                  <span className={genStep >= 3 ? "font-semibold text-emerald-800" : "text-slate-400"}>
                    Menyusun narasi laporan pelaksanaan &amp; capaian
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${genStep >= 4 ? "bg-emerald-500 text-white" : "border border-slate-300"}`}>
                    {genStep >= 4 ? "✓" : ""}
                  </div>
                  <span className={genStep >= 4 ? "font-semibold text-emerald-800" : "text-slate-400"}>
                    Menyinkronkan lembar A4 &amp; lampiran foto
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: HASIL LAPORAN & EKSPOR (BERSIH TANPA EDIT-EDIT BAB) */}
          {currentStep === "report" && report && !isGenerating && (
            <motion.div
              key="step-report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 max-w-5xl mx-auto"
            >
              
              {/* Clean Action Bar at Top */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-wrap justify-between items-center gap-4 no-print select-none">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Laporan RHK Siap Unduh &amp; Cetak
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {report.jabatan} • {report.waktuPelaksanaan} • {photos.length} Foto Lampiran
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => exportToWord(report, photos)}
                    title="Unduh berkas Microsoft Word (.docx)"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>Unduh Word (.docx)</span>
                  </button>

                  <button
                    onClick={handleDirectPdfDownload}
                    disabled={isPdfDownloading}
                    title="Unduh berkas PDF (.pdf) dengan margin halaman A4 rapi tanpa terpotong"
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
                    title="Cetak langsung ke printer atau Simpan sebagai PDF"
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Printer className="w-4 h-4 shrink-0 text-slate-600" />
                    <span>Cetak / Print</span>
                  </button>

                  <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                  <button
                    onClick={() => setCurrentStep("photos")}
                    title="Tambah atau kelola foto kegiatan"
                    className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ubah Foto</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep("details")}
                    title="Ubah detail kegiatan"
                    className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ubah Data</span>
                  </button>
                </div>
              </div>

              {/* Full Width Dedicated A4 Preview */}
              <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-900">
                <div className="flex justify-between items-center text-slate-300 uppercase tracking-widest text-[10px] font-bold mb-4 border-b border-slate-700/60 pb-2.5 no-print">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Pratinjau Lembar Dokumen A4 Resmi
                  </span>
                  <span className="bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded text-[9px]">
                    Margin Baku 2.5cm
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden shadow-2xl">
                  <A4Preview data={report} photos={photos} />
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Styled Micro-Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 no-print">
        <p className="font-semibold text-slate-600">Laporan SKP RHK ASN — Republik Indonesia</p>
        <p className="text-[11px] mt-1 text-slate-400">Aplikasi penyusunan draf fungsional terpadu didukung model AI dan ekspor PDF A4 presisi.</p>
      </footer>

    </div>
  );
}
