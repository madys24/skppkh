export interface ReportPendahuluan {
  umum: string;
  maksudDanTujuan: string;
  ruangLingkup: string;
  dasar: string;
}

export interface ReportSimpulanDanSaran {
  kesimpulan: string;
  saran: string;
}

export interface ReportData {
  nama: string;
  nip: string;
  jabatan: string;
  unitKerja: string;
  rhkUtama: string;
  ringkasanKegiatan: string;
  targetWaktu: string;
  peranInstansi: string;
  tempatPembuatan: string;
  tanggalPembuatan: string;
  
  // Signature data base64
  signatureData?: string;
  
  // Focused narrative constraint inputs
  rencanaAksi: string;
  waktuPelaksanaan: string;
  tempatPelaksanaan: string;
  pihakTerlibat: string;
  
  // Letterhead configuration (Kop Surat)
  kopTipe?: string; // "none" | "kemensos" | "kustom"
  kopKementerian?: string;
  kopEselon1?: string;
  kopEselon2?: string;
  kopAlamat?: string;
  kopTelepon?: string;
  kopWebsite?: string;

  // Assignment Letter (Surat Tugas)
  hasSuratTugas?: boolean;
  suratTugasNomor?: string;
  suratTugasPemberi?: string;
  suratTugasTanggal?: string;
  suratTugasPerihal?: string;

  // Clean generated contents
  pendahuluan: ReportPendahuluan;
  kegiatanLaksana: string;
  hasilDicapai: string;
  simpulanDanSaran: ReportSimpulanDanSaran;
  penutup: string;
}

export interface PhotoAttachment {
  id: string;
  base64Data: string; // "data:image/jpeg;base64,..."
  fileName: string;
  caption: string;
}

export interface GenerationInput {
  nama: string;
  nip: string;
  jabatan: string;
  unitKerja: string;
  rhkUtama: string;
  ringkasanKegiatan: string;
  targetWaktu: string;
  peranInstansi: string;
  tempatPembuatan: string;
  tanggalPembuatan: string;
  rencanaAksi: string;
  waktuPelaksanaan: string;
  tempatPelaksanaan: string;
  pihakTerlibat: string;
  
  // Signature data base64
  signatureData?: string;
  
  // Letterhead configuration (Kop Surat)
  kopTipe?: string;
  kopKementerian?: string;
  kopEselon1?: string;
  kopEselon2?: string;
  kopAlamat?: string;
  kopTelepon?: string;
  kopWebsite?: string;

  // Assignment Letter (Surat Tugas)
  hasSuratTugas?: boolean;
  suratTugasNomor?: string;
  suratTugasPemberi?: string;
  suratTugasTanggal?: string;
  suratTugasPerihal?: string;
}
