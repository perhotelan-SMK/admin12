import { TeacherIdentity, LearningIdentity, LearningMethods, AdditionalSettings, StudentScore } from '../types';

export const SCHOOL_INFO = {
  province: 'PEMERINTAH PROVINSI BALI',
  office: 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA',
  name: 'SMK NEGERI 1 BEBANDEM',
  year: 'TAHUN AJARAN 2026/2027',
  address: 'Jl. Kuncara Giri, Sibetan, Bebandem, Karangasem, Bali.',
  logoUrl: 'https://i.imgur.com/kx40xIV.png',
  principalName: 'I Wayan Darmayasa, S.T., M.Si.',
  principalNip: '19730522 200501 1 009',
  location: 'Bebandem',
};

export const DEFAULT_TEACHER: TeacherIdentity = {
  teacherName: 'I Nengah Sudarsana, S.Pd., M.Pd.',
  teacherNip: '19840815 201001 1 018',
  subject: 'Konsentrasi Keahlian Rekayasa Perangkat Lunak (RPL)',
  vocation: 'Rekayasa Perangkat Lunak (RPL)',
  grade: 'XI (Sebelas)',
  phase: 'F',
  semester: 'Ganjil',
  academicYear: '2026/2027',
};

export const DEFAULT_LEARNING: LearningIdentity = {
  topic: 'Pemrograman Web Berbasis Komponen & Integrasi RESTful API',
  cp: 'Pada akhir Fase F, peserta didik mampu merancang arsitektur aplikasi berbasis web, mengimplementasikan antarmuka responsif, mengelola pertukaran data melalui RESTful API, menerapkan standar keamanan input, serta menguji performa aplikasi sesuai standar operasional industri perangkat lunak.',
  tp: `1. Menganalisis kebutuhan fungsional dan arsitektur antarmuka web responsif berstandar industri.
2. Mengimplementasikan integrasi komponen frontend dengan layanan RESTful API secara asinkronus.
3. Mendiagnosis kendala pengiriman data (HTTP status & payload) serta menerapkan penanganan galat (error handling).
4. Mengembangkan proyek aplikasi mini berbasis kebutuhan lokal UMKM Salak Sibetan Bebandem dengan menjunjung kolaborasi dan bernalar kritis.`,
  duration: '4 JP x 45 Menit (Pertemuan 1-2)',
  studentCount: 36,
  studentCharacteristics: 'Peserta didik memiliki ketertarikan tinggi pada praktik hands-on di lab komputer, gaya belajar dominan visual dan kinestetik, serta adaptif terhadap perangkat digital.',
};

export const DEFAULT_METHODS: LearningMethods = {
  methods: ['Praktik', 'Diskusi', 'Demonstrasi', 'Project Based Learning', 'Problem Solving'],
  model: 'Project Based Learning (PjBL)',
  dimensions: [
    'Penalaran Kritis',
    'Kreativitas',
    'Kolaborasi',
    'Kemandirian',
    'Komunikasi',
  ],
};

export const DEFAULT_SETTINGS: AdditionalSettings = {
  deepLearning: true,
  differentiation: true,
  digitalTech: true,
  literacy: true,
  numeracy: true,
  baliWisdom: true,
  characterEducation: true,
  vocationalPractice: true,
};

export const VOCATION_LIST = [
  'Rekayasa Perangkat Lunak (RPL)',
  'Teknik Komputer dan Jaringan (TKJ)',
  'Teknik Kendaraan Ringan (TKR)',
  'Teknik Bisnis Sepeda Motor (TBSM)',
  'Kuliner / Tata Boga',
  'Perhotelan',
  'Akuntansi dan Keuangan Lembaga (AKL)',
  'Agribisnis Pengolahan Hasil Pertanian (Salak Sibetan)',
  'Desain Komunikasi Visual (DKV)',
  'Umum / Muatan Nasional',
];

export const METHOD_OPTIONS = [
  'Ceramah Interaktif',
  'Diskusi',
  'Tanya Jawab',
  'Demonstrasi',
  'Praktik',
  'Eksperimen',
  'Simulasi',
  'Presentasi',
  'Penugasan',
  'Studi Kasus',
  'Problem Solving',
  'Project Based Learning',
  'Discovery Learning',
];

export const MODEL_OPTIONS = [
  'Problem Based Learning (PBL)',
  'Project Based Learning (PjBL)',
  'Discovery Learning',
  'Inquiry Learning',
  'Cooperative Learning',
  'Contextual Teaching and Learning (CTL)',
  'Teaching Factory (TEFA)',
  'Direct Instruction',
  'Blended Learning',
  'Flipped Classroom',
];

