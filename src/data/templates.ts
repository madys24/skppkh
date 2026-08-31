export interface JobTemplate {
  title: string;
  rhkUtama: string;
  ringkasanKegiatan: string;
  peranInstansi: string;
  unitKerja: string;
  rencanaAksi: string;
  waktuPelaksanaan?: string;
  tempatPelaksanaan: string;
  pihakTerlibat: string;
  kopTipe?: string;
}

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    title: "Pendamping PKH (RHK 1: Monitoring Bansos)",
    rhkUtama: "Terlaksananya monitoring, evaluasi, dan pengawalan penyaluran Bantuan Sosial PKH secara berkala guna memastikan prinsip 6T (Tepat Sasaran, Tepat Jumlah, Tepat Waktu, Tepat Kualitas, Tepat Harga, Tepat Administrasi) di wilayah kerja.",
    ringkasanKegiatan: "- Melakukan pengecekan langsung ke lokasi agen bank / ATM Himbara terdekat mengenai ketersediaan saldo bantuan sosial PKH KPM dampingan.\n- Melakukan edukasi serta sosialisasi kepada KPM terkait tata cara penarikan bansos mandiri tanpa perantara.\n- Membantu kendala KPM yang mengalami Kartu Keluarga Sejahtera (KKS) terblokir, rusak, hilang, atau PIN terganggu dengan mengkoordinasikannya ke koordinator kabupaten dan bank penyalur.\n- Melakukan pencatatan, pemetaan, dan rekapitulasi partisipasi kelayakan penarikan bansos KPM pada wilayah kerja dampingan.",
    peranInstansi: "Memastikan program jaminan perlindungan sosial nasional tersalurkan dengan akurasi tinggi dan bebas pungutan liar.",
    unitKerja: "Layanan Jaminan Sosial Kecamatan Baki",
    rencanaAksi: "Melakukan monitoring dan fasilitasi kelancaran penyaluran bantuan sosial Program Keluarga Harapan (PKH) tahap berjalan.",
    tempatPelaksanaan: "E-Warong, Agen Bank Himbara, dan Kantor Pos Wilayah Kecamatan Baki",
    pihakTerlibat: "Keluarga Penerima Manfaat (KPM), Aparat Desa setempat, dan petugas Himbara/Pos penyalur",
    kopTipe: "kemensos"
  },
  {
    title: "Pendamping PKH (RHK 2: Pertemuan P2K2)",
    rhkUtama: "Terlaksananya Pertemuan Peningkatan Kemampuan Keluarga (P2K2 / Family Development Session) secara intensif bagi seluruh KPM PKH dampingan guna membentuk pemahaman kemandirian gizi, pengasuhan anak, dan manajemen ekonomi.",
    ringkasanKegiatan: "- Menyiapkan alat peraga pembelajaran (flipchart, buku KIA, lembar kerja kelompok, video interaktif) sebelum pertemuan dimulai.\n- Memandu jalannya sesi diskusi interaktif P2K2 mengenai Modul Kesehatan dan Gizi sub-materi 'Pencegahan Stunting' di tingkat kelompok.\n- Melakukan tanya jawab interaktif dengan KPM mengenai asupan ASI eksklusif dan pemenuhan imunisasi lengkap anak balita.\n- Mengisi lembar presensi KPM, mencatat hasil komitmen praktik rumah tangga, serta mendokumentasikan foto kegiatan bersama sebagai bukti kehadiran (evidence).",
    peranInstansi: "Mendorong perubahan perilaku (behavioral change) KPM PKH ke arah hidup sehat, berpendidikan tinggi, dan mandiri secara finansial.",
    unitKerja: "Kelompok Dampingan Sosial Kecamatan Baki",
    rencanaAksi: "Menyelenggarakan Pertemuan Peningkatan Kemampuan Keluarga (P2K2) Modul Kesehatan & Gizi bagi kelompok dampingan.",
    tempatPelaksanaan: "Rumah Ketua Kelompok PKH 'Maju Bersama' Dusun II, Kelurahan Kadilangu, Kecamatan Baki",
    pihakTerlibat: "25 orang anggota Kelompok KPM PKH 'Maju Bersama' dan Bidan Desa selaku narasumber pendamping",
    kopTipe: "kemensos"
  },
  {
    title: "Pendamping PKH (RHK 3: Verifikasi Komitmen)",
    rhkUtama: "Terlaksananya verifikasi komitmen KPM PKH di bidang pendidikan (sekolah) dan kesehatan (fasilitas kesehatan/posyandu) demi memastikan keberlanjutan kepatuhan syarat bantuan.",
    ringkasanKegiatan: "- Mengunjungi fasilitas kesehatan (Puskesmas/Posyandu) terdekat guna menyinkronkan data kunjungan timbang badan dan imunisasi anak balita KPM dampingan.\n- Mendatangi sekolah penunjang pendidikan (SD/SMP/SMA) untuk memproses paraf absensi kehadiran siswa penerima bansos dalam berkas verifikasi resmi bulanan.\n- Mengidentifikasi anak KPM yang memiliki tingkat kehadiran di bawah 85% untuk dilakukan pendekatan persuasif dan konseling keluarga.\n- Melakukan pencatatan offline hasil verifikasi sebelum diunggah ke dalam sistem aplikasi e-PKH Kementerian Sosial.",
    peranInstansi: "Menjaga keberhasilan program prasyarat PKH dalam meningkatkan derajat kesehatan dan angka partisipasi sekolah anak KPM.",
    unitKerja: "Seksi Jaminan Sosial Keluarga Kecamatan Baki",
    rencanaAksi: "Melakukan verifikasi komitmen kehadiran anak sekolah dan pemantauan kesehatan ibu hamil/balita KPM di fasilitas pendidikan dan kesehatan.",
    tempatPelaksanaan: "Puskesmas Kecamatan Baki, SD Negeri 1 Kinasih, dan SMP Negeri 1 Baki",
    pihakTerlibat: "Petugas Administrasi Puskesmas, Guru BK/Kepala Sekolah, dan Koordinator PKH Kecamatan",
    kopTipe: "kemensos"
  },
  {
    title: "Pendamping PKH (RHK 4: Graduasi KPM)",
    rhkUtama: "Terlaksananya identifikasi, motivasi, dan pendampingan KPM PKH menuju kelulusan mandiri (Graduasi Mandiri Sejahtera) bagi keluarga yang sudah mandiri secara ekonomi.",
    ringkasanKegiatan: "- Melakukan home visit dan verifikasi kondisi kelayakan ekonomi lapangan bagi KPM yang rintisan usaha mandirinya dirasa mulai stabil.\n- Mengadakan sesi motivasi 'Kemandirian Usaha Keluarga' guna memberikan kepercayaan diri bagi KPM agar siap lulus dari kepesertaan modal bansos negara.\n- Menuntaskan penyusunan berkas administrasi pernyataan keluar sukarela (Suasana Graduasi Mandiri Sejahtera) bermaterai.\n- Melaporkan rekapitulasi data KPM graduasi mandiri sejahtera tersebut ke Dinas Sosial Kabupaten/Kota agar kuota bantuannya dialihkan ke pihak yang lebih berhak.",
    peranInstansi: "Mengurangi indeks kemiskinan daerah serta meningkatkan rasio keadilan sasaran penerima bantuan jaminan sosial keluarga.",
    unitKerja: "Mitra Penanggulangan Kemiskinan Kecamatan Baki",
    rencanaAksi: "Melakukan sosialisasi, assessment kemandirian, serta pendampingan wisuda graduasi mandiri bagi KPM yang dinilai mampu secara finansial.",
    tempatPelaksanaan: "Balai Desa Kadilangu dan Lokasi Usaha Rintisan Mandiri KPM dampingan",
    pihakTerlibat: "3 Keluarga Penerima Manfaat (KPM) lulus graduasi, Kepala Desa Kadilangu, Korkab PKH Kabupaten Sukoharjo",
    kopTipe: "kemensos"
  },
  {
    title: "Pendamping PKH (RHK 5: Pemutakhiran Data)",
    rhkUtama: "Terlaksananya pemutakhiran data kepesertaan KPM PKH secara real-time guna menyerasikan perubahan status keluarga (meninggal, pindah, sekolah, melahirkan) pada database DTSEN.",
    ringkasanKegiatan: "- Melakukan pengumpulan dokumen mutakhir KPM (Kartu Keluarga, KTP, Akta Lahir, Raport/Surat Ket. Sekolah aktif).\n- Meneliti kesesuaian dokumen kependudukan KPM agar padan dengan registrasi Dukcapil setempat.\n- Mengisi form perubahan data struktural anggota keluarga secara manual untuk persiapan entri rekapitulasi ke dalam DTSEN / e-PKH.\n- Membimbing KPM menyelesaikan proses pengurusan berkas kependudukan baru ke kantor kelurahan apabila terdapat ketidaksesuaian nomor KK.",
    peranInstansi: "Mewujudkan tertib administrasi data kemiskinan nasional (DTKS) secara mutakhir dan valid.",
    unitKerja: "Pusat Kesejahteraan Sosial (Puskesos)",
    rencanaAksi: "Melaksanakan perbaikan dan pemutakhiran data anggota keluarga KPM PKH (seperti status anak sekolah, bayi lahir baru, perpindahan domisili).",
    tempatPelaksanaan: "Sekretariat PPKH Kecamatan Baki dan Kantor Dinas Kependudukan Sipil Sukoharjo",
    pihakTerlibat: "KPM dampingan fungsional, Operator Dapodik sekolah setempat, dan Petugas Administrasi Desa",
    kopTipe: "kemensos"
  },
  {
    title: "Pendamping PKH (RHK 6: Pengaduan)",
    rhkUtama: "Terfasilitasinya penyelesaian pengaduan, masalah teknis lapangan, dan kasus penyalahgunaan bansos dari KPM maupun masyarakat secara cepat, adil, dan akuntabel.",
    ringkasanKegiatan: "- Membuka ruang konseling pengaduan mingguan bagi KPM yang mengalami kendala teknis penarikan dana bantuan di lapangan.\n- Melakukan verifikasi lapangan pasca munculnya aduan ketidaklayakan penerimaan bansos (masyarakat mampu namun mendapat bantuan) demi mewujudkan keadilan sosial.\n- Mengatur mediasi persuasif bagi KPM yang memiliki konflik pribadi terkait pembagian dana bantuan keluarga atau penyalahgunaan kartu oleh perantara luar.\n- Melakukan koordinasi taktis tingkat desa/kecamatan guna merumuskan rekomendasi penonaktifan kepesertaan bagi KPM yang terbukti melanggar ketentuan hukum.",
    peranInstansi: "Menjaga transparansi, integritas, dan kenyamanan publik dalam rantai birokrasi penyaluran jaminan sosial.",
    unitKerja: "Unit Pengaduan Masyarakat PPKH Kecamatan Baki",
    rencanaAksi: "Menerima, mencatat, mengklarifikasi, dan memproses penyelesaian pengaduan atau sengketa bansos dalam kelompok dampingan.",
    tempatPelaksanaan: "Sekretariat PKH Kecamatan Baki, Kabupaten Sukoharjo",
    pihakTerlibat: "KPM Pengadu, Tokoh Masyarakat, Koordinator Kecamatan (Korcam) PKH, Dinas Sosial Kab. Sukoharjo",
    kopTipe: "kemensos"
  },
  {
    title: "Pendamping PKH (RHK 7: Laporan Bulanan)",
    rhkUtama: "Tersusunnya dokumen pelaporan bulanan kinerja Pendamping Sosial PKH secara akurat, sistematis, dan tepat waktu sebagai bukti akuntabilitas kinerja personal kepada Kementerian Sosial RI.",
    ringkasanKegiatan: "- Mengompilasi seluruh data evidence kerja sebulan penuh (meliputi rekaman presensi P2K2, berita acara graduasi, rekap pemutakhiran, dll).\n- Memformat narasi pencapaian kerja, hambatan taktis operasional pendampingan, serta rekomendasi solusi pemecahan masalah di kecamatan kerja.\n- Menjilid draf fisik laporan bulanan serta menyiapkannya dalam bentuk format digital PDF siap unggah ke portal kepegawaian internal.\n- Mengajukan penandatanganan pengesahan Laporan Bulanan tersebut ke Koordinator Kabupaten (Korkab) atau Dinas Sosial setempat.",
    peranInstansi: "Memberikan bahan pertangungjawaban kinerja berkinerja tinggi serta dasar evaluasi jaminan sosial makro tingkat kementerian.",
    unitKerja: "Layanan Teknis PPKH",
    rencanaAksi: "Menyusun, merangkum, dan menyampaikan berkas pertanggungjawaban Laporan Bulanan kinerja Pendamping Sosial PKH.",
    tempatPelaksanaan: "Kantor Sekretariat PKH Kecamatan Baki dan Kantor Dinas Sosial Sukoharjo",
    pihakTerlibat: "Koordinator Kabupaten (Korkab) PKH, Pejabat fungsional Dinas Sosial, dan tim administrasi",
    kopTipe: "kemensos"
  },
  {
    title: "Pendamping PKH (RHK 8: Koordinasi & Tugas Lain)",
    rhkUtama: "Terlaksananya rapat koordinasi lintas sektor dengan instansi pemerintahan daerah dan penugasan kedinasan lain dari atasan demi kelancaran program jaminan sosial masyarakat.",
    ringkasanKegiatan: "- Menghadiri Forum Rapat Koordinasi SDM PKH di tingkat kecamatan bersama jajaran Camat, Lurah/Kades, serta puskesmas dan sekolah penunjang.\n- Mengklarifikasi dan membahas status penanganan isu-isu sosial strategis seperti anak rentan putus sekolah dari KPM PKH daerah kerja.\n- Melaksanakan instruksi pimpinan Dinas Sosial untuk melakukan pendampingan darurat penyaluran bantuan masa tanggap bencana lokal.\n- Memberikan masukan teknis dalam upaya penanggulangan kemiskinan ekstrem terpadu berbasis data kewilayahan.",
    peranInstansi: "Meningkatkan sinergitas lintas instansi guna akselerasi kesejahteraan dan penanggulangan isu sosial krusial secara komprehensif.",
    unitKerja: "Sekretariat PKH Kecamatan Baki",
    rencanaAksi: "Mengikuti rapat koordinasi tingkat kecamatan/desa, koordinasi dengan perangkat, dan melaksanakan disposisi tugas insidental pimpinan.",
    tempatPelaksanaan: "Ruang Rapat Kecamatan Baki",
    pihakTerlibat: "6 personil SDM PKH, Koordinator Tim Kecamatan (KatimCam) PKH Bapak Arief Darmawan, S.H.I., Camat, Lurah, Desa",
    kopTipe: "kemensos"
  },
  {
    title: "Pendamping PKH (RHK 9: Publikasi Medsos)",
    rhkUtama: "Terlaksananya publikasi edukasi, cerita sukses KPM graduasi, dan berita positif pelaksanaan program jaminan perlindungan sosial melalui media sosial guna meningkatkan citra instansi.",
    ringkasanKegiatan: "- Merancang naskah cerita inspiratif (success story) 'Kisah Juang KPM PKH Graduasi Mandiri Merintis Toko Kelontong Sejahtera'.\n- Melakukan dokumentasi wawancara singkat serta pengambilan foto representatif penerima manfaat yang berdaya guna konten edukasi.\n- Mengedit visual infografis / tulisan informasional mengenai jadwal penyaluran bansos bebas pungli menggunakan aplikasi desain sederhana.\n- Mengunggah konten informatif tersebut ke media sosial instansi / fungsional, memantau interaksi warga net, serta menjawab pertanyaan publik secara santun dan akurat.",
    peranInstansi: "Membangun kesadaran publik yang positif dan mengedukasi masyarakat terkait kebijakan jaminan sosial secara transparan.",
    unitKerja: "Humas PPKH Kecamatan Baki",
    rencanaAksi: "Membuat konten edukasi jaminan sosial, mendesain narasi cerita sukses KPM, serta membagikan informasi positif di platform media sosial resmi pendamping PKH.",
    tempatPelaksanaan: "Sekretariat PPKH Kecamatan Baki dan Media Sosial Resmi Instansi",
    pihakTerlibat: "KPM Graduasi Mandiri Sejahtera, Tim Editor Humas PPKH, serta Publik / Warganet media sosial",
    kopTipe: "kemensos"
  },
  {
    title: "Pranata Komputer",
    rhkUtama: "Terlaksananya pemeliharaan infrstruktur server lokal agar berjalan minim kendala dan aman.",
    ringkasanKegiatan: "- Melakukan backup berkala database utama sistem informasi kepegawaian institusi.\n- Mengidentifikasi dan memulihkan gangguan konektivitas jaringan Wi-Fi di area gedung pelayanan publik Lantai 2.\n- Melakukan deployment pembaharuan aplikasi e-kinerja internal untuk efisiensi entri data.\n- Memberikan bimbingan teknis perbaikan sistem (helpdesk) terhadap keluhan 12 rekan kerja mengenai absensi digital.",
    peranInstansi: "Mendukung percepatan digitalisasi pelayanan dan integrasi sistem administrasi perkantoran yang andal.",
    unitKerja: "Subbagian Data dan Informasi",
    rencanaAksi: "Melakukan pemeliharaan rutin infrastruktur server lokal, pemulihan gangguan jaringan, dan pendampingan bantuan teknis.",
    tempatPelaksanaan: "Gedung Utama Lantai 2, Ruang Server Pusat, dan Area Pelayanan Publik",
    pihakTerlibat: "Staf Subbagian Data & Informasi, serta 12 personel layanan fungsional penerima manfaat bantuan helpdesk"
  },
  {
    title: "Guru Mata Pelajaran",
    rhkUtama: "Tersusunnya perangkat pembelajaran, pelaksanaan proses KBM yang inklusif, serta pelaksanaan evaluasi berkala hasil belajar siswa.",
    ringkasanKegiatan: "- Menyusun Rencana Pelaksanaan Pembelajaran (RPP) dan Modul Ajar kurikulum merdeka untuk Semester Genap.\n- Mengajar mata pelajaran secara tatap muka sebanyak 24 jam pelajaran per minggu di kelas XI.\n- Melakukan evaluasi, analisis hasil penilaian Penilaian Harian (PH), serta merancang materi remedial.\n- Mendampingi siswa dalam program pengembangan karakter kebangsaan dan pramuka sekolah.",
    peranInstansi: "Meningkatkan mutu kelulusan siswa dan kualitas indeks literasi-numerasi satuan pendidikan.",
    unitKerja: "SMA Negeri 1 Jaya",
    rencanaAksi: "Penyusunan Rencana Pelaksanaan Pembelajaran (RPP), penyelenggaraan asesmen harian, dan pembimbingan pramuka inklusif.",
    tempatPelaksanaan: "Ruang Kelas XI-A dan Ruang Kelas XI-B SMA Negeri 1 Jaya",
    pihakTerlibat: "72 orang siswa Kelas XI, rekan sejawat sesama Guru fungsional, dan diawasi oleh Wakil Kepala Sekolah"
  },
  {
    title: "Perawat Ahli Pertama",
    rhkUtama: "Terlaksananya asuhan keperawatan prima secara mandiri maupun kolaboratif, serta pendokumentasian rekam klinis pasien secara akurat.",
    ringkasanKegiatan: "- Melakukan pengkajian riwayat kesehatan (anamnesa) awal pada 8 pasien IGD.\n- Melaksanakan tindakan keperawatan mandiri seperti pemberian obat sesuai resep, pemasangan infus, terapi inhalasi.\n- Melakukan pemantauan tanda-tanda vital (TTV) berkala pasca-operasi pasien rawat inap.\n- Melakukan komunikasi edukasi kesehatan keluarga terkait tata cara rawat luka di rumah.",
    peranInstansi: "Mendukung mutu keselamatan pasien berstandar akreditasi rumah sakit daerah.",
    unitKerja: "Instalasi Rawat Inap Melati",
    rencanaAksi: "Melakukan anamnesa, asuhan keperawatan gawat darurat, pendataan klinis akurat, dan edukasi pasca-operasi kepada keluarga pasien.",
    tempatPelaksanaan: "Ruang Instalasi Gawat Darurat (IGD) dan Kamar Rawat Inap Melati",
    pihakTerlibat: "8 pasien gawat darurat, Dokter Spesialis Penanggung Jawab Pelayanan (DPJP), serta paramedis tim Perawat Jaga"
  },
  {
    title: "Analis Kebijakan",
    rhkUtama: "Drafting rekomendasi kebijakan teknis yang akuntabel serta penyusunan pelaporan administrasi berkala institusi.",
    ringkasanKegiatan: "- Menyusun draft awal Nota Dinas kajian naskah akademik usulan penataan kelembagaan dinas.\n- Melakukan rekapitulasi data realisasi anggaran triwulan II serta pengarsipan digital berkas penting.\n- Mengagendakan rapat koordinasi lintas bidang terkait evaluasi implementasi SOP baru.\n- Menyiapkan presentasi laporan capaian reformasi birokrasi unit kerja.",
    peranInstansi: "Mewujudkan efisiensi rantai birokrasi pengambilan keputusan internal pimpinan.",
    unitKerja: "Bagian Organisasi dan Tata Laksana",
    rencanaAksi: "Drafting Nota Dinas usulan tata organisasi dinas, rekap anggaran triwulanan, dan fasilitasi forum sosialisasi SOP.",
    tempatPelaksanaan: "Ruang Rapat Utama Bagian Organisasi dan Tata Laksana Gedung B",
    pihakTerlibat: "Kepala Bagian Organisasi, Perwakilan Biro Hukum Setda, serta seluruh kepala bidang operasional"
  }
];
