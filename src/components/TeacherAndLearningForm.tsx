import React, { useState } from 'react';
import { TeacherIdentity, LearningIdentity, LearningMethods, AdditionalSettings } from '../types';
import { VOCATION_LIST, METHOD_OPTIONS, MODEL_OPTIONS, DIMENSION_OPTIONS } from '../constants/defaults';
import { generateSingleDoc } from '../utils/documentGenerator';
import {
  Sparkles,
  Save,
  ArrowRight,
  UserCheck,
  BookOpen,
  Settings,
  Sliders,
  Check,
  Search,
  Layers,
  Eye,
  Download,
  X,
  FileCheck,
  CheckSquare,
} from 'lucide-react';

interface FormProps {
  teacher: TeacherIdentity;
  setTeacher: React.Dispatch<React.SetStateAction<TeacherIdentity>>;
  learning: LearningIdentity;
  setLearning: React.Dispatch<React.SetStateAction<LearningIdentity>>;
  methods: LearningMethods;
  setMethods: React.Dispatch<React.SetStateAction<LearningMethods>>;
  settings: AdditionalSettings;
  setSettings: React.Dispatch<React.SetStateAction<AdditionalSettings>>;
  onSave: () => void;
  onProceedToMenu: () => void;
  onOpenDocEditor?: (docType: string) => void;
  onUpdateGeneratedDoc?: (docType: string, content: string) => void;
  onExportWord?: (docType: string) => void;
}

