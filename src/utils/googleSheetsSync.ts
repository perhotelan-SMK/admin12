import { SavedRecord } from '../types';

export function generateGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * SI GURU - SMART ADMINISTRATION GENERATOR
 * SMK NEGERI 1 BEBANDEM - TAHUN AJARAN 2026/2027
 * BACKEND GOOGLE APPS SCRIPT DATABASE SYNC (Code.gs)
 * =========================================================================
 * PANDUAN PENERAPAN RESMI (AGAR TIDAK GAGAL 404 / AKSES DITOLAK):
 * 
 * ⚠️ PERINGATAN PENTING:
 * JANGAN PERNAH menyalin URL dari address bar browser saat mengedit kode ini!
 * (URL address bar hanya ID editor dan AKAN MENYEBABKAN ERROR 404 di SI GURU).
 * 
 * CARA MENDAPATKAN URL RESMI APLIKASI WEB YANG BENAR:
 * 1. Buka Google Spreadsheet baru (ketik: sheets.new di browser).
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus seluruh kode bawaan (myFunction), lalu tempel seluruh isi kode ini.
 * 4. Klik ikon DISKET (Simpan / Save) atau tekan Ctrl+S.
 * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas > pilih "Penerapan baru" (New deployment).
 * 6. Klik ikon Roda Gigi di samping "Pilih jenis", pilih "Aplikasi web" (Web app).
 * 7. Konfigurasikan:
 *    - Deskripsi: SI GURU SMKN 1 Bebandem 2026/2027
 *    - Jalankan sebagai (Execute as): Saya (email akun Anda)
 *    - Siapa yang memiliki akses (Who has access) WAJIB: "Siapa saja" (Anyone)
 *      (Jika akun Belajar.id / sekolah, pastikan pilih "Siapa saja" bukan hanya organisasi).
 * 8. Klik tombol "Terapkan" (Deploy).
 * 9. Berikan izin akses (Klik "Tinjau Izin" / Review Permissions > pilih akun Google >
 *    klik "Advanced / Lanjutan" di pojok kiri bawah > klik "Go to Untitled / Buka SI GURU" > Izinkan).
 * 10. Salin "URL Aplikasi Web" yang tampil (diawali https://script.google.com/macros/s/.../exec).
 * =========================================================================
 */

const SHEET_NAMES = {
  GURU: 'DATA_GURU',
  PEMBELAJARAN: 'DATA_PEMBELAJARAN',
  TUJUAN: 'DATA_TUJUAN_PEMBELAJARAN',
  DOKUMEN: 'DOKUMEN_ADMINISTRASI',
  PENILAIAN: 'DATA_PENILAIAN',
  RIWAYAT: 'RIWAYAT_GENERATOR'
};

function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheet(ss, SHEET_NAMES.GURU, [
    'ID Guru', 'Nama Lengkap', 'NIP', 'Mata Pelajaran', 'Program Keahlian',
    'Kelas', 'Fase', 'Semester', 'Tahun Ajaran', 'Terakhir Disinkronkan'
  ]);
  setupSheet(ss, SHEET_NAMES.PEMBELAJARAN, [
    'ID Rekaman', 'Topik / Materi Pokok', 'Capaian Pembelajaran (CP)', 'Alokasi Waktu',
    'Jumlah Peserta Didik', 'Karakteristik Siswa', 'Model Pembelajaran', 'Metode Dipilih',
    'Dimensi Profil', 'Waktu Sinkron'
  ]);
  setupSheet(ss, SHEET_NAMES.TUJUAN, [
    'ID Rekaman', 'Mata Pelajaran', 'Nomor TP', 'Rumusan Tujuan Pembelajaran (TP)', 'Waktu Sinkron'
  ]);
  setupSheet(ss, SHEET_NAMES.DOKUMEN, [
    'ID Rekaman', 'Kode Dokumen', 'Nama Dokumen Administrasi', 'Mata Pelajaran',
    'Kelas / Fase', 'Guru Pengampu', 'Status', 'Waktu Dibuat'
  ]);
  setupSheet(ss, SHEET_NAMES.PENILAIAN, [
    'ID Rekaman', 'No Absen', 'Nama Peserta Didik', 'Nilai TP 1', 'Nilai TP 2',
    'Nilai TP 3', 'Nilai TP 4', 'Rata-Rata Akhir', 'Status Ketuntasan (KKTP)', 'Catatan Guru'
  ]);
  setupSheet(ss, SHEET_NAMES.RIWAYAT, [
    'Log ID', 'Waktu Transaksi', 'Nama Guru', 'Mata Pelajaran', 'Topik Pembelajaran',
    'Total Dokumen', 'Status Sinkronisasi'
  ]);
}

function setupSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1e3a8a'); // Biru Navy Resmi SMKN 1 Bebandem
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

// Menangani permintaan POST dari aplikasi SI GURU
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupDatabaseSheets();

    const rec = payload.record || {};
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
    const recId = rec.id || ('rec-' + Date.now());

    // 1. DATA_GURU
    if (rec.teacher) {
      const sheetGuru = ss.getSheetByName(SHEET_NAMES.GURU);
      sheetGuru.appendRow([
        recId,
        rec.teacher.teacherName || '',
        rec.teacher.teacherNip || '',
        rec.teacher.subject || '',
        rec.teacher.vocation || '',
        rec.teacher.grade || '',
        rec.teacher.phase || '',
        rec.teacher.semester || '',
        rec.teacher.academicYear || '2026/2027',
        now
      ]);
    }

    // 2. DATA_PEMBELAJARAN
    if (rec.learning) {
      const sheetPem = ss.getSheetByName(SHEET_NAMES.PEMBELAJARAN);
      sheetPem.appendRow([
        recId,
        rec.learning.topic || '',
        rec.learning.cp || '',
        rec.learning.duration || '',
        rec.learning.studentCount || 36,
        rec.learning.studentCharacteristics || '',
        rec.methods ? rec.methods.model : '',
        rec.methods && rec.methods.methods ? rec.methods.methods.join(', ') : '',
        rec.methods && rec.methods.dimensions ? rec.methods.dimensions.join(', ') : '',
        now
      ]);
    }

    // 3. DATA_TUJUAN_PEMBELAJARAN
    if (rec.learning && rec.learning.tp) {
      const sheetTp = ss.getSheetByName(SHEET_NAMES.TUJUAN);
      const tpLines = rec.learning.tp.split('\n').filter(function(line) { return line.trim().length > 0; });
      for (let i = 0; i < tpLines.length; i++) {
        sheetTp.appendRow([
          recId,
          rec.teacher ? rec.teacher.subject : '',
          'TP ' + (i + 1),
          tpLines[i].trim(),
          now
        ]);
      }
    }

    // 4. DOKUMEN_ADMINISTRASI
    if (rec.documents) {
      const sheetDoc = ss.getSheetByName(SHEET_NAMES.DOKUMEN);
      const docKeys = Object.keys(rec.documents);
      for (let j = 0; j < docKeys.length; j++) {
        const docKey = docKeys[j];
        if (rec.documents[docKey]) {
          sheetDoc.appendRow([
            recId,
            docKey,
            docKey.toUpperCase().replace(/_/g, ' '),
            rec.teacher ? rec.teacher.subject : '',
            rec.teacher ? (rec.teacher.grade + ' / ' + rec.teacher.phase) : '',
            rec.teacher ? rec.teacher.teacherName : '',
            'Tersimpan & Siap Cetak',
            now
          ]);
        }
      }
    }

    // 5. DATA_PENILAIAN
    if (rec.assessment && rec.assessment.students && rec.assessment.students.length > 0) {
      const sheetNilai = ss.getSheetByName(SHEET_NAMES.PENILAIAN);
      const students = rec.assessment.students;
      for (let k = 0; k < students.length; k++) {
        const s = students[k];
        const scores = s.scores || [0, 0, 0, 0];
        const finalScore = s.finalScore || Math.round((scores.reduce(function(a, b) { return a + b; }, 0) / (scores.length || 1)));
        const passed = finalScore >= (rec.assessment.passingScore || 75);
        sheetNilai.appendRow([
          recId,
          s.number || (k + 1),
          s.name || ('Siswa ' + (k + 1)),
          scores[0] !== undefined ? scores[0] : '',
          scores[1] !== undefined ? scores[1] : '',
          scores[2] !== undefined ? scores[2] : '',
          scores[3] !== undefined ? scores[3] : '',
          finalScore,
          passed ? 'Tuntas' : 'Perlu Remedial',
          passed ? 'Mencapai KKTP' : 'Diberikan program remedial terarah'
        ]);
      }
    }

    // 6. RIWAYAT_GENERATOR
    const sheetRiwayat = ss.getSheetByName(SHEET_NAMES.RIWAYAT);
    const docCount = rec.documents ? Object.keys(rec.documents).length : 0;
    sheetRiwayat.appendRow([
      'LOG-' + Date.now(),
      now,
      rec.teacher ? rec.teacher.teacherName : 'Guru SMKN 1 Bebandem',
      rec.teacher ? rec.teacher.subject : '-',
      rec.learning ? rec.learning.topic : '-',
      docCount + ' Dokumen Administrasi',
      'BERHASIL DISINKRONKAN'
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'SUCCESS',
      message: 'Data berhasil disinkronkan ke 6 Sheet (DATA_GURU, DATA_PEMBELAJARAN, DATA_TUJUAN, DOKUMEN, DATA_PENILAIAN, RIWAYAT)!',
      timestamp: now,
      recordId: recId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR',
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Menangani permintaan GET (untuk uji koneksi Web App)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ONLINE',
    school: 'SMK Negeri 1 Bebandem',
    academicYear: '2026/2027',
    message: 'SI GURU Database Web App Aktif & Siap Menerima Sinkronisasi!',
    timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })
  })).setMimeType(ContentService.MimeType.JSON);
}`;
}

export function exportTableToCSV(
  sheetType: 'guru' | 'pembelajaran' | 'tp' | 'dokumen' | 'penilaian' | 'riwayat' | 'semua',
  records: SavedRecord[]
): string {
  if (sheetType === 'guru') {
    const headers = ['ID Rekaman,Nama Lengkap Guru,NIP,Mata Pelajaran,Program Keahlian,Kelas,Fase,Semester,Tahun Ajaran,Waktu Update'];
    const rows = records.map(
      (r) =>
        `"${r.id}","${r.teacher.teacherName}","${r.teacher.teacherNip}","${r.teacher.subject}","${r.teacher.vocation}","${r.teacher.grade}","${r.teacher.phase}","${r.teacher.semester}","${r.teacher.academicYear}","${r.updatedAt}"`
    );
    return [headers, ...rows].join('\n');
  }

  if (sheetType === 'pembelajaran') {
    const headers = ['ID Rekaman,Mata Pelajaran,Topik/Materi,Capaian Pembelajaran,Alokasi Waktu,Jumlah Siswa,Model Pembelajaran'];
    const rows = records.map(
      (r) =>
        `"${r.id}","${r.teacher.subject}","${r.learning.topic}","${(r.learning.cp || '').replace(/"/g, '""')}","${r.learning.duration}","${r.learning.studentCount}","${r.methods?.model || ''}"`
    );
    return [headers, ...rows].join('\n');
  }

  if (sheetType === 'tp') {
    const headers = ['ID Rekaman,Mata Pelajaran,Topik Pembelajaran,Nomor TP,Rumusan Tujuan Pembelajaran'];
    const rows: string[] = [];
    records.forEach((r) => {
      const tpLines = (r.learning.tp || '').split('\n').filter((l) => l.trim().length > 0);
      tpLines.forEach((tp, idx) => {
        rows.push(`"${r.id}","${r.teacher.subject}","${r.learning.topic}","TP ${idx + 1}","${tp.replace(/"/g, '""')}"`);
      });
    });
    return [headers, ...rows].join('\n');
  }

  if (sheetType === 'dokumen') {
    const headers = ['ID Rekaman,Mata Pelajaran,Topik,Guru,Kelas,Semester,Jumlah Dokumen Lengkap'];
    const rows = records.map(
      (r) =>
        `"${r.id}","${r.teacher.subject}","${r.learning.topic}","${r.teacher.teacherName}","${r.teacher.grade}","${r.teacher.semester}",${Object.keys(r.documents || {}).length}`
    );
    return [headers, ...rows].join('\n');
  }

  if (sheetType === 'penilaian') {
    const headers = ['ID Rekaman,Mata Pelajaran,Topik,No Absen,Nama Siswa,Nilai Akhir,Status'];
    const rows: string[] = [];
    records.forEach((r) => {
      (r.assessment?.students || []).forEach((s) => {
        rows.push(
          `"${r.id}","${r.teacher.subject}","${r.learning.topic}",${s.no},"${s.name}",${s.finalScore},"${s.isPassed ? 'Tuntas' : 'Remedial'}"`
        );
      });
    });
    return [headers, ...rows].join('\n');
  }

  // Default riwayat / semua
  const headers = ['ID Arsip,Tanggal Pembuatan,Nama Guru,NIP,Mata Pelajaran,Topik Pembelajaran,Kelas,Semester,Jumlah Dokumen Tersimpan'];
  const rows = records.map(
    (r) =>
      `"${r.id}","${r.createdAt}","${r.teacher.teacherName}","${r.teacher.teacherNip}","${r.teacher.subject}","${r.learning.topic}","${r.teacher.grade}","${r.teacher.semester}",${Object.keys(r.documents || {}).length}`
  );
  return [headers, ...rows].join('\n');
}

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
