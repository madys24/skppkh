import React from "react";
import { ReportData, PhotoAttachment } from "../types";
import { formatJudulLaporan, getReportFileName, extractFormalDateForSignature } from "../utils/dateFormatter";

interface A4PreviewProps {
  data: ReportData;
  photos: PhotoAttachment[];
}

export const A4Preview: React.FC<A4PreviewProps> = ({ data, photos }) => {
  // Helper to render text into distinct formatted paragraphs
  const renderParagraphs = (rawText: string, indent = true) => {
    if (!rawText || !rawText.trim()) {
      return <p className="text-gray-800 leading-relaxed font-normal">-</p>;
    }
    const paragraphs = rawText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    return paragraphs.map((p, idx) => (
      <p
        key={idx}
        className={`text-gray-800 leading-relaxed font-normal mb-2.5 text-justify ${
          indent ? "indent-8" : ""
        }`}
        style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
      >
        {p}
      </p>
    ));
  };

  const signatureDate = extractFormalDateForSignature(data.waktuPelaksanaan, data.tanggalPembuatan);

  return (
    <div className="relative mx-auto bg-slate-100 p-2 sm:p-6 md:p-8 rounded-xl shadow-inner max-w-full overflow-x-auto">
      {/* Help Alert */}
      <div className="mb-4 bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 p-3.5 text-xs rounded-xl shadow-xs no-print">
        <p className="font-bold mb-1 flex items-center gap-1.5 text-emerald-800">
          <span>💡</span> Format Ekspor Dokumen Laporan:
        </p>
        <p className="text-emerald-800/90 leading-relaxed">
          Nama berkas otomatis: <code className="bg-emerald-100 text-emerald-950 font-bold px-1.5 py-0.5 rounded text-[11px] font-mono">{getReportFileName(data)}</code>. Anda dapat mengklik <strong>Unduh Word (.docx)</strong> untuk format Word, atau <strong>Unduh PDF (.pdf)</strong> untuk mengunduh berkas PDF dengan margin halaman A4 rapi, atau <strong>Cetak / Print</strong> untuk pratinjau printer.
        </p>
      </div>

      {/* Styled A4 page container */}
      <div 
        id="print-area" 
        className="mx-auto bg-white shadow-2xl w-[210mm] min-h-[297mm] text-[11pt] leading-relaxed text-gray-900 border border-gray-200 antialiased font-serif print:shadow-none print:border-none p-[2.5cm_2.0cm_2.5cm_2.5cm]"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* Letterhead (Kop Surat) */}
        {data.kopTipe && data.kopTipe !== "none" && (
          <div className="flex items-center text-center pb-3 border-b-4 border-double border-black mb-6 select-none print:mb-4" style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}>
            {/* Logo */}
            <div className="flex-shrink-0 mr-4">
              {data.kopTipe === "kemensos" ? (
                <img 
                  src="/logo-kemensos.svg" 
                  alt="Logo Kementerian Sosial RI" 
                  className="w-20 h-20 object-contain" 
                />
              ) : (
                <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 15 L20 30 L20 60 C 20 80, 50 90, 50 90 C 50 90, 80 80, 80 60 L80 30 Z" fill="#1e293b" />
                  <path d="M50 20 L25 33 L25 58 C 25 75, 50 84, 50 84 C 50 84, 75 75, 75 58 L75 33 Z" fill="#f8fafc" />
                  <polygon points="50,30 55,42 68,42 58,50 62,62 50,54 38,62 42,50 32,42 45,42" fill="#ca8a04" />
                </svg>
              )}
            </div>

            {/* Letterhead text */}
            <div className="flex-grow text-center text-black">
              <h3 className="text-[12pt] font-bold uppercase leading-tight select-all">
                {data.kopTipe === "kemensos" 
                  ? "KEMENTERIAN SOSIAL REPUBLIK INDONESIA" 
                  : (data.kopKementerian || "INSTANSI / KEMENTERIAN KUSTOM")}
              </h3>
              {(data.kopTipe === "kemensos" || data.kopEselon1) && (
                <h4 className="text-[11pt] font-semibold uppercase leading-tight tracking-tight select-all mt-0.5">
                  {data.kopTipe === "kemensos" 
                    ? "DIREKTORAT JENDERAL PERLINDUNGAN DAN JAMINAN SOSIAL" 
                    : data.kopEselon1}
                </h4>
              )}
              {(data.kopTipe === "kemensos" || data.kopEselon2) && (
                <h5 className="text-[10pt] font-semibold uppercase leading-tight tracking-wide select-all mt-0.5">
                  {data.kopTipe === "kemensos" 
                    ? "DIREKTORAT PERLINDUNGAN SOSIAL NON KEBENCANAAN" 
                    : data.kopEselon2}
                </h5>
              )}
              <p className="text-[8pt] leading-tight mt-1 select-all" style={{ fontFamily: "Arial, sans-serif" }}>
                {data.kopTipe === "kemensos" 
                  ? "Jl. Salemba Raya No. 28 Jakarta Pusat 10430 Telp. (021) 3103591 http://www.kemsos.go.id" 
                  : [data.kopAlamat, data.kopTelepon ? `Telp. ${data.kopTelepon}` : "", data.kopWebsite].filter(Boolean).join(" ")}
              </p>
            </div>
          </div>
        )}

        {/* Header / Title */}
        <div className="text-center mb-6 select-all" style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}>
          <h1 className="text-[14pt] font-bold text-black uppercase tracking-wider leading-tight">
            LAPORAN
          </h1>
          <p className="text-[11.5pt] font-bold text-black uppercase tracking-wide my-1">
            TENTANG
          </p>
          <h2 className="text-[12.5pt] font-bold text-black uppercase tracking-wide leading-snug">
            {formatJudulLaporan(data.rencanaAksi)}
          </h2>
          {(!data.kopTipe || data.kopTipe === "none") && (
            <div className="w-full border-b-[2px] border-black mt-3 mb-5"></div>
          )}
        </div>

        {/* A. PENDAHULUAN */}
        <div className="mb-5">
          <h3 className="text-[11.5pt] font-bold text-black uppercase mb-2" style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}>
            A. PENDAHULUAN
          </h3>
          
          <div className="space-y-3 pl-4">
            <div style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
              <p className="font-bold mb-1 text-[10.5pt]">1. Umum</p>
              {renderParagraphs(data.pendahuluan.umum)}
            </div>
            
            <div style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
              <p className="font-bold mb-1 text-[10.5pt]">2. Maksud dan Tujuan</p>
              {renderParagraphs(data.pendahuluan.maksudDanTujuan)}
            </div>
            
            <div style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
              <p className="font-bold mb-1 text-[10.5pt]">3. Ruang Lingkup</p>
              {renderParagraphs(data.pendahuluan.ruangLingkup)}
            </div>
            
            <div style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
              <p className="font-bold mb-1 text-[10.5pt]">4. Dasar</p>
              {renderParagraphs(data.pendahuluan.dasar, false)}
            </div>
          </div>
        </div>

        {/* B. KEGIATAN YANG DILAKSANAKAN */}
        <div className="mb-5">
          <h3 className="text-[11.5pt] font-bold text-black uppercase mb-2" style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}>
            B. KEGIATAN YANG DILAKSANAKAN
          </h3>
          <div className="pl-4">
            {renderParagraphs(data.kegiatanLaksana)}
          </div>
        </div>

        {/* C. HASIL YANG DICAPAI */}
        <div className="mb-5">
          <h3 className="text-[11.5pt] font-bold text-black uppercase mb-2" style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}>
            C. HASIL YANG DICAPAI
          </h3>
          <div className="pl-4">
            {renderParagraphs(data.hasilDicapai)}
          </div>
        </div>

        {/* D. SIMPULAN DAN SARAN */}
        <div className="mb-5">
          <h3 className="text-[11.5pt] font-bold text-black uppercase mb-2" style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}>
            D. SIMPULAN DAN SARAN
          </h3>
          
          <div className="space-y-3 pl-4">
            <div style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
              <p className="font-bold mb-1 text-[10.5pt]">1. Kesimpulan</p>
              {renderParagraphs(data.simpulanDanSaran.kesimpulan)}
            </div>
            
            <div style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
              <p className="font-bold mb-1 text-[10.5pt]">2. Saran</p>
              {renderParagraphs(data.simpulanDanSaran.saran)}
            </div>
          </div>
        </div>

        {/* E. PENUTUP */}
        <div className="mb-6">
          <h3 className="text-[11.5pt] font-bold text-black uppercase mb-2" style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}>
            E. PENUTUP
          </h3>
          <div className="pl-4">
            {renderParagraphs(data.penutup)}
          </div>
        </div>

        {/* Signature Area */}
        <div className="mt-8" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
          <table className="w-full text-[10.5pt]">
            <tbody>
              <tr>
                <td className="w-[50%]"></td>
                <td className="w-[50%] text-left">
                  <p className="mb-1">
                    {data.tempatPembuatan || "Jakarta"}, {signatureDate}
                  </p>
                  <p className="font-bold mb-1 uppercase tracking-wider text-xs">
                    {data.jabatan || "Pelapor"}
                  </p>
                  
                  <div className="relative h-[70px] w-[200px] flex items-center justify-start select-none">
                    {data.signatureData ? (
                      <img 
                        src={data.signatureData} 
                        alt="Tanda Tangan" 
                        className="max-h-[65px] max-w-[180px] object-contain print:brightness-95"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-[10px] italic text-slate-300 no-print flex items-center py-2">
                        [Bubuhi tanda tangan digital atau ttd basah]
                      </div>
                    )}
                  </div>
                  
                  <div className="h-[1.5px] w-[200px] border-b border-black mb-1.5"></div>
                  
                  <p className="font-bold underline text-black uppercase">
                    {data.nama || "-"}
                  </p>
                  <p className="text-gray-700 text-xs">
                    NIP. {data.nip || "-"}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Image Attachment (Halaman Berikutnya) */}
        {photos.length > 0 && (
          <div className="page-break" style={{ pageBreakBefore: "always", breakBefore: "page" }}>
            <div className="h-[2px] w-full border-b-2 border-dashed border-slate-300 my-8 no-print"></div>
            
            <div className="text-center pt-8 mb-6" style={{ breakAfter: "avoid", pageBreakAfter: "avoid" }}>
              <h3 className="text-[13pt] font-bold text-black uppercase tracking-wide leading-snug">
                LAMPIRAN: DOKUMENTASI FOTO KEGIATAN
              </h3>
              <div className="w-[100px] border-b-2 border-black mx-auto mt-2 mb-6"></div>
            </div>

            <div className="space-y-6">
              {photos.map((photo, i) => (
                <div key={photo.id || i} className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg max-w-full bg-slate-50" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                  <img 
                    src={photo.base64Data} 
                    alt={photo.caption || photo.fileName} 
                    className="max-h-[320px] max-w-full rounded object-contain shadow-sm bg-white"
                  />
                  <p className="mt-2.5 text-[9.5pt] italic font-sans text-gray-700 text-center max-w-[85%]">
                    <strong>Foto {i + 1}:</strong> {photo.caption || photo.fileName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Embedded print stylesheet */}
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
          }
          
          nav, footer, button, .no-print, header, aside, .floating-actions {
            display: none !important;
          }
          
          #root, main, .overflow-y-auto, .overflow-x-auto, .sticky, div {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            position: static !important;
          }

          body * {
            visibility: hidden;
          }

          #print-area, #print-area * {
            visibility: visible;
          }

          #print-area {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 11pt !important;
            line-height: 1.55 !important;
          }

          @page {
            size: A4 portrait;
            margin: 25mm 20mm 25mm 25mm !important;
          }

          .page-break {
            page-break-before: always !important;
            break-before: page !important;
          }

          h1, h2, h3, h4, h5, .section-title, .sub-item-title {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          p, .sub-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            orphans: 3 !important;
            widows: 3 !important;
          }
        }
      `}</style>
    </div>
  );
};
