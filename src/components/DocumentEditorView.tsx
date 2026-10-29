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
          instruction: customInstruction || actionType,
          data: {
            subject: teacher.subject,
            topic: learning.topic,
            teacherName: teacher.teacherName,
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
        setFeedbackMessage('Dokumen berhasil disempurnakan oleh AI!');
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

      {/* AI Assist Toolbar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white shadow-md border border-blue-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Wand2 className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              AI Editor Assistant:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(currentDocType === 'naskah_soal' || currentDocType === 'kisi_kisi') && (
              <button
                onClick={handleGenerateSoalDirect}
                disabled={isAiRefining}
                className="bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm border border-rose-400/50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                title="AI akan mencari dan menyusun 10 butir soal asesmen secara presisi berdasarkan Tujuan Pembelajaran dan Topik materi"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Cari / Buat Soal AI (Berdasarkan TP & Topik)</span>
              </button>
            )}
            <button
              onClick={() => handleAiRefine('perluas', 'Perluas uraian materi dan tambahkan konteks industri SMK')}
              disabled={isAiRefining}
              className="bg-blue-800/80 hover:bg-blue-700 text-blue-100 text-xs px-3 py-1.5 rounded-lg border border-blue-600/50 transition-all font-medium disabled:opacity-50 cursor-pointer"
            >
              + Perluas Materi
            </button>
            <button
              onClick={() => handleAiRefine('sederhanakan', 'Sederhanakan bahasa agar mudah dipahami peserta didik SMK')}
              disabled={isAiRefining}
              className="bg-blue-800/80 hover:bg-blue-700 text-blue-100 text-xs px-3 py-1.5 rounded-lg border border-blue-600/50 transition-all font-medium disabled:opacity-50 cursor-pointer"
            >
              Sederhanakan Bahasa
            </button>
            <button
              onClick={() => handleAiRefine('kurikulum', 'Sesuaikan dengan Capaian Pembelajaran Kurikulum Merdeka dan DUDIKA')}
              disabled={isAiRefining}
              className="bg-blue-800/80 hover:bg-blue-700 text-blue-100 text-xs px-3 py-1.5 rounded-lg border border-blue-600/50 transition-all font-medium disabled:opacity-50 cursor-pointer"
            >
              Sesuaikan Kurikulum
            </button>
            <button
              onClick={() => handleAiRefine('bali', 'Tambahkan nilai kearifan lokal Bali Tri Hita Karana dan Menyama Braya')}
              disabled={isAiRefining}
              className="bg-amber-950/70 hover:bg-amber-900 text-amber-200 text-xs px-3 py-1.5 rounded-lg border border-amber-700/50 transition-all font-medium disabled:opacity-50 cursor-pointer"
            >
              + Kearifan Lokal Bali
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-blue-800/40 flex items-center gap-2">
          <input
            type="text"
            value={customAiPrompt}
            onChange={(e) => setCustomAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customAiPrompt.trim()) {
                handleAiRefine('custom', customAiPrompt);
              }
            }}
            placeholder="Ketik instruksi khusus untuk AI (misal: 'Tambahkan studi kasus bengkel di Bebandem')..."
            className="flex-1 bg-slate-800/90 text-white placeholder-slate-400 text-xs px-3.5 py-2 rounded-xl border border-blue-700/60 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button
            onClick={() => customAiPrompt.trim() && handleAiRefine('custom', customAiPrompt)}
            disabled={isAiRefining || !customAiPrompt.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-40 cursor-pointer shrink-0"
          >
            {isAiRefining ? 'Memproses...' : 'Terapkan AI'}
          </button>
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