export const DIMENSION_OPTIONS = [
  { id: 'Keimanan dan Ketakwaan', label: '1. Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa' },
  { id: 'Kewargaan', label: '2. Kewargaan' },
  { id: 'Penalaran Kritis', label: '3. Penalaran Kritis' },
  { id: 'Kreativitas', label: '4. Kreativitas' },
  { id: 'Kolaborasi', label: '5. Kolaborasi' },
  { id: 'Kemandirian', label: '6. Kemandirian' },
  { id: 'Kesehatan', label: '7. Kesehatan' },
  { id: 'Komunikasi', label: '8. Komunikasi' },
];

export const DEEP_LEARNING_MODULE_STRUCTURE = [
  {
    section: 'A',
    title: 'Identitas Modul',
    summary: 'Satuan pendidikan, penyusun, mapel, fase/kelas, semester, tahun pelajaran, materi/topik, alokasi waktu',
  },
  {
    section: 'B',
    title: 'Identifikasi',
    summary: '1. Identifikasi peserta didik, 2. Identifikasi materi pembelajaran, 3. Dimensi Profil Lulusan (8 dimensi)',
  },
  {
    section: 'C',
    title: 'Desain Pembelajaran',
    summary: '1. CP, 2. Lintas disiplin ilmu, 3. TP, 4. Topik pembelajaran, 5. Praktik pedagogis, 6. Kemitraan, 7. Lingkungan, 8. Pemanfaatan digital',
  },
  {
    section: 'D',
    title: 'Pengalaman Belajar',
    summary: '1. Pendahuluan, 2. Kegiatan Inti: a. Memahami (berkesadaran & bermakna), b. Mengaplikasi (bermakna), c. Merefleksi (berkesadaran), 3. Penutup',
  },
  {
    section: 'E',
    title: 'Asesmen Pembelajaran',
    summary: '1. Asesmen awal (diagnostik), 2. Asesmen proses (formatif), 3. Asesmen akhir (sumatif), 4. Instrumen & kriteria ketercapaian (KKTP = 75)',
  },
  {
    section: 'F',
    title: 'Tindak Lanjut dan Lampiran',
    summary: 'Pengayaan, remedial, LKPD, bahan bacaan & media, rubrik penilaian, lembar refleksi guru & siswa, referensi',
  },
];

export const ATP_DOC_CONFIG = {
  type: 'atp',
  title: 'Alur Tujuan Pembelajaran (ATP)',
  subtitle: 'Pemetaan Elemen, CP ke TP, Materi Pokok, Jam Pelajaran & Asesmen',
  icon: 'Layers',
  color: 'from-teal-600 to-cyan-700',
  borderColor: 'border-teal-500',
  badge: 'Pondasi Kurikulum',
};

export const ADMIN_DOCS_CONFIG = [
  {
    type: 'modul_ajar',
    title: '1. Modul Ajar (Deep Learning)',
    subtitle: 'A. Identitas, B. Identifikasi, C. Desain, D. Pengalaman Belajar, E. Asesmen, F. Tindak Lanjut',
    icon: 'BookOpen',
    color: 'from-blue-600 to-indigo-700',
    borderColor: 'border-blue-500',
    badge: 'Deep Learning',
  },
  {
    type: 'bahan_ajar',
    title: '2. Bahan Ajar & Materi',
    subtitle: 'Modul Teori, Peta Konsep, Penerapan Nyata & DUDIKA',
    icon: 'FileText',
    color: 'from-sky-600 to-blue-700',
    borderColor: 'border-sky-500',
    badge: 'Materi Lengkap',
  },
  {
    type: 'lkpd',
    title: '3. LKPD / Lembar Kerja Siswa',
    subtitle: 'Job Sheet Praktik, Panduan Kerja, Kolom Analisis',
    icon: 'ClipboardList',
    color: 'from-emerald-600 to-teal-700',
    borderColor: 'border-emerald-500',
    badge: 'Praktik Siswa',
  },
  {
    type: 'media_pembelajaran',
    title: '4. Media Pembelajaran',
    subtitle: 'Storyboard Slide, Video Tutorial & Konsep Visual',
    icon: 'Presentation',
    color: 'from-violet-600 to-purple-700',
    borderColor: 'border-violet-500',
    badge: 'Visual & Interaktif',
  },
  {
    type: 'kisi_kisi',
    title: '5. Kisi-Kisi Penulisan Soal',
    subtitle: 'Matriks Soal Bloom C1-C6, Indikator, dan Bobot',
    icon: 'Grid',
    color: 'from-amber-600 to-yellow-700',
    borderColor: 'border-amber-500',
    badge: 'Matriks Ujian',
  },
  {
    type: 'naskah_soal',
    title: '6. Naskah Soal & Kunci Jawaban',
    subtitle: 'Pilihan Ganda A-E, Kasus HOTS, Kunci & Pembahasan',
    icon: 'CheckSquare',
    color: 'from-rose-600 to-red-700',
    borderColor: 'border-rose-500',
    badge: 'Bank Soal',
  },
  {
    type: 'rubrik_penilaian',
    title: '7. Rubrik Penilaian',
    subtitle: 'Skor Sikap, Pengetahuan, Praktik Vokasi & Konversi',
    icon: 'Award',
    color: 'from-fuchsia-600 to-pink-700',
    borderColor: 'border-fuchsia-500',
    badge: 'Pedoman Skor',
  },
  {
    type: 'asesmen_diagnostik',
    title: '8. Asesmen Diagnostik',
    subtitle: 'Pemetaan Kesiapan Kognitif & Non-Kognitif Awal',
    icon: 'Compass',
    color: 'from-cyan-600 to-blue-600',
    borderColor: 'border-cyan-500',
    badge: 'Awal Belajar',
  },
  {
    type: 'asesmen_formatif',
    title: '9. Asesmen Formatif',
    subtitle: 'Observasi Proses, Ceklis K3LH & Exit Ticket',
    icon: 'Activity',
    color: 'from-teal-600 to-emerald-700',
    borderColor: 'border-teal-500',
    badge: 'Monitoring',
  },
  {
    type: 'asesmen_sumatif',
    title: '10. Asesmen Sumatif',
    subtitle: 'Uji Capaian Akhir Unit, KKTP & Rekap Nilai',
    icon: 'CheckCircle2',
    color: 'from-blue-700 to-indigo-900',
    borderColor: 'border-indigo-600',
    badge: 'Hasil Akhir',
  },
  {
    type: 'analisis_penilaian',
    title: '11. Analisis Hasil Penilaian',
    subtitle: 'Tabel Interaktif Nilai TP, Grafik Ketuntasan & AI Insight',
    icon: 'BarChart3',
    color: 'from-orange-600 to-amber-700',
    borderColor: 'border-orange-500',
    badge: 'Data Real & Chart',
  },
  {
    type: 'program_remedial',
    title: '12. Program Remedial & Pengayaan',
    subtitle: 'Bimbingan Siswa Belum Tuntas & Proyek TEFA Lanjut',
    icon: 'RefreshCw',
    color: 'from-emerald-700 to-green-800',
    borderColor: 'border-green-600',
    badge: 'Tindak Lanjut',
  },
];

