export interface PkhRhkOption {
  id: number;
  label: string;
  rhkUtama: string;
  rencanaAksiOptions: string[];
}

export const PKH_RHK_OPTIONS: PkhRhkOption[] = [
  {
    id: 1,
    label: "RHK 1: Monitoring Bansos",
    rhkUtama: "Terlaksananya monitoring, evaluasi, dan pengawalan penyaluran Bantuan Sosial PKH secara berkala guna memastikan prinsip 6T (Tepat Sasaran, Tepat Jumlah, Tepat Waktu, Tepat Kualitas, Tepat Harga, Tepat Administrasi) di wilayah kerja.",
    rencanaAksiOptions: [
      "Melakukan edukasi dan sosialisasi pencairan secara tunai dan non tunai",
      "Melaksanakan Supervisi Permasalahan Bantuan Sosial",
      "Melaksanakan Monitoring/ Pemantauan Penyaluran Bantuan Sosial",
      "Melaksanakan Penelitian penyaluran bantuan Sosial"
    ]
  },
  {
    id: 2,
    label: "RHK 2: Pertemuan P2K2",
    rhkUtama: "Terlaksananya Pertemuan Peningkatan Kemampuan Keluarga (P2K2 / Family Development Session) secara intensif bagi seluruh KPM PKH dampingan guna membentuk pemahaman kemandirian gizi, pengasuhan anak, dan manajemen ekonomi.",
    rencanaAksiOptions: [
      "Melaksanakan Pertemuan Peningkatan Kemampuan Keluarga (P2K2)"
    ]
  },
  {
    id: 3,
    label: "RHK 3: Verifikasi Komitmen",
    rhkUtama: "Terlaksananya verifikasi komitmen KPM PKH di bidang pendidikan (sekolah) dan kesehatan (fasilitas kesehatan/posyandu) demi memastikan keberlanjutan kepatuhan syarat bantuan.",
    rencanaAksiOptions: [
      "Melaksanakan Verifikasi Komitmen Pendidikan,Kesehatan dan Kesejahteraan Sosial",
      "Melakukan pendampingan, mediasi, dan fasilitasi kepada KPM PKH dalam proses perubahan perilaku, pola pikir yang mandiri dan produktif"
    ]
  },
  {
    id: 4,
    label: "RHK 4: Graduasi KPM",
    rhkUtama: "Terlaksananya identifikasi, motivasi, dan pendampingan KPM PKH menuju kelulusan mandiri (Graduasi Mandiri Sejahtera) bagi keluarga yang sudah mandiri secara ekonomi.",
    rencanaAksiOptions: [
      "Melakukan usulan KPM Graduasi mandiri dan Pemberdayaan PPSE"
    ]
  },
  {
    id: 5,
    label: "RHK 5: Pemutakhiran Data",
    rhkUtama: "Terlaksananya pemutakhiran data kepesertaan KPM PKH secara real-time guna menyerasikan perubahan status keluarga (meninggal, pindah, sekolah, melahirkan) pada database DTSEN.",
    rencanaAksiOptions: [
      "Melaksanakan Pemutakhiran Data",
      "Melaksanakan proses bisnis PKH yang meliputi verifikasi validasi calon penerima bantuan sosial"
    ]
  },
  {
    id: 6,
    label: "RHK 6: Pengaduan / Respon Kasus",
    rhkUtama: "Terfasilitasinya penyelesaian pengaduan, masalah teknis lapangan, dan kasus penyalahgunaan bansos dari KPM maupun masyarakat secara cepat, adil, dan akuntabel.",
    rencanaAksiOptions: [
      "Melaksanakan Respon Kasus/ Pengaduan/ Kebencanaan/ Kerentanan"
    ]
  },
  {
    id: 7,
    label: "RHK 7: Laporan Bulanan",
    rhkUtama: "Tersusunnya dokumen pelaporan bulanan kinerja Pendamping Sosial PKH secara akurat, sistematis, dan tepat waktu sebagai bukti akuntabilitas kinerja personal kepada Kementerian Sosial RI.",
    rencanaAksiOptions: [
      "Membuat laporan bulanan pelaksanaan PKH dan laporan lainnya."
    ]
  },
  {
    id: 8,
    label: "RHK 8: Koordinasi & Tugas Lainnya",
    rhkUtama: "Terlaksananya rapat koordinasi lintas sektor dengan instansi pemerintahan daerah dan penugasan kedinasan lain dari atasan demi kelancaran program jaminan sosial masyarakat.",
    rencanaAksiOptions: [
      "Melaksanakan Tindak Lanjut Hasil Pemeriksaan (TLHP)",
      "Melakukan sosialisasi kebijakan dan bisnis proses PKH kepada aparat pemerintah tingkat kecamatan, desa/ kelurahan, KPM PKH, dan masyarakat umum secara berkala melalui Pertemuan atau media sosial dll",
      "Mengikuti Rapat Koordinasi,Sosialisasi Kebijakan Proses Bisnis PKH dan Penguatan Kapasitas SDM.",
      "Tugas Lainnya (Penugasan lainnya program Kementerian Sosial)"
    ]
  },
  {
    id: 9,
    label: "RHK 9: Publikasi Medsos",
    rhkUtama: "Terlaksananya publikasi edukasi, cerita sukses KPM graduasi, dan berita positif pelaksanaan program jaminan perlindungan sosial melalui media sosial guna meningkatkan citra instansi.",
    rencanaAksiOptions: [
      "Berperan aktif dalam memanfaatkan, menggunakan, melibatkan dan menyebarkan Media Sosial untuk menyampaikan semua program di Kementerian Sosial"
    ]
  }
];