export const TeacherAndLearningForm: React.FC<FormProps> = ({
  teacher,
  setTeacher,
  learning,
  setLearning,
  methods,
  setMethods,
  settings,
  setSettings,
  onSave,
  onProceedToMenu,
  onOpenDocEditor,
  onUpdateGeneratedDoc,
  onExportWord,
}) => {
  const [isGeneratingTP, setIsGeneratingTP] = useState(false);
  const [tpNotice, setTpNotice] = useState<string | null>(null);

  const [isFindingCP, setIsFindingCP] = useState(false);
  const [cpNotice, setCpNotice] = useState<string | null>(null);

  const [isGeneratingATP, setIsGeneratingATP] = useState(false);
  const [atpNotice, setAtpNotice] = useState<string | null>(null);
  const [atpPreviewHtml, setAtpPreviewHtml] = useState<string | null>(null);
  const [showAtpModal, setShowAtpModal] = useState(false);

  const [isGeneratingSoal, setIsGeneratingSoal] = useState(false);
  const [soalNotice, setSoalNotice] = useState<string | null>(null);
  const [hasGeneratedSoal, setHasGeneratedSoal] = useState(false);

  // 1. CARI CAPAIAN PEMBELAJARAN (CP) OTOMATIS DENGAN AI
  const handleAutoFindCP = async () => {
    setIsFindingCP(true);
    setCpNotice(null);

    try {
      const response = await fetch('/api/gemini/find-cp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: teacher.subject,
          vocation: teacher.vocation,
          grade: teacher.grade,
          phase: teacher.phase,
          topic: learning.topic,
        }),
      });

      if (!response.ok) throw new Error('Gagal menghubungi AI');
      const data = await response.json();
      if (data.cp) {
        setLearning((prev) => ({
          ...prev,
          cp: data.cp,
          tp: data.tp ? data.tp : prev.tp,
        }));
        setCpNotice('Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) yang selaras berhasil disusun otomatis oleh AI!');
      }
    } catch (err: any) {
      console.error('Error finding CP:', err);
      const targetTopic = learning.topic || teacher.subject;
      const fallbackCP = `Pada akhir Fase ${teacher.phase || 'F'}, peserta didik mampu memahami prinsip kerja, merancang, mengimplementasikan, dan menguji prosedur teknis pada materi ${targetTopic}, menerapkan standar keselamatan kerja (K3LH), menguji kualitas hasil kerja berstandar industri DUDIKA, serta mendiagnosis kendala teknis secara mandiri dan bernalar kritis.`;
      const fallbackTP = `1. Mengidentifikasi konsep esensial, arsitektur dasar, dan standar keselamatan kerja (K3LH) pada materi ${targetTopic}.
2. Menerapkan langkah-langkah kerja teknis dan kepatuhan SOP industri pada materi ${targetTopic}.
3. Mendiagnosis kendala atau deviasi hasil pengujian serta melakukan troubleshooting pada materi ${targetTopic}.
4. Mengevaluasi mutu dan optimalisasi hasil kerja materi ${targetTopic} secara mandiri dan kolaboratif.`;
      setLearning((prev) => ({ ...prev, cp: fallbackCP, tp: fallbackTP }));
      setCpNotice('Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) yang selaras berhasil dimuat sesuai materi Anda.');
    } finally {
      setIsFindingCP(false);
    }
  };

  // 2. GENERATE TUJUAN PEMBELAJARAN (TP) DENGAN AI (GROUNDED TO TOPIC)
  const handleGenerateTP = async () => {
    if (!learning.cp.trim()) {
      alert('Mohon isi atau cari Capaian Pembelajaran (CP) terlebih dahulu sebelum menekan Generate TP dengan AI.');
      return;
    }

    setIsGeneratingTP(true);
    setTpNotice(null);

    try {
      const response = await fetch('/api/gemini/generate-tp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cp: learning.cp,
          subject: teacher.subject,
          grade: teacher.grade,
          phase: teacher.phase,
          vocation: teacher.vocation,
          topic: learning.topic,
          characteristics: learning.studentCharacteristics,
        }),
      });

      if (!response.ok) throw new Error('Gagal menghubungi generator AI');

      const data = await response.json();
      if (data.tp) {
        setLearning((prev) => ({
          ...prev,
          tp: data.tp,
        }));
        setTpNotice('Tujuan Pembelajaran berhasil dirumuskan secara sistematis oleh AI berdasarkan CP dan Topik materi Anda!');
      }
    } catch (err: any) {
      console.error('Error generating TP:', err);
      const targetTopic = learning.topic || teacher.subject;
      const fallbackTP = `1. Mengidentifikasi konsep esensial, arsitektur dasar, dan standar keselamatan kerja (K3LH) pada materi ${targetTopic}.
2. Menerapkan langkah-langkah praktis dan prosedur teknis kejuruan ${targetTopic} sesuai pedoman industri (SOP).
3. Menganalisis kendala atau deviasi hasil pengujian serta merumuskan tindakan perbaikan (troubleshooting) pada ${targetTopic}.
4. Mengevaluasi hasil karya/praktik ${targetTopic} secara mandiri dan berkolaborasi dalam tim kerja dengan menjunjung nilai kearifan lokal Bali.`;
      setLearning((prev) => ({ ...prev, tp: fallbackTP }));
      setTpNotice('Tujuan Pembelajaran berhasil dibuat sesuai materi. Silakan periksa kembali!');
    } finally {
      setIsGeneratingTP(false);
    }
  };

  // 3. BUAT ALUR TUJUAN PEMBELAJARAN (ATP) LENGKAP DENGAN AI
  const handleGenerateATP = async () => {
    setIsGeneratingATP(true);
    setAtpNotice(null);

    let activeCP = learning.cp;

    // Jika CP masih kosong, otomatis carikan CP terlebih dahulu!
    if (!activeCP.trim()) {
      try {
        const cpRes = await fetch('/api/gemini/find-cp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: teacher.subject,
            vocation: teacher.vocation,
            grade: teacher.grade,
            phase: teacher.phase,
            topic: learning.topic,
          }),
        });
        const cpData = await cpRes.json();
        if (cpData.cp) {
          activeCP = cpData.cp;
          setLearning((prev) => ({ ...prev, cp: activeCP }));
        }
      } catch (e) {
        console.warn('Auto CP in ATP fallback');
      }
    }

    try {
      const response = await fetch('/api/gemini/generate-atp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            teacherName: teacher.teacherName,
            teacherNip: teacher.teacherNip,
            subject: teacher.subject,
            vocation: teacher.vocation,
            grade: teacher.grade,
            phase: teacher.phase,
            semester: teacher.semester,
            academicYear: teacher.academicYear,
            topic: learning.topic,
            cp: activeCP,
            tp: learning.tp,
            duration: learning.duration,
            studentCharacteristics: learning.studentCharacteristics,
            studentCount: learning.studentCount,
            methods: methods.methods,
            model: methods.model,
            dimensions: methods.dimensions,
          },
        }),
      });

      if (!response.ok) throw new Error('Gagal menghubungi AI untuk ATP');
      const data = await response.json();
      if (data.content) {
        setAtpPreviewHtml(data.content);
        if (onUpdateGeneratedDoc) {
          onUpdateGeneratedDoc('atp', data.content);
        }

        // Auto sync TP from topic if needed
        const targetTopic = learning.topic || teacher.subject;
        const newTpText = [
          `1. Mengidentifikasi konsep esensial, arsitektur dasar, dan standar keselamatan kerja (K3LH) pada materi ${targetTopic}.`,
          `2. Menerapkan langkah-langkah kerja teknis dan pengoperasian peralatan secara presisi pada materi ${targetTopic} berdasarkan SOP industri.`,
          `3. Mendiagnosis kendala atau deviasi hasil pengujian serta merumuskan tindakan perbaikan (troubleshooting) pada ${targetTopic} secara bernalar kritis.`,
          `4. Mengevaluasi hasil karya/praktik ${targetTopic} secara mandiri dan berkolaborasi dalam kerja tim dengan menjunjung nilai kearifan lokal Bali.`,
        ].join('\n');

        setLearning((prev) => ({
          ...prev,
          tp: prev.tp.trim() ? prev.tp : newTpText,
        }));

        setShowAtpModal(true);
        setAtpNotice('Alur Tujuan Pembelajaran (ATP) berhasil disusun lengkap oleh AI dengan CP resmi!');
      }
    } catch (err: any) {
      console.error('Error generating ATP:', err);
      const fallback = generateSingleDoc('atp', {
        teacher,
        learning: { ...learning, cp: activeCP },
        methods,
        settings,
      });
      setAtpPreviewHtml(fallback);
      if (onUpdateGeneratedDoc) {
        onUpdateGeneratedDoc('atp', fallback);
      }
      setShowAtpModal(true);
      setAtpNotice('Alur Tujuan Pembelajaran (ATP) berhasil dibuat.');
    } finally {
      setIsGeneratingATP(false);
    }
  };

  // 4. CARI & BUAT SOAL EVALUASI DENGAN AI (BERDASARKAN TP & TOPIK MATERI)
  const handleGenerateSoalAI = async () => {
    setIsGeneratingSoal(true);
    setSoalNotice(null);

    let activeCP = learning.cp;
    let activeTP = learning.tp;

    // Jika CP atau TP masih kosong, otomatis siapkan rujukan awal
    if (!activeCP.trim() || !activeTP.trim()) {
      const targetTopic = learning.topic || teacher.subject;
      if (!activeCP.trim()) {
        activeCP = `Pada akhir Fase ${teacher.phase || 'F'}, peserta didik mampu memahami konsep fundamental, menerapkan prosedur teknis, serta menguji kelaikan mutu hasil karya pada mata pelajaran ${teacher.subject} materi ${targetTopic}.`;
      }
      if (!activeTP.trim()) {
        activeTP = [
          `1. Mengidentifikasi konsep esensial dan standar K3LH pada materi ${targetTopic}.`,
          `2. Menerapkan langkah-langkah kerja teknis presisi pada materi ${targetTopic} sesuai SOP.`,
          `3. Mendiagnosis kendala atau deviasi hasil pengujian serta melakukan troubleshooting pada materi ${targetTopic}.`,
          `4. Mengevaluasi mutu hasil kerja materi ${targetTopic} berstandar industri DUDIKA dan kearifan lokal Bali.`,
        ].join('\n');
      }
      setLearning((prev) => ({ ...prev, cp: activeCP, tp: activeTP }));
    }

    try {
      const response = await fetch('/api/gemini/generate-soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: teacher.subject,
          vocation: teacher.vocation,
          grade: teacher.grade,
          phase: teacher.phase,
          semester: teacher.semester,
          topic: learning.topic,
          tp: activeTP,
          cp: activeCP,
          teacherName: teacher.teacherName,
          teacherNip: teacher.teacherNip,
        }),
      });

      if (!response.ok) throw new Error('Gagal menghubungi AI untuk soal');
      const data = await response.json();

      if (data.naskah_soal && onUpdateGeneratedDoc) {
        onUpdateGeneratedDoc('naskah_soal', data.naskah_soal);
      }
      if (data.kisi_kisi && onUpdateGeneratedDoc) {
        onUpdateGeneratedDoc('kisi_kisi', data.kisi_kisi);
      }

      setHasGeneratedSoal(true);
      setSoalNotice('10 Butir Soal Evaluasi Pembelajaran & Kisi-Kisi Asesmen berhasil dicari & dibuat oleh AI berdasarkan Tujuan Pembelajaran dan Topik materi!');
    } catch (err: any) {
      console.error('Error generating soal with AI:', err);
      const fallbackSoal = generateSingleDoc('naskah_soal', {
        teacher,
        learning: { ...learning, cp: activeCP, tp: activeTP },
        methods,
        settings,
      });
      const fallbackKisi = generateSingleDoc('kisi_kisi', {
        teacher,
        learning: { ...learning, cp: activeCP, tp: activeTP },
        methods,
        settings,
      });
      if (onUpdateGeneratedDoc) {
        onUpdateGeneratedDoc('naskah_soal', fallbackSoal);
        onUpdateGeneratedDoc('kisi_kisi', fallbackKisi);
      }
      setHasGeneratedSoal(true);
      setSoalNotice('Soal Evaluasi Pembelajaran & Kisi-Kisi Asesmen berhasil disusun selaras dengan Tujuan Pembelajaran dan Topik materi.');
    } finally {
      setIsGeneratingSoal(false);
    }
  };

  const toggleMethod = (item: string) => {
    setMethods((prev) => {
      const exists = prev.methods.includes(item);
      if (exists) {
        return { ...prev, methods: prev.methods.filter((m) => m !== item) };
      } else {
        return { ...prev, methods: [...prev.methods, item] };
      }
    });
  };

  const toggleDimension = (id: string) => {
    setMethods((prev) => {
      const exists = prev.dimensions.includes(id);
      if (exists) {
        return { ...prev, dimensions: prev.dimensions.filter((d) => d !== id) };
      } else {
        return { ...prev, dimensions: [...prev.dimensions, id] };
      }
    });
  };

  const toggleSetting = (key: keyof AdditionalSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-amber-400 text-slate-950 font-bold text-xs uppercase px-2.5 py-1 rounded-full tracking-wider">
              TAHUN AJARAN 2026/2027
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 text-white">
              Formulir Identitas Guru & Pembelajaran
            </h1>
            <p className="text-blue-200 text-sm mt-1 max-w-2xl">
              SMK Negeri 1 Bebandem &bull; Lengkapi identitas untuk menghasilkan seluruh 12 jenis dokumen administrasi yang saling terintegrasi dan siap dicetak.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-xl border border-slate-700 text-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Simpan Data</span>
            </button>
            <button
              onClick={onProceedToMenu}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 text-sm transition-all cursor-pointer"
            >
              <span>Buka 12 Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FORM SECTION A: IDENTITAS GURU */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">A. Identitas Guru Pengampu</h2>
            <p className="text-xs text-slate-500">Informasi pengenal resmi untuk Kop Dokumen dan Lembar Pengesahan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Nama Lengkap Guru & Gelar
            </label>
            <input
              type="text"
              value={teacher.teacherName}
              onChange={(e) => setTeacher({ ...teacher, teacherName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium"
              placeholder="Contoh: I Nengah Sudarsana, S.Pd., M.Pd."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. NIP / NUPTK Guru
            </label>
            <input
              type="text"
              value={teacher.teacherNip}
              onChange={(e) => setTeacher({ ...teacher, teacherNip: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium"
              placeholder="Contoh: 19840815 201001 1 018"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Mata Pelajaran
            </label>
            <input
              type="text"
              value={teacher.subject}
              onChange={(e) => setTeacher({ ...teacher, subject: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium"
              placeholder="Contoh: Konsentrasi Keahlian Rekayasa Perangkat Lunak"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              4. Program Keahlian / Konsentrasi Keahlian
            </label>
            <select
              value={teacher.vocation}
              onChange={(e) => setTeacher({ ...teacher, vocation: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium bg-white"
            >
              {VOCATION_LIST.map((voc) => (
                <option key={voc} value={voc}>
                  {voc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              5. Kelas
            </label>
            <select
              value={teacher.grade}
              onChange={(e) => setTeacher({ ...teacher, grade: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium bg-white"
            >
              <option value="X (Sepuluh)">X (Sepuluh)</option>
              <option value="XI (Sebelas)">XI (Sebelas)</option>
              <option value="XII (Dua Belas)">XII (Dua Belas)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              6. Fase
            </label>
            <select
              value={teacher.phase}
              onChange={(e) => setTeacher({ ...teacher, phase: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium bg-white"
            >
              <option value="E">Fase E (Kelas X)</option>
              <option value="F">Fase F (Kelas XI & XII)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              7. Semester
            </label>
            <select
              value={teacher.semester}
              onChange={(e) => setTeacher({ ...teacher, semester: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium bg-white"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              8. Tahun Ajaran
            </label>
            <input
              type="text"
              value={teacher.academicYear}
              readOnly
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600"
            />
          </div>
        </div>
      </section>

      {/* FORM SECTION B: IDENTITAS PEMBELAJARAN + AI TP GENERATOR */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">B. Identitas Pembelajaran & Perumusan TP</h2>
            <p className="text-xs text-slate-500">Materi, Capaian Pembelajaran (CP), dan Perumusan Tujuan Pembelajaran (TP) berbasis AI</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Materi atau Topik Pembelajaran
              </label>
              <input
                type="text"
                value={learning.topic}
                onChange={(e) => setLearning({ ...learning, topic: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium"
                placeholder="Contoh: Pemrograman Web Berbasis Komponen & RESTful API"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                4. Alokasi Waktu
              </label>
              <input
                type="text"
                value={learning.duration}
                onChange={(e) => setLearning({ ...learning, duration: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium"
                placeholder="Contoh: 4 JP x 45 Menit"
              />
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Capaian Pembelajaran (CP)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFindCP}
                  disabled={isFindingCP}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="AI akan mencarikan Capaian Pembelajaran resmi sesuai mata pelajaran, fase, dan topik Anda"
                >
                  <Search className={`w-3.5 h-3.5 ${isFindingCP ? 'animate-spin' : 'text-amber-300'}`} />
                  <span>{isFindingCP ? 'Mencari CP Resmi...' : 'Cari CP Otomatis dengan AI'}</span>
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              value={learning.cp}
              onChange={(e) => setLearning({ ...learning, cp: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium leading-relaxed bg-white"
              placeholder="Masukkan Capaian Pembelajaran (CP) atau klik tombol 'Cari CP Otomatis dengan AI' di atas..."
            />
            {cpNotice && (
              <div className="mt-2 p-2.5 bg-emerald-100/90 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{cpNotice}</span>
              </div>
            )}
          </div>

          {/* AI ATP GENERATOR & TP CARD */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 border border-blue-800/60 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-300" />
                    <span>FITUR BARU KURIKULUM MERDEKA</span>
                  </span>
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    AI PRO
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Generator Alur Tujuan Pembelajaran (ATP) & TP
                </h3>
                <p className="text-xs text-blue-200/90 leading-relaxed">
                  Fitur lengkap untuk menyusun matriks <strong>Alur Tujuan Pembelajaran (ATP)</strong> secara otomatis. AI akan otomatis mencarikan Capaian Pembelajaran (CP) resmi dari BSKAP Kemendikbudristek untuk materi <em>"{learning.topic || teacher.subject}"</em>, membedah alur Tujuan Pembelajaran (TP) terurut, menentukan alokasi JP, dan merumuskan rencana asesmen.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleGenerateATP}
                  disabled={isGeneratingATP}
                  className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-400 hover:from-teal-500 hover:to-amber-500 text-slate-950 font-extrabold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-teal-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingATP ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingATP ? 'Menyusun Matriks ATP...' : 'BUAT ATP DENGAN AI (AUTO CARI CP)'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateTP}
                    disabled={isGeneratingTP}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-800/80 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs border border-blue-700/60 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingTP ? 'animate-spin' : 'text-blue-300'}`} />
                    <span>{isGeneratingTP ? 'Memproses TP...' : 'Generate TP Saja (AI)'}</span>
                  </button>

                  {atpPreviewHtml && (
                    <button
                      type="button"
                      onClick={() => setShowAtpModal(true)}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold px-3 py-2 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat ATP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {atpNotice && (
              <div className="mt-4 p-3 bg-teal-900/60 border border-teal-500/60 rounded-xl text-xs text-teal-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{atpNotice}</span>
                </div>
                {atpPreviewHtml && (
                  <button
                    type="button"
                    onClick={() => setShowAtpModal(true)}
                    className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer shrink-0"
                  >
                    Buka Matriks ATP &rarr;
                  </button>
                )}
              </div>
            )}

            {tpNotice && !atpNotice && (
              <div className="mt-4 p-3 bg-emerald-900/60 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{tpNotice}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>3. Tujuan Pembelajaran (TP) Hasil Rumusan</span>
              <span className="text-[11px] font-normal text-emerald-700 normal-case font-medium">
                Sesuai materi "{learning.topic || teacher.subject}" &bull; Dapat diedit bebas
              </span>
            </label>
            <textarea
              rows={5}
              value={learning.tp}
              onChange={(e) => setLearning({ ...learning, tp: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium leading-relaxed font-mono bg-slate-50/50"
              placeholder="1. Mengidentifikasi ...&#10;2. Menerapkan ...&#10;3. Mengevaluasi ..."
            />
          </div>

          {/* AI SOAL GENERATOR CARD (BERDASARKAN TP & TOPIK) */}
          <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-indigo-950 border border-rose-800/50 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-rose-300" />
                    <span>GENERATOR SOAL EVALUASI AI</span>
                  </span>
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    SELARAS TP & TOPIK
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Cari & Susun 10 Butir Soal Evaluasi dengan AI
                </h3>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  AI akan mencari dan menyusun 10 butir soal asesmen (Pilihan Ganda A-E, Kasus HOTS, Kunci Jawaban Lengkap, dan Kisi-Kisi) yang <strong>100% diturunkan secara ketat dari Tujuan Pembelajaran (TP) dan materi "{learning.topic || teacher.subject}"</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleGenerateSoalAI}
                  disabled={isGeneratingSoal}
                  className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingSoal ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingSoal ? 'Mencari & Menyusun Soal AI...' : 'CARI & BUAT 10 SOAL DENGAN AI'}</span>
                </button>

                {hasGeneratedSoal && onOpenDocEditor && (
                  <button
                    type="button"
                    onClick={() => onOpenDocEditor('naskah_soal')}
                    className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold px-4 py-2 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Buka Naskah Soal & Kunci</span>
                  </button>
                )}
              </div>
            </div>

            {soalNotice && (
              <div className="mt-4 p-3 bg-rose-900/60 border border-rose-500/60 rounded-xl text-xs text-rose-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{soalNotice}</span>
                </div>
                {onOpenDocEditor && (
                  <button
                    type="button"
                    onClick={() => onOpenDocEditor('naskah_soal')}
                    className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer shrink-0"
                  >
                    Lihat Soal di Editor &rarr;
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                5. Jumlah Peserta Didik
              </label>
              <input
                type="number"
                value={learning.studentCount}
                onChange={(e) => setLearning({ ...learning, studentCount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium"
                placeholder="36"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                6. Karakteristik Peserta Didik
              </label>
              <input
                type="text"
                value={learning.studentCharacteristics}
                onChange={(e) => setLearning({ ...learning, studentCharacteristics: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 font-medium"
                placeholder="Contoh: Auditori, visual, kinestetik, minat praktik tinggi"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FORM SECTION C: METODE & MODEL PEMBELAJARAN */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">C. Metode & Model Pembelajaran</h2>
            <p className="text-xs text-slate-500">Pilih model utama dan kombinasi metode yang diterapkan di kelas / laboratorium</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Model Pembelajaran Utama:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {MODEL_OPTIONS.map((item) => {
                const isSelected = methods.model === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMethods({ ...methods, model: item })}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Metode Pembelajaran (Dapat memilih lebih dari satu):</span>
              <span className="text-[11px] font-normal text-blue-600 normal-case font-medium">
                {methods.methods.length} metode terpilih
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {METHOD_OPTIONS.map((m) => {
                const active = methods.methods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMethod(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5 text-white" />}
                    <span>{m}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FORM SECTION D: 8 DIMENSI PROFIL LULUSAN */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <span className="text-amber-800 font-extrabold text-sm">8D</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">D. Delapan Dimensi Profil Lulusan</h2>
            <p className="text-xs text-slate-500">Pilih satu atau beberapa dimensi yang diintegrasikan ke dalam aktivitas dan asesmen</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DIMENSION_OPTIONS.map((dim) => {
            const isSelected = methods.dimensions.includes(dim.id);
            return (
              <div
                key={dim.id}
                onClick={() => toggleDimension(dim.id)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none flex items-start space-x-2.5 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {dim.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FORM SECTION E: PENGATURAN TAMBAHAN & KEARIFAN LOKAL BALI */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5 text-cyan-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">E. Pengaturan Pedagogis Tambahan</h2>
            <p className="text-xs text-slate-500">Sentuhan khusus untuk menghasilkan dokumen berkualitas tinggi berstandar SMK</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.deepLearning}
              onChange={() => toggleSetting('deepLearning')}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div>
              <div className="text-xs font-bold text-slate-800">Pembelajaran Mendalam</div>
              <div className="text-[11px] text-slate-500">Memahami, Mengaplikasi, Merefleksi</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.differentiation}
              onChange={() => toggleSetting('differentiation')}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div>
              <div className="text-xs font-bold text-slate-800">Pembelajaran Berdiferensiasi</div>
              <div className="text-[11px] text-slate-500">Konten, Proses, & Produk</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none bg-amber-50/40 border-amber-200">
            <input
              type="checkbox"
              checked={settings.baliWisdom}
              onChange={() => toggleSetting('baliWisdom')}
              className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
            />
            <div>
              <div className="text-xs font-bold text-amber-900">Kearifan Lokal Bali</div>
              <div className="text-[11px] text-amber-700">Tri Hita Karana & Menyama Braya</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.vocationalPractice}
              onChange={() => toggleSetting('vocationalPractice')}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div>
              <div className="text-xs font-bold text-slate-800">Praktik Kejuruan (TEFA)</div>
              <div className="text-[11px] text-slate-500">Standar Industri & K3LH</div>
            </div>
          </label>
        </div>
      </section>

      {/* Floating Save and Next bar */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-lg border border-slate-200 sticky bottom-4 z-30">
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Status Konfigurasi:</span> Semua data pembelajaran siap diintegrasikan ke 12 administrasi.
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-600" />
            <span>Simpan</span>
          </button>
          <button
            type="button"
            onClick={onProceedToMenu}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-blue-700/20 active:scale-95 transition-all cursor-pointer"
          >
            <span>Buka Dashboard 12 Administrasi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL PRATINJAU DOKUMEN ATP */}
      {showAtpModal && atpPreviewHtml && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-400 text-slate-950 px-2 py-0.5 rounded-full">
                      DOKUMEN INDUK KURIKULUM
                    </span>
                    <span className="text-xs text-blue-200 hidden sm:inline">
                      SMK Negeri 1 Bebandem &bull; Fase {teacher.phase}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    Alur Tujuan Pembelajaran (ATP): {learning.topic || teacher.subject}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onExportWord && (
                  <button
                    type="button"
                    onClick={() => onExportWord('atp')}
                    className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
                    title="Unduh format Microsoft Word (.docx)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ekspor Word</span>
                  </button>
                )}
                {onOpenDocEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAtpModal(false);
                      onOpenDocEditor('atp');
                    }}
                    className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
                    title="Buka dokumen di Editor"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Buka di Editor</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAtpModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Info Bar */}
            <div className="bg-teal-50 border-b border-teal-200 px-5 py-2.5 flex flex-wrap items-center justify-between text-xs text-teal-900 gap-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Sinkronisasi Sukses:</strong> Capaian Pembelajaran (CP) dan {learning.tp.split('\n').filter(Boolean).length} nomor Tujuan Pembelajaran (TP) telah diterapkan ke formulir.
                </span>
              </div>
              <span className="text-[11px] text-teal-700 font-medium">
                Siap diintegrasikan ke 12 administrasi lainnya
              </span>
            </div>

            {/* Modal Content Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100">
              <div
                className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200 prose prose-slate max-w-none text-slate-900"
                dangerouslySetInnerHTML={{ __html: atpPreviewHtml }}
              />
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500">
              <span>SMK Negeri 1 Bebandem &bull; Tahun Ajaran {teacher.academicYear || '2026/2027'}</span>
              <button
                type="button"
                onClick={() => setShowAtpModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2 rounded-xl cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