export const INITIAL_STUDENTS: StudentScore[] = [
  { id: '1', no: 1, name: 'I Gede Agus Santika', tpScores: { TP1: 88, TP2: 92, TP3: 85, TP4: 90 }, finalScore: 88.8, isPassed: true, notes: 'Sangat menguasai logika API' },
  { id: '2', no: 2, name: 'Ni Kadek Dwi Aryanti', tpScores: { TP1: 82, TP2: 78, TP3: 80, TP4: 84 }, finalScore: 81.0, isPassed: true, notes: 'Teliti dalam perancangan UI' },
  { id: '3', no: 3, name: 'I Komang Raditya', tpScores: { TP1: 72, TP2: 70, TP3: 65, TP4: 68 }, finalScore: 68.8, isPassed: false, notes: 'Butuh pendampingan sintaks async/await' },
  { id: '4', no: 4, name: 'Ni Putu Ayu Mirah', tpScores: { TP1: 90, TP2: 88, TP3: 92, TP4: 94 }, finalScore: 91.0, isPassed: true, notes: 'Kandidat tutor sebaya' },
  { id: '5', no: 5, name: 'I Made Suartika', tpScores: { TP1: 80, TP2: 76, TP3: 75, TP4: 78 }, finalScore: 77.3, isPassed: true, notes: 'Aktif saat praktikum lab' },
  { id: '6', no: 6, name: 'I Wayan Bagus Mahardika', tpScores: { TP1: 68, TP2: 72, TP3: 64, TP4: 70 }, finalScore: 68.5, isPassed: false, notes: 'Kesulitan tracing galat API' },
  { id: '7', no: 7, name: 'Ni Luh Manik Wulandari', tpScores: { TP1: 85, TP2: 84, TP3: 82, TP4: 88 }, finalScore: 84.8, isPassed: true, notes: 'Disiplin dan bertanggung jawab' },
  { id: '8', no: 8, name: 'I Ketut Darmawan', tpScores: { TP1: 75, TP2: 78, TP3: 74, TP4: 76 }, finalScore: 75.8, isPassed: true, notes: 'Tuntas batas minimum' },
  { id: '9', no: 9, name: 'Ni Made Rai Sintya', tpScores: { TP1: 92, TP2: 90, TP3: 88, TP4: 95 }, finalScore: 91.3, isPassed: true, notes: 'Proyek frontend sangat rapi' },
  { id: '10', no: 10, name: 'I Gusti Ngurah Agung', tpScores: { TP1: 65, TP2: 68, TP3: 60, TP4: 65 }, finalScore: 64.5, isPassed: false, notes: 'Sering absen saat materi prasyarat' },
];
