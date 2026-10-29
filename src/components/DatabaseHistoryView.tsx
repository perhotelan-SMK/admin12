import React, { useState } from 'react';
import { SavedRecord } from '../types';
import {
  generateGoogleAppsScriptCode,
  exportTableToCSV,
  downloadCSV,
} from '../utils/googleSheetsSync';
import {
  Database,
  Search,
  Copy,
  Check,
  Download,
  Trash2,
  Copy as DuplicateIcon,
  ExternalLink,
  RefreshCw,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface HistoryProps {
  records: SavedRecord[];
  onLoadRecord: (record: SavedRecord) => void;
  onDuplicateRecord: (record: SavedRecord) => void;
  onDeleteRecord: (id: string) => void;
  onSyncWebhook: (url: string) => Promise<{ success: boolean; message: string; code?: string }>;
  onTestSheetsUrl?: (url: string) => Promise<{ success: boolean; message: string; code?: string }>;
}

export const DatabaseHistoryView: React.FC<HistoryProps> = ({
  records,
  onLoadRecord,
  onDuplicateRecord,
  onDeleteRecord,
  onSyncWebhook,
  onTestSheetsUrl,
}) => {
  // Password protection state - Requires "ming"
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('siguru_db_unlocked') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');

  const [copiedCode, setCopiedCode] = useState(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => {
    return localStorage.getItem('siguru_webapp_url') || '';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const [syncResult, setSyncResult] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    code?: string;
    details?: string;
  } | null>(null);

  React.useEffect(() => {
    if (appsScriptUrl) {
      localStorage.setItem('siguru_webapp_url', appsScriptUrl.trim());
    }
  }, [appsScriptUrl]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'ming') {
      setIsUnlocked(true);
      sessionStorage.setItem('siguru_db_unlocked', 'true');
      setPasswordError(null);
      setPasswordInput('');
    } else {
      setPasswordError('Password salah! Masukkan password "ming" untuk membuka database.');
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('siguru_db_unlocked');
    setPasswordInput('');
  };

  // Copy Code.gs
  const handleCopyCode = () => {
    const code = generateGoogleAppsScriptCode();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Test Web App Connection
  const handleTestConnection = async () => {
    if (!appsScriptUrl.trim()) {
      setSyncResult({
        type: 'error',
        message: 'Masukkan URL Aplikasi Web Google Apps Script terlebih dahulu.',
        details: 'Format yang benar: https://script.google.com/macros/s/.../exec',
      });
      return;
    }
    setIsTesting(true);
    setSyncResult(null);
    try {
      if (onTestSheetsUrl) {
        const res = await onTestSheetsUrl(appsScriptUrl);
        const is404 = res.code === 'URL_NOT_FOUND' || res.message.includes('404') || res.message.includes('TIDAK DITEMUKAN');
        const isAuth = res.code === 'PERMISSION_DENIED' || res.message.includes('Hanya saya') || res.message.includes('OTORISASI');

        setSyncResult({
          type: res.success ? 'success' : 'error',
          message: res.message,
          code: res.code,
          details: res.success
            ? 'Web App siap menerima sinkronisasi data dari SI GURU.'
            : is404
            ? 'Google tidak menemukan Web App pada URL ini (Error 404). Silakan salin URL Aplikasi Web dari tombol biru "Terapkan" (Deploy) > "Kelola penerapan", bukan dari address bar browser editor!'
            : isAuth
            ? 'Web App masih disetel "Hanya saya" (Only myself). Ubah ke "Siapa saja" (Anyone) di Apps Script.'
            : 'Periksa pengaturan akses pada Apps Script (wajib: Siapa saja / Anyone).',
        });

        if (!res.success) {
          setShowTroubleshoot(true);
        }
      } else {
        setSyncResult({
          type: 'info',
          message: 'Pengujian koneksi via backend siap digunakan.',
        });
      }
    } catch (e: any) {
      setSyncResult({
        type: 'error',
        message: 'Gagal menguji koneksi: ' + e.message,
      });
      setShowTroubleshoot(true);
    } finally {
      setIsTesting(false);
    }
  };

  // Sync to user Google Spreadsheet Web App
  const handleTriggerSync = async () => {
    if (!appsScriptUrl.trim()) {
      setSyncResult({
        type: 'error',
        message: 'Silakan masukkan URL Aplikasi Web Google Apps Script terlebih dahulu.',
        details: 'Buka panduan di bawah jika belum memiliki URL Web App.',
      });
      setShowTroubleshoot(true);
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await onSyncWebhook(appsScriptUrl);
      const is404 = res.code === 'URL_NOT_FOUND' || res.message.includes('404') || res.message.includes('TIDAK DITEMUKAN');
      const isAuth = res.code === 'PERMISSION_DENIED' || res.message.includes('Hanya saya') || res.message.includes('OTORISASI');

      if (res.success) {
        setSyncResult({
          type: 'success',
          message: res.message,
          code: res.code,
          details: 'Data guru, topik pembelajaran, rincian TP, dokumen, dan penilaian berhasil dicatat ke 6 Sheet.',
        });
      } else {
        setSyncResult({
          type: 'error',
          message: res.message,
          code: res.code,
          details: is404
            ? 'Google tidak menemukan Web App pada URL ini (Error 404). Silakan salin URL Aplikasi Web dari tombol biru "Terapkan" (Deploy) > "Kelola penerapan", bukan dari address bar browser editor!'
            : isAuth
            ? 'Pengaturan akses di Google Apps Script masih "Hanya saya" (Only myself). Buka Apps Script > Terapkan > Kelola Penerapan > Edit > Ubah "Siapa yang memiliki akses" menjadi "Siapa saja" (Anyone).'
            : 'Ikuti panduan 5 langkah di bawah untuk menyelesaikan masalah ini.',
        });
        setShowTroubleshoot(true);
      }
    } catch (e: any) {
      setSyncResult({
        type: 'error',
        message: 'Error tidak terduga: ' + e.message,
      });
      setShowTroubleshoot(true);
    } finally {
      setIsSyncing(false);
    }
  };

  // If locked, render the password protection screen
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl shadow-2xl border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-300 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            DATABASE TERKUNCI (PASSWORD PROTECTED)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2.5">
            Akses Database Administrasi
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Data Google Spreadsheet dan arsip administrasi guru SMK Negeri 1 Bebandem dilindungi kata sandi keamanan.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Masukkan Password Database:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(null);
                }}
                placeholder="Ketik password database (ming)..."
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{passwordError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-700/20 active:scale-95 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Buka Kunci Database</span>
          </button>
        </form>

        <div className="text-[11px] text-slate-400">
          SMK Negeri 1 Bebandem &bull; Sistem Administrasi Pembelajaran 2026/2027
        </div>
      </div>
    );
  }

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const matchSearch =
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.teacher.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.learning.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = filterSubject === 'ALL' || rec.teacher.subject === filterSubject;
    const matchGrade = filterGrade === 'ALL' || rec.teacher.grade === filterGrade;
    const matchSemester = filterSemester === 'ALL' || rec.teacher.semester === filterSemester;
    return matchSearch && matchSubject && matchGrade && matchSemester;
  });

  const uniqueSubjects = Array.from(new Set(records.map((r) => r.teacher.subject)));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase px-2.5 py-1 rounded-full tracking-wider border border-cyan-400/30">
                DATABASE SINKRONISASI 6 SHEET
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase px-2.5 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Terverifikasi (ming)</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 text-white">
              Database Administrasi & Google Spreadsheet Sync
            </h1>
            <p className="text-blue-200 text-sm mt-1 max-w-2xl">
              SMK Negeri 1 Bebandem &bull; Terhubung dengan Google Spreadsheet (DATA_GURU, DATA_PEMBELAJARAN, DATA_TUJUAN_PEMBELAJARAN, DOKUMEN_ADMINISTRASI, DATA_PENILAIAN, RIWAYAT_GENERATOR).
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                const csv = exportTableToCSV('semua', records);
                downloadCSV('RIWAYAT_ADMINISTRASI_SMKN1Bebandem.csv', csv);
              }}
              className="bg-blue-800 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-blue-600/50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4 text-cyan-300" />
              <span>Ekspor CSV Riwayat</span>
            </button>
            <button
              onClick={handleLockAgain}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              title="Kunci Kembali Akses Database"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci Database</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Spreadsheet Setup & Sync Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Database className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Sinkronisasi Google Spreadsheet Otomatis (6 Sheet Resmi)
              </h2>
              <p className="text-xs text-slate-500">
                Kirim data administrasi guru dan nilai ke Google Spreadsheet sekolah secara real-time
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-all cursor-pointer self-start sm:self-auto"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>{showTroubleshoot ? 'Sembunyikan Panduan' : 'Panduan Mengatasi Gagal Sinkron'}</span>
            {showTroubleshoot ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 6 Sheets Pill Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: '1. DATA_GURU', desc: 'Identitas Guru Pengampu' },
            { name: '2. DATA_PEMBELAJARAN', desc: 'Topik, Model, & CP' },
            { name: '3. DATA_TUJUAN', desc: 'Daftar Rincian TP' },
            { name: '4. DOKUMEN_ADMIN', desc: '12 Berkas Terverifikasi' },
            { name: '5. DATA_PENILAIAN', desc: 'Tabel Rekap Nilai Siswa' },
            { name: '6. RIWAYAT_GEN', desc: 'Log Pembuatan Berkas' },
          ].map((sheet) => (
            <div key={sheet.name} className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-center">
              <div className="text-xs font-bold text-blue-900">{sheet.name}</div>
              <div className="text-[10px] text-blue-700 mt-0.5">{sheet.desc}</div>
            </div>
          ))}
        </div>

        {/* Apps Script Box */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Skrip Backend Google Apps Script (Code.gs)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-400/30">
                  Versi 2.0 (Support 6 Sheet)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Salin skrip ini dan tempel di Google Spreadsheet (Ekstensi &gt; Apps Script).
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer self-start sm:self-auto shadow-md"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Kode Code.gs'}</span>
            </button>
          </div>

          {/* URL Input & Action Buttons */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-300">
              URL Aplikasi Web Google Apps Script (berakhiran <code className="text-cyan-300 font-mono">/exec</code>):
            </label>
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <input
                type="url"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                placeholder="Tempel URL Web App: https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-slate-800 text-white placeholder-slate-500 text-xs px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                onClick={handleTestConnection}
                disabled={isTesting || isSyncing}
                type="button"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50 justify-center whitespace-nowrap"
                title="Cek apakah URL Web App aktif dan dapat diakses"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
              </button>
              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                type="button"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap justify-center shadow-lg shadow-emerald-700/20"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          </div>

          {/* Sync Status Feedback Card */}
          {syncResult && (
            <div
              className={`p-4 rounded-xl text-xs space-y-2.5 border transition-all ${
                syncResult.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : syncResult.type === 'error'
                  ? 'bg-red-950/70 border-red-500/60 text-red-200'
                  : 'bg-blue-950/60 border-blue-500/50 text-blue-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {syncResult.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span>
                  {syncResult.type === 'success'
                    ? 'Sinkronisasi Berhasil!'
                    : syncResult.code === 'URL_NOT_FOUND'
                    ? 'Gagal: URL Google Apps Script Tidak Ditemukan (Error 404)'
                    : syncResult.code === 'PERMISSION_DENIED'
                    ? 'Gagal: Akses Dibatasi (Otorisasi Google Diperlukan)'
                    : 'Gagal Menyambungkan ke Google Spreadsheet'}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-95 pl-7">{syncResult.message}</p>
              {syncResult.details && (
                <div className="text-[11px] bg-black/30 p-2.5 rounded-lg border border-white/10 ml-7 space-y-1">
                  <span className="font-semibold text-amber-300">💡 Petunjuk Perbaikan:</span>
                  <p className="opacity-90">{syncResult.details}</p>
                </div>
              )}

              {/* Special 404 Quick Action Box */}
              {syncResult.code === 'URL_NOT_FOUND' && (
                <div className="ml-7 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-amber-200 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Langkah Pasti Menyalin URL Web App yang Benar (Bukan Error 404):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-amber-100">
                    <li>Buka tab spreadsheet Anda &gt; menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
                    <li>Di pojok kanan atas editor, klik tombol biru <strong>Terapkan (Deploy)</strong>.</li>
                    <li>Pilih <strong>Kelola penerapan (Manage deployments)</strong>.</li>
                    <li>Pada baris <strong>Aplikasi Web (Web App)</strong>, klik tombol <strong>Salin (Copy)</strong> pada URL yang berakhiran <code className="bg-black/40 px-1 py-0.5 rounded text-cyan-300 font-mono">/exec</code>.</li>
                    <li><strong className="text-white">PENTING:</strong> JANGAN menyalin URL dari address bar browser editor (<code className="bg-black/40 px-1 py-0.5 rounded text-red-300 font-mono">script.google.com/home/projects/...</code>) karena itu adalah ID Proyek yang tidak dapat diakses publik.</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* VISUAL TROUBLESHOOTING & 5-STEP SETUP GUIDE (Expandable) */}
        {showTroubleshoot && (
          <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl p-5 sm:p-6 space-y-5 text-slate-800 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Panduan Lengkap Sinkronisasi Google Spreadsheet SMKN 1 Bebandem
                </h3>
                <p className="text-xs text-slate-600">
                  Pahami penyebab kendala koneksi &amp; ikuti panduan berikut:
                </p>
              </div>
            </div>

            {/* Comparison Box: Benar vs Salah */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-red-100/80 border border-red-300 rounded-xl space-y-1 text-red-950">
                <div className="font-bold flex items-center gap-1 text-red-800">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>CONTOH URL YANG SALAH (Akan Error 404 / Gagal):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90 font-mono">
                  <li>https://docs.google.com/spreadsheets/d/... (Link file Spreadsheet)</li>
                  <li>https://script.google.com/home/projects/.../edit (URL address bar editor)</li>
                  <li>https://script.google.com/macros/s/.../dev (URL tes pribadi)</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-xl space-y-1 text-emerald-950">
                <div className="font-bold flex items-center gap-1 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>CONTOH URL YANG BENAR (100% Berhasil):</span>
                </div>
                <div className="font-mono text-[11px] bg-white/80 p-2 rounded border border-emerald-300 break-all text-emerald-900">
                  https://script.google.com/macros/s/AKfyc.../exec
                </div>
                <p className="text-[11px] text-emerald-800 font-sans">
                  Didapat dari: Tombol <strong>Terapkan &gt; Kelola Penerapan &gt; Salin URL Aplikasi Web</strong>.
                </p>
              </div>
            </div>

            {/* Crucial Golden Rule Banner */}
            <div className="p-3.5 bg-red-100 border border-red-300 rounded-xl text-xs text-red-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-red-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>PENGATURAN AKSES WAJIB ("SIAPA SAJA / ANYONE"):</span>
              </div>
              <p className="leading-relaxed">
                Saat melakukan <strong>Terapkan (Deploy)</strong> di Google Apps Script, pengaturan <strong>"Siapa yang memiliki akses" (Who has access)</strong> secara bawaan disetel ke <em>"Hanya saya" (Only myself)</em>. Akibatnya, Google menolak kiriman data dari luar!
                <br />
                <strong>Solusinya:</strong> Buka <strong>Terapkan &gt; Kelola Penerapan &gt; Edit (ikon pensil)</strong> &gt; ubah opsi akses menjadi: <strong>"Siapa saja" (Anyone)</strong> &gt; klik <strong>Terapkan</strong>.
              </p>
            </div>

            {/* 5-Step Visual Checklist */}
            <div className="space-y-3">
              {[
                {
                  step: '1',
                  title: 'Buka Google Spreadsheet Baru',
                  desc: 'Buka browser dan ketik sheets.new untuk membuat Google Spreadsheet kosong baru. Beri judul file, contoh: "DATABASE ADMINISTRASI SMKN 1 BEBANDEM".',
                },
                {
                  step: '2',
                  title: 'Buka Menu Ekstensi > Apps Script',
                  desc: 'Di menu atas Google Spreadsheet, klik tab "Ekstensi" (Extensions) > lalu klik "Apps Script". Jendela editor kode Google akan terbuka.',
                },
                {
                  step: '3',
                  title: 'Hapus Kode Bawaan & Tempel Kode Code.gs',
                  desc: 'Hapus tulisan bawaan function myFunction() {}. Klik tombol biru "Salin Kode Code.gs" di atas, tempel ke editor, lalu klik ikon DISKET (Simpan / Save atau Ctrl+S).',
                },
                {
                  step: '4',
                  title: 'Terapkan sebagai Aplikasi Web (PENTING!)',
                  desc: 'Klik tombol biru Terapkan (Deploy) di kanan atas > pilih Penerapan baru (New deployment). Pilih jenis: Aplikasi web (Web app). Deskripsi: SI GURU SMKN 1 Bebandem. Jalankan sebagai: Saya. PENTING: "Siapa yang memiliki akses" PILIH: "Siapa saja" (Anyone). Klik Terapkan dan setujui izin akses Google (Review Permissions > Akun Anda > Advanced / Lanjutan > Go to SI GURU / tidak aman > Allow / Izinkan).',
                },
                {
                  step: '5',
                  title: 'Salin URL Web App (/exec) ke SI GURU',
                  desc: 'Salin URL Aplikasi web yang diberikan Google (berakhiran "/exec", BUKAN link spreadsheet biasa). Tempel di kolom input SI GURU di atas dan klik "Sinkronkan Sekarang"!',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-amber-200/80 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-slate-900">{item.title}</div>
                    <div className="text-slate-600 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Multi-Sheet Direct CSV Exports Grid */}
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3">
              <div className="text-xs text-emerald-900">
                <span className="font-bold flex items-center gap-1.5 text-emerald-800 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Alternatif Instan: Unduh Format 6 Sheet Langsung (CSV Siap Pakai)</span>
                </span>
                <p className="mt-1">
                  Jika Anda terburu-buru atau jaringan sekolah membatasi script eksternal, Anda dapat mengunduh file CSV masing-masing sheet di bawah ini, lalu buka Google Spreadsheet dan klik <em>File &gt; Impor &gt; Upload</em>.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const csv = exportTableToCSV('guru', records);
                    downloadCSV('1_DATA_GURU_SMKN1Bebandem.csv', csv);
                  }}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>1. DATA_GURU.csv</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const csv = exportTableToCSV('pembelajaran', records);
                    downloadCSV('2_DATA_PEMBELAJARAN_SMKN1Bebandem.csv', csv);
                  }}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>2. DATA_PEMBELAJARAN.csv</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const csv = exportTableToCSV('tp', records);
                    downloadCSV('3_DATA_TUJUAN_PEMBELAJARAN.csv', csv);
                  }}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>3. DATA_TUJUAN.csv</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const csv = exportTableToCSV('dokumen', records);
                    downloadCSV('4_DOKUMEN_ADMINISTRASI.csv', csv);
                  }}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>4. DOKUMEN_ADMIN.csv</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const csv = exportTableToCSV('penilaian', records);
                    downloadCSV('5_DATA_PENILAIAN_SISWA.csv', csv);
                  }}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>5. DATA_PENILAIAN.csv</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const csv = exportTableToCSV('semua', records);
                    downloadCSV('6_RIWAYAT_GENERATOR.csv', csv);
                  }}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>6. RIWAYAT_GEN.csv</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SAVED RECORDS SEARCH & FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama guru, mata pelajaran, atau topik pembelajaran..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Semua Mata Pelajaran</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Semua Kelas</option>
              <option value="X (Sepuluh)">Kelas X</option>
              <option value="XI (Sebelas)">Kelas XI</option>
              <option value="XII (Dua Belas)">Kelas XII</option>
            </select>

            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="ALL">Semua Semester</option>
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>
        </div>

        {/* SAVED RECORDS LIST */}
        <div className="space-y-3 pt-2">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Tidak ada data administrasi tersimpan yang cocok dengan filter.
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const docCount = Object.keys(rec.documents || {}).length;
              return (
                <div
                  key={rec.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all bg-white hover:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {rec.teacher.grade} &bull; {rec.teacher.semester}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Update: {new Date(rec.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{rec.title}</h3>
                    <p className="text-xs text-slate-600">
                      Guru: <span className="font-semibold text-slate-800">{rec.teacher.teacherName}</span> &bull; Topik:{' '}
                      <span className="text-blue-700">{rec.learning.topic}</span>
                    </p>
                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-1">
                      <span>{docCount} Administrasi Lengkap Tersimpan</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => onLoadRecord(rec)}
                      className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka &amp; Edit</span>
                    </button>
                    <button
                      onClick={() => onDuplicateRecord(rec)}
                      className="p-2 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
                      title="Duplikasi Dokumen ini untuk Pembelajaran Baru"
                    >
                      <DuplicateIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Apakah Anda yakin ingin menghapus arsip administrasi "${rec.title}"?`)) {
                          onDeleteRecord(rec.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
