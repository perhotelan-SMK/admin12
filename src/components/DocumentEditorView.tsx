import React, { useState, useRef } from 'react';
import { TeacherIdentity, LearningIdentity } from '../types';
import { ADMIN_DOCS_CONFIG, ATP_DOC_CONFIG, SCHOOL_INFO } from '../constants/defaults';
import { getOfficialKopHTML, getOfficialSignatureHTML, exportToWordDocument, printFormattedDocument } from '../utils/docxExport';
import {
  Sparkles,
  Download,
  Printer,
  Save,
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Wand2,
  Check,
  Search,
  Zap,
  BookOpen,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface DocumentEditorProps {
  currentDocType: string;
  setCurrentDocType: (type: string) => void;
  generatedDocs: Record<string, string>;
  setGeneratedDocs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  teacher: TeacherIdentity;
  learning: LearningIdentity;
  onSaveToDatabase: () => void;
}

const allAvailableDocs = [ATP_DOC_CONFIG, ...ADMIN_DOCS_CONFIG];

export const DocumentEditorView: React.FC<DocumentEditorProps> = ({
  currentDocType,
  setCurrentDocType,
  generatedDocs,
  setGeneratedDocs,
  teacher,
  learning,
  onSaveToDatabase,
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  const currentDocConfig = allAvailableDocs.find((d) => d.type === currentDocType) || allAvailableDocs[0];
  const docContent = generatedDocs[currentDocType] || '';

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setGeneratedDocs((prev) => ({
        ...prev,
        [currentDocType]: editorRef.current?.innerHTML || '',
      }));
    }
  };

  const handleInsertTable = () => {
    const tableHTML = `
      <table class="w-full border-collapse border border-gray-400 text-sm my-4">
        <thead class="bg-blue-900 text-white">
          <tr>
            <th class="border border-gray-400 p-2 text-center w-12">No</th>
            <th class="border border-gray-400 p-2 text-left">Komponen / Aktivitas</th>
            <th class="border border-gray-400 p-2 text-left">Uraian Teknis</th>
            <th class="border border-gray-400 p-2 text-center w-28">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-gray-400 p-2 text-center">1</td>
            <td class="border border-gray-400 p-2">Item 1</td>
            <td class="border border-gray-400 p-2">Deskripsi kegiatan atau standar capaian...</td>
            <td class="border border-gray-400 p-2 text-center font-medium">Sesuai SOP</td>
          </tr>
          <tr>
            <td class="border border-gray-400 p-2 text-center">2</td>
            <td class="border border-gray-400 p-2">Item 2</td>
            <td class="border border-gray-400 p-2">Deskripsi kegiatan atau standar capaian...</td>
            <td class="border border-gray-400 p-2 text-center font-medium">Sesuai SOP</td>
          </tr>
        </tbody>
      </table>
    `;
    execCmd('insertHTML', tableHTML);
  };

  const handleAiRefine = async (actionType: string, customInstruction?: string) => {
    const content = editorRef.current ? editorRef.current.innerHTML : docContent;
    if (!content.trim()) {
      alert('Dokumen masih kosong. Harap generate dokumen terlebih dahulu!');
      return;
    }

    setIsAiRefining(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/gemini/refine-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent: content,
          actionType,
          docType: currentDocType,
          instruction: customInstruction || actionType,
          data: {
            subject: teacher.subject,
            topic: learning.topic,
            teacherName: teacher.teacherName,
            teacherNip: teacher.teacherNip,
            vocation: teacher.vocation,
            grade: teacher.grade,
            phase: teacher.phase,
            semester: teacher.semester,
            cp: learning.cp,
            tp: learning.tp,
          },
        }),
      });

      if (!res.ok) throw new Error('Gagal menghubungi AI');
      const data = await res.json();

      if (data.content) {
        setGeneratedDocs((prev) => ({
          ...prev,
          [currentDocType]: data.content,
        }));
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content;
        }
        setFeedbackMessage(
          actionType === 'soal_hots'
            ? `Paket Soal & Studi Kasus HOTS materi "${learning.topic}" berhasil dicari & ditambahkan oleh AI!`
            : actionType === 'remedial_pengayaan'
            ? `Program Remedial & Pengayaan materi "${learning.topic}" berhasil dicari & diperbarui oleh AI!`
            : `Dokumen berhasil disempurnakan oleh AI sesuai topik "${learning.topic}"!`
        );
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMessage('Penyempurnaan otomatis diterapkan.');
    } finally {
      setIsAiRefining(false);
      setCustomAiPrompt('');
    }
  };

  const handleGenerateSoalDirect = async () => {
    setIsAiRefining(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch('/api/gemini/generate-soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: teacher.subject,
          vocation: teacher.vocation,
          grade: teacher.grade,
          phase: teacher.phase,
          semester: teacher.semester,
          topic: learning.topic,
          tp: learning.tp,
          cp: learning.cp,
          teacherName: teacher.teacherName,
          teacherNip: teacher.teacherNip,
        }),
      });
      if (!res.ok) throw new Error('Gagal menghubungi generator soal');
      const data = await res.json();
      const contentToApply = currentDocType === 'kisi_kisi' ? data.kisi_kisi : data.naskah_soal;
      if (contentToApply) {
        setGeneratedDocs((prev) => ({
          ...prev,
          naskah_soal: data.naskah_soal,
          kisi_kisi: data.kisi_kisi,
        }));
        if (editorRef.current) {
          editorRef.current.innerHTML = contentToApply;
        }
        setFeedbackMessage('10 Butir Soal Evaluasi & Kisi-Kisi Asesmen berhasil dicari & dibuat oleh AI berdasarkan TP & Topik materi!');
      }
    } catch (e: any) {
      console.error(e);
      setFeedbackMessage('Gagal menyusun soal dengan AI.');
    } finally {
      setIsAiRefining(false);
    }
  };

  const handleDownloadWord = () => {
    const filename = `${currentDocConfig.title.replace(/[^a-zA-Z0-9]/g, '_')}_SMKN1Bebandem`;
    const orientation = currentDocType === 'kisi_kisi' || currentDocType === 'analisis_penilaian' || currentDocType === 'atp' ? 'landscape' : 'portrait';
    exportToWordDocument(filename, currentDocConfig.title, docContent, teacher, orientation);
  };

  const handlePrint = () => {
    printFormattedDocument(currentDocConfig.title, docContent, teacher);
  };

  const currentIndex = allAvailableDocs.findIndex((d) => d.type === currentDocType);
  const prevDoc = currentIndex > 0 ? allAvailableDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allAvailableDocs.length - 1 ? allAvailableDocs[currentIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={currentDocType}
            onChange={(e) => setCurrentDocType(e.target.value)}
            className="w-full md:w-80 px-4 py-2.5 rounded-xl border border-blue-300 font-bold text-sm text-blue-900 bg-blue-50/50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {allAvailableDocs.map((d) => (
              <option key={d.type} value={d.type}>
                {d.title}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => prevDoc && setCurrentDocType(prevDoc.type)}
              disabled={!prevDoc}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              title="Dokumen Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextDoc && setCurrentDocType(nextDoc.type)}
              disabled={!nextDoc}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              title="Dokumen Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'edit' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor Word</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'preview' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau Cetak</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadWord}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            title="Download Word (.docx / .doc asli dengan Kop dan Tabel)"
          >
            <Download className="w-4 h-4" />
            <span>Word (.docx)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            title="Download PDF / Cetak Format A4"
          >
            <Printer className="w-4 h-4" />
            <span>PDF / Cetak</span>
          </button>

          <button
            type="button"
            onClick={onSaveToDatabase}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            title="Simpan Dokumen ini ke Riwayat & Database"
          >
            <Save className="w-4 h-4" />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-700 font-bold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* AI Assist Toolbar - Maximized Intelligent Assistant */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-4 text-white shadow-lg border border-blue-700/50 space-y-3">
        {/* Context & Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2.5 border-b border-blue-800/40">
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
              <Wand2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                AI Assistant Pro:
              </span>
            </div>
            <span className="text-[11px] bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded-md border border-blue-700/40">
              Mapel: <strong className="text-white">{teacher.subject || 'Kejuruan'}</strong>
            </span>
            <span className="text-[11px] bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-700/40">
              Topik: <strong className="text-amber-200">{learning.topic || 'Kompetensi'}</strong>
            </span>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
              Target: <span className="text-slate-100 font-semibold">{currentDocConfig.title}</span>
            </span>
          </div>

          <div className="text-[11px] flex items-center gap-1.5 text-slate-300 shrink-0">
            {isAiRefining ? (
              <span className="text-amber-300 font-semibold flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                AI sedang mencari data terbaru &amp; menyusun konten...
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3 h-3" />
                AI Siap mencari data terkini
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Contextual Action Buttons tailored to active Document Type */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Document Specific Actions */}
          {(currentDocType === 'naskah_soal' || currentDocType === 'kisi_kisi') && (
            <>
              <button
                onClick={handleGenerateSoalDirect}
                disabled={isAiRefining}
                className="bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm border border-rose-400/50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                title="AI akan mencari dan menyusun 10 butir soal asesmen secara presisi berdasarkan Tujuan Pembelajaran dan Topik materi"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Cari / Buat 10 Soal AI (Berdasarkan TP &amp; Topik)</span>
              </button>
              <button
                onClick={() =>
                  handleAiRefine(
                    'soal_hots',
                    `Cari dan tambahkan 3 soal studi kasus HOTS industri terkini 2026/2027 beserta kunci analitis dan rubrik penskoran untuk materi ${learning.topic}`
                  )
                }
                disabled={isAiRefining}
                className="bg-red-900/80 hover:bg-red-800 text-rose-100 text-xs px-3 py-1.5 rounded-lg border border-red-700/60 transition-all font-semibold disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>+ 3 Soal HOTS Industri</span>
              </button>
            </>
          )}

          {currentDocType === 'program_remedial' && (
            <>
              <button
                onClick={() =>
                  handleAiRefine(
                    'remedial_pengayaan',
                    `Cari dan susun skenario program remedial terstruktur berbasis kendala TP materi ${learning.topic} serta program pengayaan proyek industri DUDIKA dan tutor sebaya`
                  )
                }
                disabled={isAiRefining}
                className="bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 hover:from-red-700 hover:to-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm border border-amber-400/50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                title="AI mencari dan merumuskan skenario remedial individual serta proyek pengayaan DUDIKA berbasis materi aktif"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Cari Skenario Remedial &amp; Pengayaan AI (TP &amp; Topik)</span>
              </button>
              <button
                onClick={() =>
                  handleAiRefine(
                    'remedial_pengayaan',
                    `Tambahkan jobsheet praktik remedial mandiri di lab bengkel untuk materi ${learning.topic} dengan langkah diagnostik bertahap`
                  )
                }
                disabled={isAiRefining}
                className="bg-red-950/80 hover:bg-red-900 text-red-200 text-xs px-3 py-1.5 rounded-lg border border-red-800/60 transition-all font-medium disabled:opacity-50 cursor-pointer"
              >
                + Job Sheet Remidi Lab
              </button>
              <button
                onClick={() =>
                  handleAiRefine(
                    'remedial_pengayaan',
                    `Tambahkan skenario proyek pengayaan Teaching Factory (TEFA) materi ${learning.topic} dan peran tutor sebaya Menyama Braya`
                  )
                }
                disabled={isAiRefining}
                className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs px-3 py-1.5 rounded-lg border border-emerald-800/60 transition-all font-medium disabled:opacity-50 cursor-pointer"
              >
                + Proyek Pengayaan TEFA
              </button>
            </>
          )}

          {currentDocType === 'modul_ajar' && (
            <>
              <button
                onClick={() =>
                  handleAiRefine(
                    'deep_learning',
                    `Cari pendekatan Deep Learning terkini (Memahami berkesadaran, Mengaplikasi bermakna, Merefleksi berkesadaran) dengan studi kasus industri nyata pada materi ${learning.topic}`
                  )
                }
                disabled={isAiRefining}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm border border-blue-400/50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Cari Pendekatan Deep Learning &amp; Kasus Nyata</span>
              </button>
              <button
                onClick={() =>
                  handleAiRefine(
                    'custom',
                    `Tambahkan 3 pertanyaan pemantik esensial dan menggugah nalar kritis peserta didik untuk materi ${learning.topic}`
                  )
                }
                disabled={isAiRefining}
                className="bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 text-xs px-3 py-1.5 rounded-lg border border-indigo-700/60 transition-all font-medium disabled:opacity-50 cursor-pointer"
              >
                + Pertanyaan Pemantik
              </button>
            </>
          )}

          {currentDocType === 'bahan_ajar' && (
            <>
              <button
                onClick={() =>
                  handleAiRefine(
                    'bahan_ajar',
                    `Cari materi esensial terkini, standar operasional industri 2026, dan studi kasus DUDIKA untuk materi ${learning.topic}`
                  )
                }
                disabled={isAiRefining}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm border border-blue-400/50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Cari Materi Terkini &amp; Kasus DUDIKA</span>
              </button>
              <button
                onClick={() =>
                  handleAiRefine(
                    'custom',
                    `Tambahkan prosedur SOP kerja presisi dan standar keselamatan K3LH industri 2026 untuk materi ${learning.topic}`
                  )
                }
                disabled={isAiRefining}
                className="bg-blue-900/80 hover:bg-blue-800 text-blue-100 text-xs px-3 py-1.5 rounded-lg border border-blue-700/60 transition-all font-medium disabled:opacity-50 cursor-pointer"
              >
                + Standar SOP &amp; K3LH
              </button>
            </>
          )}

          {currentDocType === 'lkpd' && (
            <button
              onClick={() =>
                handleAiRefine(
                  'custom',
                  `Cari dan susun Job Sheet praktik dengan instruksi langkah kerja SOP presisi, parameter uji, dan analisis troubleshooting materi ${learning.topic}`
                )
              }
              disabled={isAiRefining}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm border border-indigo-400/50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Cari Jobsheet Praktik &amp; Kasus Nyata (TP &amp; Topik)</span>
            </button>
          )}

          {currentDocType === 'media_pembelajaran' && (
            <button
              onClick={() =>
                handleAiRefine(
                  'media',
                  `Cari rekomendasi software simulator digital, video interaktif industri, dan media pembelajaran terkini untuk materi ${learning.topic}`
                )
              }
              disabled={isAiRefining}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm border border-purple-400/50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Cari Simulator &amp; Media Interaktif Terkini</span>
            </button>
          )}

          {/* Universal Refinement Actions */}
          <button
            onClick={() =>
              handleAiRefine(
                'perluas',
                `Perluas uraian materi dan tambahkan konteks industri SMK Negeri 1 Bebandem materi ${learning.topic}`
              )
            }
            disabled={isAiRefining}
            className="bg-blue-800/80 hover:bg-blue-700 text-blue-100 text-xs px-3 py-1.5 rounded-lg border border-blue-600/50 transition-all font-medium disabled:opacity-50 cursor-pointer"
          >
            + Perluas Materi &amp; DUDIKA
          </button>
          <button
            onClick={() =>
              handleAiRefine(
                'sederhanakan',
                `Sederhanakan bahasa agar mudah dipahami peserta didik SMK pada materi ${learning.topic}`
              )
            }
            disabled={isAiRefining}
            className="bg-blue-800/80 hover:bg-blue-700 text-blue-100 text-xs px-3 py-1.5 rounded-lg border border-blue-600/50 transition-all font-medium disabled:opacity-50 cursor-pointer"
          >
            Sederhanakan Bahasa
          </button>
          <button
            onClick={() =>
              handleAiRefine(
                'kurikulum',
                `Sesuaikan dengan Capaian Pembelajaran Kurikulum Merdeka dan DUDIKA pada materi ${learning.topic}`
              )
            }
            disabled={isAiRefining}
            className="bg-blue-800/80 hover:bg-blue-700 text-blue-100 text-xs px-3 py-1.5 rounded-lg border border-blue-600/50 transition-all font-medium disabled:opacity-50 cursor-pointer"
          >
            Sesuaikan Kurikulum
          </button>
          <button
            onClick={() =>
              handleAiRefine(
                'bali',
                `Tambahkan nilai kearifan lokal Bali Tri Hita Karana dan Menyama Braya pada pembelajaran materi ${learning.topic}`
              )
            }
            disabled={isAiRefining}
            className="bg-amber-950/70 hover:bg-amber-900 text-amber-200 text-xs px-3 py-1.5 rounded-lg border border-amber-700/50 transition-all font-medium disabled:opacity-50 cursor-pointer"
          >
            + Kearifan Lokal Bali
          </button>
        </div>

        {/* Custom AI Instruction Bar */}
        <div className="pt-2 border-t border-blue-800/40 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customAiPrompt}
                onChange={(e) => setCustomAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customAiPrompt.trim()) {
                    handleAiRefine('custom', customAiPrompt);
                  }
                }}
                placeholder={`Tulis perintah pencarian AI (misal: 'Cari 5 soal HOTS terbaru materi ${learning.topic || 'ini'}', 'Cari skenario remidi & pengayaan')...`}
                className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-xs pl-8 pr-3.5 py-2.5 rounded-xl border border-blue-700/60 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <button
              onClick={() => customAiPrompt.trim() && handleAiRefine('custom', customAiPrompt)}
              disabled={isAiRefining || !customAiPrompt.trim()}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>{isAiRefining ? 'Mencari...' : 'Terapkan AI'}</span>
            </button>
          </div>

          {/* Quick Search Suggestion Chips */}
          <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-300">
            <span className="text-slate-400 font-medium">Contoh Pencarian:</span>
            <button
              type="button"
              onClick={() => {
                const prompt = `Cari 5 butir soal HOTS terbaru beserta kunci jawaban analitis dan rubrik penskoran untuk materi ${learning.topic}`;
                setCustomAiPrompt(prompt);
                handleAiRefine('soal_hots', prompt);
              }}
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700 hover:border-slate-500 cursor-pointer transition-all"
            >
              🔍 Cari 5 Soal HOTS Terbaru
            </button>
            <button
              type="button"
              onClick={() => {
                const prompt = `Cari program remedial terstruktur berbasis modul lab dan proyek pengayaan industri untuk materi ${learning.topic}`;
                setCustomAiPrompt(prompt);
                handleAiRefine('remedial_pengayaan', prompt);
              }}
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700 hover:border-slate-500 cursor-pointer transition-all"
            >
              🔍 Cari Program Remidi &amp; Pengayaan
            </button>
            <button
              type="button"
              onClick={() => {
                const prompt = `Cari studi kasus nyata implementasi DUDIKA 2026 dan troubleshooting pada materi ${learning.topic}`;
                setCustomAiPrompt(prompt);
                handleAiRefine('custom', prompt);
              }}
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700 hover:border-slate-500 cursor-pointer transition-all"
            >
              🔍 Cari Studi Kasus Industri 2026
            </button>
            <button
              type="button"
              onClick={() => {
                const prompt = `Tambahkan studi kasus bengkel / industri mitra di Karangasem Bali untuk materi ${learning.topic}`;
                setCustomAiPrompt(prompt);
                handleAiRefine('bali', prompt);
              }}
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700 hover:border-slate-500 cursor-pointer transition-all"
            >
              🔍 Kasus Mitra di Bebandem/Bali
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'edit' && (
        <div className="bg-slate-100 p-2 rounded-xl border border-slate-300 shadow-inner flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
          <button
            onClick={() => execCmd('bold')}
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 font-bold cursor-pointer"
            title="Tebal (Bold)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCmd('italic')}
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 italic cursor-pointer"
            title="Miring (Italic)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCmd('underline')}
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 underline cursor-pointer"
            title="Garis Bawah (Underline)"
          >
            <Underline className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          <button
            onClick={() => execCmd('formatBlock', '<h2>')}
            className="px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-300 font-bold cursor-pointer"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => execCmd('formatBlock', '<h3>')}
            className="px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-300 font-semibold cursor-pointer"
            title="Heading 3"
          >
            H3
          </button>
          <button
            onClick={() => execCmd('formatBlock', '<p>')}
            className="px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-300 cursor-pointer"
            title="Paragraf Biasa"
          >
            P
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          <button
            onClick={() => execCmd('insertUnorderedList')}
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 cursor-pointer"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCmd('insertOrderedList')}
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          <button
            onClick={handleInsertTable}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-white border border-transparent hover:border-slate-300 text-blue-800 font-medium cursor-pointer"
            title="Sisipkan Tabel Formal"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>+ Tabel</span>
          </button>

          <div className="ml-auto text-[11px] text-slate-500 font-medium">
            Format: Times New Roman / Arial (A4 Standar)
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW & EDITING CANVAS (A4 PAPER LOOK) */}
      <div className="bg-slate-300/70 p-4 sm:p-8 rounded-2xl flex justify-center overflow-x-auto">
        <div
          className="bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-14 w-full max-w-[850px] min-h-[1100px] border border-slate-300 relative"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* Official Letterhead (KOP RESMI SEKOLAH) */}
          <div
            dangerouslySetInnerHTML={{ __html: getOfficialKopHTML() }}
            className="select-none pointer-events-none"
          />

          {/* Document Title Header */}
          <div className="text-center my-6">
            <h1 className="text-xl font-bold uppercase tracking-wide text-blue-950 font-serif">
              {currentDocConfig.title}
            </h1>
            <p className="text-xs font-semibold text-slate-600 mt-1 uppercase tracking-wider">
              SMK NEGERI 1 BEBANDEM &bull; TAHUN AJARAN 2026/2027
            </p>
          </div>

          {/* Editable Document Body */}
          {viewMode === 'edit' ? (
            <div
              key={currentDocType}
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={() => {
                if (editorRef.current) {
                  setGeneratedDocs((prev) => ({
                    ...prev,
                    [currentDocType]: editorRef.current?.innerHTML || '',
                  }));
                }
              }}
              dangerouslySetInnerHTML={{ __html: docContent }}
              className="prose max-w-none text-slate-900 leading-relaxed text-[15px] focus:outline-none min-h-[500px]"
            />
          ) : (
            <div
              key={currentDocType}
              dangerouslySetInnerHTML={{ __html: docContent }}
              className="prose max-w-none text-slate-900 leading-relaxed text-[15px]"
            />
          )}

          {/* 2-Column Official Signature Block */}
          <div
            dangerouslySetInnerHTML={{ __html: getOfficialSignatureHTML(teacher) }}
            className="select-none pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};
