import React, { useState, useEffect } from 'react';
import {
  DEFAULT_TEACHER,
  DEFAULT_LEARNING,
  DEFAULT_METHODS,
  DEFAULT_SETTINGS,
  ADMIN_DOCS_CONFIG,
  INITIAL_STUDENTS,
} from './constants/defaults';
import { TeacherIdentity, LearningIdentity, LearningMethods, AdditionalSettings, StudentScore, SavedRecord } from './types';
import { Navbar } from './components/Navbar';
import { TeacherAndLearningForm } from './components/TeacherAndLearningForm';
import { AdminMenuDashboard } from './components/AdminMenuDashboard';
import { DocumentEditorView } from './components/DocumentEditorView';
import { AssessmentAnalysisView } from './components/AssessmentAnalysisView';
import { DatabaseHistoryView } from './components/DatabaseHistoryView';
import { exportToWordDocument } from './utils/docxExport';
import { generateSingleDoc, generateAllDocs } from './utils/documentGenerator';
import { Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('form');
  const [teacher, setTeacher] = useState<TeacherIdentity>(() => {
    const saved = localStorage.getItem('siguru_teacher');
    return saved ? JSON.parse(saved) : DEFAULT_TEACHER;
  });

  const [learning, setLearning] = useState<LearningIdentity>(() => {
    const saved = localStorage.getItem('siguru_learning');
    return saved ? JSON.parse(saved) : DEFAULT_LEARNING;
  });

  const [methods, setMethods] = useState<LearningMethods>(() => {
    const saved = localStorage.getItem('siguru_methods');
    return saved ? JSON.parse(saved) : DEFAULT_METHODS;
  });

  const [settings, setSettings] = useState<AdditionalSettings>(() => {
    const saved = localStorage.getItem('siguru_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [currentDocType, setCurrentDocType] = useState<string>('modul_ajar');
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('siguru_docs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) {
          if (parsed.modul_ajar && !parsed.modul_ajar.includes('A. IDENTITAS MODUL')) {
            parsed.modul_ajar = generateSingleDoc('modul_ajar', DEFAULT_TEACHER, DEFAULT_LEARNING, DEFAULT_METHODS, DEFAULT_SETTINGS);
          }
          return parsed;
        }
      } catch (e) {}
    }
    return generateAllDocs(DEFAULT_TEACHER, DEFAULT_LEARNING, DEFAULT_METHODS, DEFAULT_SETTINGS);
  });

  const [students, setStudents] = useState<StudentScore[]>(() => {
    const saved = localStorage.getItem('siguru_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>(() => {
    const saved = localStorage.getItem('siguru_records');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'rec-init-2026',
        title: 'Administrasi RPL Kelas XI Ganjil - Web & RESTful API',
        createdAt: '2026-08-01',
        updatedAt: '2026-08-15',
        teacher: DEFAULT_TEACHER,
        learning: DEFAULT_LEARNING,
        methods: DEFAULT_METHODS,
        settings: DEFAULT_SETTINGS,
        documents: {},
        assessment: {
          tps: ['TP1', 'TP2', 'TP3', 'TP4'],
          passingScore: 75,
          students: INITIAL_STUDENTS,
        },
      },
    ];
  });

  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; title: string }>({
    current: 0,
    total: 12,
    title: '',
  });
  const [generatingDocType, setGeneratingDocType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('siguru_teacher', JSON.stringify(teacher));
  }, [teacher]);

  useEffect(() => {
    localStorage.setItem('siguru_learning', JSON.stringify(learning));
  }, [learning]);

  useEffect(() => {
    localStorage.setItem('siguru_methods', JSON.stringify(methods));
  }, [methods]);

  useEffect(() => {
    localStorage.setItem('siguru_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('siguru_docs', JSON.stringify(generatedDocs));
  }, [generatedDocs]);

  useEffect(() => {
    localStorage.setItem('siguru_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('siguru_records', JSON.stringify(savedRecords));
  }, [savedRecords]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateSingle = async (docType: string) => {
    setGeneratingDocType(docType);
    try {
      const res = await fetch('/api/gemini/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          data: {
            ...teacher,
            ...learning,
            ...methods,
            ...settings,
          },
        }),
      });

      if (!res.ok) throw new Error('Gagal memproses');
      const data = await res.json();
      if (data.content) {
        setGeneratedDocs((prev) => ({
          ...prev,
          [docType]: data.content,
        }));
        showToast(`Dokumen "${data.title}" berhasil di-generate!`);
      }
    } catch (err: any) {
      console.warn('Using client generator for', docType);
      const fallbackContent = generateSingleDoc(docType, { teacher, learning, methods, settings });
      setGeneratedDocs((prev) => ({
        ...prev,
        [docType]: fallbackContent,
      }));
      showToast('Dokumen berhasil di-generate.');
    } finally {
      setGeneratingDocType(null);
    }
  };

  // Generate ALL 12 Documents with real-time visual progress
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    setBatchProgress({ current: 0, total: 12, title: 'Menyiapkan generator...' });

    const newDocs: Record<string, string> = { ...generatedDocs };

    try {
      // Step through each document with visual animation so the teacher sees the progress
      for (let i = 0; i < ADMIN_DOCS_CONFIG.length; i++) {
        const item = ADMIN_DOCS_CONFIG[i];
        setBatchProgress({
          current: i + 1,
          total: 12,
          title: item.title,
        });

        // Fast generation
        const content = generateSingleDoc(item.type, {
          teacher,
          learning,
          methods,
          settings,
        });
        newDocs[item.type] = content;

        // Small delay for smooth visual feedback
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      setGeneratedDocs(newDocs);
      setActiveTab('menu');
      showToast('Selamat! Seluruh 12 Administrasi Pembelajaran selesai dibuat & siap dicetak.');
    } catch (e) {
      console.error('Batch generation error:', e);
      // Emergency complete fallback
      const fullFallback = generateAllDocs({ teacher, learning, methods, settings });
      setGeneratedDocs(fullFallback);
      setActiveTab('menu');
      showToast('Seluruh 12 Dokumen Berhasil Dibuat!');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleSaveToDatabase = () => {
    const newRecord: SavedRecord = {
      id: `rec-${Date.now()}`,
      title: `${teacher.subject} - ${learning.topic.substring(0, 45)}...`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      teacher,
      learning,
      methods,
      settings,
      documents: generatedDocs,
      assessment: {
        tps: ['TP1', 'TP2', 'TP3', 'TP4'],
        passingScore: 75,
        students,
      },
    };

    setSavedRecords((prev) => [newRecord, ...prev]);
    showToast('Arsip administrasi berhasil disimpan ke Database lokal & siap disinkronkan ke Google Spreadsheet!');
  };

  const handleLoadRecord = (record: SavedRecord) => {
    setTeacher(record.teacher);
    setLearning(record.learning);
    setMethods(record.methods);
    setSettings(record.settings);
    if (record.documents) setGeneratedDocs(record.documents);
    if (record.assessment?.students) setStudents(record.assessment.students);
    setActiveTab('menu');
    showToast(`Arsip "${record.title}" berhasil dimuat ke editor.`);
  };

  const handleDuplicateRecord = (record: SavedRecord) => {
    const duplicated: SavedRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      title: `[Salinan] ${record.title}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setSavedRecords((prev) => [duplicated, ...prev]);
    showToast('Dokumen berhasil diduplikasi untuk pembelajaran berikutnya.');
  };

  const handleDeleteRecord = (id: string) => {
    setSavedRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Arsip dokumen berhasil dihapus.');
  };

  const handleSyncWebhook = async (
    url: string
  ): Promise<{ success: boolean; message: string; code?: string }> => {
    try {
      const currentRecord: SavedRecord = {
        id: `rec-${Date.now()}`,
        title: `${teacher.subject} - ${learning.topic}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        teacher,
        learning,
        methods,
        settings,
        documents: generatedDocs,
        assessment: {
          tps: ['TP1', 'TP2', 'TP3', 'TP4'],
          passingScore: 75,
          students,
        },
      };

      const res = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webAppUrl: url,
          record: currentRecord,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSavedRecords((prev) => {
          const exists = prev.some((r) => r.id === currentRecord.id);
          return exists ? prev : [currentRecord, ...prev];
        });
        showToast('Sinkronisasi Google Spreadsheet BERHASIL!');
        return {
          success: true,
          message: data.message || 'Data berhasil disinkronkan ke 6 Sheet Google Spreadsheet!',
          code: data.code,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Gagal menyambung ke Google Apps Script.',
          code: data.code,
        };
      }
    } catch (e: any) {
      console.error('Webhook sync failed:', e);
      return {
        success: false,
        message: `Koneksi gagal: ${e.message}. Pastikan server aktif dan URL Web App valid.`,
        code: 'NETWORK_ERROR',
      };
    }
  };

  const handleTestSheetsUrl = async (
    url: string
  ): Promise<{ success: boolean; message: string; code?: string }> => {
    try {
      const res = await fetch('/api/test-sheets-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webAppUrl: url }),
      });
      const data = await res.json();
      return {
        success: !!data.success,
        message: data.message || 'Pengujian koneksi selesai.',
        code: data.code,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Gagal menguji koneksi: ${e.message}`,
        code: 'NETWORK_ERROR',
      };
    }
  };

  const handleExportWord = (docType: string) => {
    const config = ADMIN_DOCS_CONFIG.find((d) => d.type === docType);
    const title = config ? config.title : (docType === 'atp' ? 'Alur Tujuan Pembelajaran (ATP)' : 'Dokumen Administrasi');
    let content = generatedDocs[docType];
    if (!content) {
      content = generateSingleDoc(docType, { teacher, learning, methods, settings });
      setGeneratedDocs((prev) => ({ ...prev, [docType]: content }));
    }
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_SMKN1Bebandem`;
    const orientation = docType === 'kisi_kisi' || docType === 'analisis_penilaian' || docType === 'atp' ? 'landscape' : 'portrait';
    exportToWordDocument(filename, title, content, teacher, orientation);
  };

  const handleUpdateAnalysisDoc = (analysisHtml: string, remedialHtml: string) => {
    setGeneratedDocs((prev) => ({
      ...prev,
      analisis_penilaian: analysisHtml,
      program_remedial: remedialHtml,
    }));
    showToast('Dokumen 11 & 12 telah diperbarui otomatis!');
  };

  const generatedCount = Object.keys(generatedDocs).filter((k) => generatedDocs[k]?.trim()).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white border-2 border-amber-400 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BATCH GENERATOR PROGRESS MODAL */}
      {isGeneratingAll && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-blue-900/30 text-center space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                AI SMART GENERATOR &bull; SMKN 1 BEBANDEM
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Menyusun 12 Administrasi Pembelajaran
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Mengintegrasikan data identitas, Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan format resmi sekolah...
              </p>
            </div>

            {/* Progress details */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Memproses: {batchProgress.title}</span>
                <span className="text-blue-700 font-extrabold">{batchProgress.current} / {batchProgress.total}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((batchProgress.current / batchProgress.total) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Mohon tunggu, dokumen akan otomatis terbuka di Dashboard begitu selesai.
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        generatedCount={generatedCount}
        onGenerateAll={handleGenerateAll}
        isGeneratingAll={isGeneratingAll}
      />

      {/* Main Container Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'form' && (
          <TeacherAndLearningForm
            teacher={teacher}
            setTeacher={setTeacher}
            learning={learning}
            setLearning={setLearning}
            methods={methods}
            setMethods={setMethods}
            settings={settings}
            setSettings={setSettings}
            onSave={handleSaveToDatabase}
            onProceedToMenu={() => setActiveTab('menu')}
            onOpenDocEditor={(docType) => {
              setCurrentDocType(docType);
              setActiveTab('editor');
            }}
            onUpdateGeneratedDoc={(docType, content) => {
              setGeneratedDocs((prev) => ({ ...prev, [docType]: content }));
            }}
            onExportWord={handleExportWord}
          />
        )}

        {activeTab === 'menu' && (
          <AdminMenuDashboard
            teacher={teacher}
            learning={learning}
            generatedDocs={generatedDocs}
            onSelectDoc={(type) => {
              setCurrentDocType(type);
              if (!generatedDocs[type]) {
                handleGenerateSingle(type);
              }
              setActiveTab('editor');
            }}
            onGenerateSingle={handleGenerateSingle}
            onGenerateAll={handleGenerateAll}
            isGeneratingAll={isGeneratingAll}
            generatingDocType={generatingDocType}
            onExportWord={handleExportWord}
          />
        )}

        {activeTab === 'editor' && (
          <DocumentEditorView
            currentDocType={currentDocType}
            setCurrentDocType={setCurrentDocType}
            generatedDocs={generatedDocs}
            setGeneratedDocs={setGeneratedDocs}
            teacher={teacher}
            learning={learning}
            onSaveToDatabase={handleSaveToDatabase}
          />
        )}

        {activeTab === 'assessment' && (
          <AssessmentAnalysisView
            students={students}
            setStudents={setStudents}
            teacher={teacher}
            learning={learning}
            onUpdateAnalysisDoc={handleUpdateAnalysisDoc}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseHistoryView
            records={savedRecords}
            onLoadRecord={handleLoadRecord}
            onDuplicateRecord={handleDuplicateRecord}
            onDeleteRecord={handleDeleteRecord}
            onSyncWebhook={handleSyncWebhook}
            onTestSheetsUrl={handleTestSheetsUrl}
          />
        )}
      </main>

      {/* Official School Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-bold text-white tracking-wide">
              SMK NEGERI 1 BEBANDEM &bull; TAHUN AJARAN 2026/2027
            </p>
            <p className="text-[11px] text-slate-400">
              Jl. Kuncara Giri, Sibetan, Bebandem, Karangasem, Bali. &bull; Kepala Sekolah:{' '}
              <span className="text-slate-200">I Wayan Darmayasa, S.T., M.Si.</span> (NIP. 19730522 200501 1 009)
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            SI GURU – Smart Administration Generator v2.0
          </div>
        </div>
      </footer>
    </div>
  );
}
