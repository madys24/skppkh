import React from "react";
import { ReportData, PhotoAttachment } from "../types";
import { formatJudulLaporan } from "../utils/dateFormatter";

interface A4PreviewProps {
  data: ReportData;
  photos: PhotoAttachment[];
}

export const A4Preview: React.FC<A4PreviewProps> = ({ data, photos }) => {
  return (
    <div className="relative mx-auto bg-slate-100 p-2 sm:p-6 md:p-8 rounded-xl shadow-inner max-w-full overflow-x-auto">
      {/* Help Alert */}
      <div className="mb-4 bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 p-3 text-xs rounded shadow-sm no-print">
        <p className="font-semibold mb-1">💡 Petunjuk Cetak PDF:</p>
        <p>Gunakan tombol cetak di atas. Di jendela print browser Anda, atur <strong>Tujuan (Destination)</strong> ke <strong>Save as PDF (Simpan ke PDF)</strong>, hilangkan centang Header & Footer, dan centang "Gambar Latar (Background Graphics)" agar gambar dokumentasi tercetak bersih.</p>
      </div>

      {/* Styled A4 page mimicking high-quality Indonesian Civil Service Report */}
      <div 
        id="print-area" 
        className={`mx-auto bg-white shadow-2xl w-[210mm] min-h-[297mm] text-[11pt] leading-relaxed text-gray-900 border border-gray-200 antialiased font-serif print:shadow-none print:border-none ${
          data.kopTipe && data.kopTipe !== "none" ? "p-[2cm_3cm_3cm_3cm]" : "p-[4cm_3cm_3cm_3cm]"
        }`}
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* Letterhead (Kop Surat) if configured */}
        {data.kopTipe && data.kopTipe !== "none" && (
          <div className="flex items-center text-center pb-3 border-b-4 border-double border-black mb-8 select-none">
            {/* Logo area */}
            <div className="flex-shrink-0 mr-4">
              {data.kopTipe === "kemensos" ? (
                <img 
                  src="/logo-kemensos.svg" 
                  alt="Logo Kementerian Sosial RI" 
                  className="w-20 h-20 object-contain" 
                />
              ) : (
                /* Custom generic emblem logo */
                <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 15 L20 30 L20 60 C 20 80, 50 90, 50 90 C 50 90, 80 80, 80 60 L80 30 Z" fill="#1e293b" />
                  <path d="M50 20 L25 33 L25 58 C 25 75, 50 84, 50 84 C 50 84, 75 75, 75 58 L75 33 Z" fill="#f8fafc" />
                  <polygon points="50,30 55,42 68,42 58,50 62,62 50,54 38,62 42,50 32,42 45,42" fill="#ca8a04" />
                </svg>
              )}
            </div>

            {/* Letterhead text information */}
            <div className="flex-grow text-center text-black">
              <h3 className="text-[12pt] font-bold uppercase leading-tight select-all">
                {data.kopTipe === "kemensos" 
                  ? "KEMENTERIAN SOSIAL REPUBLIK INDONESIA" 
                  : (data.kopKementerian || "INSTANSI / KEMENTERIAN KUSTOM")}
              </h3>
              {(data.kopTipe === "kemensos" || data.kopEselon1) && (
                <h4 className="text-[11pt] font-semibold uppercase leading-tight tracking-tight select-all">
                  {data.kopTipe === "kemensos" 
                    ? "DIREKTORAT JENDERAL PERLINDUNGAN DAN JAMINAN SOSIAL" 
                    : data.kopEselon1}
                </h4>
              )}
              {(data.kopTipe === "kemensos" || data.kopEselon2) && (
                <h5 className="text-[10pt] font-semibold uppercase leading-tight tracking-wide select-all">
                  {data.kopTipe === "kemensos" 
                    ? "DIREKTORAT PERLINDUNGAN SOSIAL NON KEBENCANAAN" 
                    : data.kopEselon2}
                </h5>
              )}
              <p className="text-[8.5pt] leading-tight mt-1.5 select-all" style={{ fontFamily: "Arial, sans-serif" }}>
                {data.kopTipe === "kemensos" 
                  ? "Jl. Salemba Raya No. 28 Jakarta Pusat 10430 Telp. (021) 3103591 http://www.kemsos.go.id" 
                  : [data.kopAlamat, data.kopTelepon ? `Telp. ${data.kopTelepon}` : "", data.kopWebsite].filter(Boolean).join(" ")}
              </p>
            </div>
          </div>
        )}

        {/* Header / Title */}
        <div className="text-center mb-8 select-all">
          <h1 className="text-[14pt] font-bold text-black uppercase tracking-wider leading-tight">
            LAPORAN
          </h1>
          <p className="text-[12pt] font-bold text-black uppercase tracking-wide my-1">
            TENTANG
          </p>
          <h2 className="text-[13pt] font-bold text-black uppercase tracking-wide leading-snug">
            {formatJudulLaporan(data.rencanaAksi)}
          </h2>
          {(!data.kopTipe || data.kopTipe === "none") && (
            <div className="w-full border-b-[2px] border-black mt-3 mb-6"></div>
          )}
        </div>

        {/* A. PENDAHULUAN */}
        <div className="mb-6">
          <h3 className="text-[12pt] font-bold text-black uppercase mb-3">A. PENDAHULUAN</h3>
          
          <div className="space-y-4 text-justify pl-4">
            <div>
              <p className="font-bold mb-1">1. Umum</p>
              <p className="whitespace-pre-line text-gray-800 leading-relaxed font-normal">{data.pendahuluan.umum || "-"}</p>
            </div>
            
            <div>
              <p className="font-bold mb-1">2. Maksud dan Tujuan</p>
              <p className="whitespace-pre-line text-gray-800 leading-relaxed font-normal">{data.pendahuluan.maksudDanTujuan || "-"}</p>
            </div>
            
            <div>
              <p className="font-bold mb-1">3. Ruang Lingkup</p>
              <p className="whitespace-pre-line text-gray-800 leading-relaxed font-normal">{data.pendahuluan.ruangLingkup || "-"}</p>
            </div>
            
            <div>
              <p className="font-bold mb-1">4. Dasar</p>
              <p className="whitespace-pre-line text-gray-800 leading-relaxed font-normal mb-2">{data.pendahuluan.dasar || "-"}</p>
            </div>
          </div>
        </div>

        {/* B. KEGIATAN YANG DILAKSANAKAN */}
        <div className="mb-6 block-break">
          <h3 className="text-[12pt] font-bold text-black uppercase mb-2">B. KEGIATAN YANG DILAKSANAKAN</h3>
          <div className="pl-4 text-justify">
            <p className="whitespace-pre-line text-gray-800 leading-relaxed font-normal">{data.kegiatanLaksana || "-"}</p>
          </div>
        </div>

        {/* C. HASIL YANG DICAPAI */}
        <div className="mb-6 block-break">
          <h3 className="text-[12pt] font-bold text-black uppercase mb-2">C. HASIL YANG DICAPAI</h3>
          <div className="pl-4 text-justify">
            <p className="whitespace-pre-line text-gray-800 leading-relaxed font-normal">{data.hasilDicapai || "-"}</p>
          </div>
        </div>

        {/* D. SIMPULAN DAN SARAN */}
        <div className="mb-6 block-break">
          <h3 className="text-[12pt] font-bold text-black uppercase mb-3">D. SIMPULAN DAN SARAN</h3>
          
          <div className="space-y-4 text-justify pl-4">
            <div>
              <p className="font-bold mb-1">1. Kesimpulan</p>
              <p className="whitespace-pre-line text-gray-800 leading-relaxed font-normal">{data.simpulanDanSaran.kesimpulan || "-"}</p>
            </div>
            
            <div>
              <p className="font-bold mb-1">2. Saran</p>
              <p className="whitespace-pre-line text-gray-800 leading-relaxed font-normal">{data.simpulanDanSaran.saran || "-"}</p>
            </div>
          </div>
        </div>

        {/* E. PENUTUP */}
        <div className="mb-8 block-break">
          <h3 className="text-[12pt] font-bold text-black uppercase mb-2">E. PENUTUP</h3>
          <div className="pl-4 text-justify">
            <p className="whitespace-pre-line text-gray-800 leading-relaxed font-normal">{data.penutup || "-"}</p>
          </div>
        </div>

        {/* Signature Area Grid */}
        <div className="mt-12 block-break">
          <table className="w-full text-[11pt]">
            <tbody>
              <tr>
                <td className="w-[55%]"></td>
                <td className="w-[45%] text-left">
                  <p className="mb-1">
                    {data.tempatPembuatan || "Jakarta"}, {data.tanggalPembuatan || "15 Juni 2026"}
                  </p>
                  <p className="font-bold mb-1 uppercase tracking-wider text-xs">
                    {data.jabatan || "Pelapor"}
                  </p>
                  
                  {/* Digital / physical signature blank line box */}
                  <div className="relative h-[75px] w-[200px] flex items-center justify-start select-none">
                    {data.signatureData ? (
                      <img 
                        src={data.signatureData} 
                        alt="Tanda Tangan" 
                        className="max-h-[70px] max-w-[180px] object-contain print:brightness-95"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-[10px] italic text-slate-300 no-print flex items-center py-2">
                        [Bubuhi tanda tangan digital atau cetak untuk ttd basah]
                      </div>
                    )}
                  </div>
                  
                  <div className="h-[2px] w-[200px] border-b border-dashed border-gray-400 mb-2"></div>
                  
                  <p className="font-bold underline text-black uppercase">
                    {data.nama || "-"}
                  </p>
                  <p className="text-gray-700">
                    NIP. {data.nip || "-"}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Image Attachment (Halaman Berikutnya) */}
        {photos.length > 0 && (
          <div className="page-break" style={{ pageBreakBefore: "always" }}>
            {/* Divider element on screen, is page break during actual print */}
            <div className="h-[2px] w-full border-b-2 border-dashed border-slate-300 my-8 no-print"></div>
            
            <div className="text-center pt-8 mb-6">
              <h3 className="text-[14pt] font-bold text-black uppercase tracking-wide leading-snug">
                LAMPIRAN: DOKUMENTASI FOTO KEGIATAN
              </h3>
              <div className="w-[100px] border-b-2 border-black mx-auto mt-2 mb-6"></div>
            </div>

            <div className="space-y-8">
              {photos.map((photo, i) => (
                <div key={photo.id || i} className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg max-w-full block-break bg-slate-50">
                  <img 
                    src={photo.base64Data} 
                    alt={photo.caption || photo.fileName} 
                    className="max-h-[350px] max-w-full rounded object-contain shadow-sm bg-white"
                  />
                  <p className="mt-3 text-[10pt] italic font-sans text-gray-700 text-center max-w-[80%]">
                    <strong>Foto {i + 1}:</strong> {photo.caption || photo.fileName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Embedded print stylesheet to handle actual browser print overrides */}
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
          
          /* Hide non-print dashboard elements */
          nav, footer, button, .no-print, header, aside, .floating-actions {
            display: none !important;
          }
          
          /* Make sure ancestors don't clip */
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
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 2.5cm 2.5cm 2.5cm 2.5cm !important;
            box-shadow: none !important;
            border: none !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 11pt !important;
            line-height: 1.6 !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }

          .page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
          .block-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          p, h1, h2, h3, h4, table, tr, img {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};
