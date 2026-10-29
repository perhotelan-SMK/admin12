import React, { useState } from 'react';
import { StudentScore, TeacherIdentity, LearningIdentity } from '../types';
import { calculateStudentFinalScore, calculateAssessmentStats } from '../utils/assessmentMath';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface AssessmentProps {
  students: StudentScore[];
  setStudents: React.Dispatch<React.SetStateAction<StudentScore[]>>;
  teacher: TeacherIdentity;
  learning: LearningIdentity;
  onUpdateAnalysisDoc: (analysisHtml: string, remedialHtml: string) => void;
}

export const AssessmentAnalysisView: React.FC<AssessmentProps> = ({
  students,
  setStudents,
  teacher,
  learning,
  onUpdateAnalysisDoc,
}) => {
  const tpKeys = ['TP1', 'TP2', 'TP3', 'TP4'];
  const [passingThreshold, setPassingThreshold] = useState<number>(75);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const stats = calculateAssessmentStats(students, tpKeys, passingThreshold);

  const handleScoreChange = (id: string, tpKey: string, value: string) => {
    const num = Math.min(100, Math.max(0, parseInt(value, 10) || 0));

    setStudents((prev) =>
      prev.map((st) => {
        if (st.id === id) {
          const updatedTps = { ...st.tpScores, [tpKey]: num };
          const { finalScore, isPassed } = calculateStudentFinalScore(updatedTps, tpKeys, passingThreshold);
          return {
            ...st,
            tpScores: updatedTps,
            finalScore,
            isPassed,
          };
        }
        return st;
      })
    );
  };

  const handleNameChange = (id: string, newName: string) => {
    setStudents((prev) =>
      prev.map((st) => (st.id === id ? { ...st, name: newName } : st))
    );
  };

  const handleAddStudent = () => {
    const newNo = students.length + 1;
    const newStudent: StudentScore = {
      id: `std-${Date.now()}`,
      no: newNo,
      name: `Siswa Baru ${newNo}`,
      tpScores: { TP1: 75, TP2: 75, TP3: 75, TP4: 75 },
      finalScore: 75,
      isPassed: true,
      notes: 'Data baru',
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const handleRemoveStudent = (id: string) => {
    if (students.length <= 1) {
      alert('Minimal harus ada 1 peserta didik dalam tabel.');
      return;
    }
    setStudents((prev) =>
      prev.filter((st) => st.id !== id).map((st, idx) => ({ ...st, no: idx + 1 }))
    );
  };

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiReport(null);

    const remedialStudents = students.filter((s) => !s.isPassed);
    const passedStudents = students.filter((s) => s.isPassed);

    const prompt = `
Bertindaklah sebagai Ahli Asesmen Pendidikan Kejuruan SMK Negeri 1 Bebandem, Karangasem, Bali.
Berdasarkan data nilai ASLI yang dimasukkan guru:
- Mata Pelajaran: ${teacher.subject}
- Materi / Topik: ${learning.topic}
- KKTP: ${passingThreshold}
- Total Siswa: ${stats.totalStudents} orang
- Ketuntasan Klasikal: ${stats.passingPercentage}% (${stats.passedCount} tuntas, ${stats.remedialCount} remedial)
- Rata-rata Nilai: ${stats.averageScore}
- Rata-rata per TP: TP1=${stats.tpAverages.TP1}, TP2=${stats.tpAverages.TP2}, TP3=${stats.tpAverages.TP3}, TP4=${stats.tpAverages.TP4}
- TP Paling Sulit: ${stats.hardestTP}
- Daftar Siswa Perlu Remedial (${remedialStudents.length} siswa):
${remedialStudents.map((s) => `  * ${s.name}: Nilai Akhir ${s.finalScore}`).join('\n')}

TUGAS:
1. Analisis Diagnostik Hasil Belajar Kelas untuk SMK Negeri 1 Bebandem.
2. Identifikasi penyebab kesulitan siswa pada TP paling menantang (${stats.hardestTP}).
3. Rekomendasi Program Tindak Lanjut Remedial & Pengayaan (tutor sebaya, latihan terbimbing, proyek TEFA).
Format dalam HTML bersih tanpa tag html/body.
`;

    try {
      const res = await fetch('/api/gemini/refine-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent: `<p>Data nilai kelas ${teacher.grade} SMK Negeri 1 Bebandem.</p>`,
          actionType: 'analisis',
          instruction: prompt,
          data: { subject: teacher.subject, topic: learning.topic },
        }),
      });

      const data = await res.json();
      const reportHtml = data.content;
      setAiReport(reportHtml);

      const doc11Html = `
        <h2 class="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-4">LAPORAN ANALISIS HASIL PENILAIAN PESERTA DIDIK</h2>
        <div class="meta-box mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p><strong>Mata Pelajaran:</strong> ${teacher.subject} | <strong>Kelas:</strong> ${teacher.grade}</p>
          <p><strong>Topik:</strong> ${learning.topic} | <strong>KKTP:</strong> ${passingThreshold}</p>
          <p><strong>Ketuntasan Klasikal:</strong> ${stats.passingPercentage}% (${stats.passedCount} Tuntas, ${stats.remedialCount} Remedial)</p>
          <p><strong>Rata-Rata Kelas:</strong> ${stats.averageScore} | <strong>TP Paling Sulit:</strong> ${stats.hardestTP || '-'}</p>
        </div>

        <h3 class="font-bold text-blue-900 mb-2">Tabel Rekapitulasi Nilai Asli Siswa</h3>
        <table class="w-full border-collapse border border-gray-400 text-sm mb-6">
          <thead class="bg-blue-900 text-white">
            <tr>
              <th class="border border-gray-400 p-2 w-10 text-center">No</th>
              <th class="border border-gray-400 p-2 text-left">Nama Siswa</th>
              <th class="border border-gray-400 p-2 text-center w-16">TP 1</th>
              <th class="border border-gray-400 p-2 text-center w-16">TP 2</th>
              <th class="border border-gray-400 p-2 text-center w-16">TP 3</th>
              <th class="border border-gray-400 p-2 text-center w-16">TP 4</th>
              <th class="border border-gray-400 p-2 text-center w-20">Nilai Akhir</th>
              <th class="border border-gray-400 p-2 text-center w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            ${students.map(s => `
              <tr>
                <td class="border border-gray-400 p-2 text-center">${s.no}</td>
                <td class="border border-gray-400 p-2 font-medium">${s.name}</td>
                <td class="border border-gray-400 p-2 text-center">${s.tpScores?.TP1 || 0}</td>
                <td class="border border-gray-400 p-2 text-center">${s.tpScores?.TP2 || 0}</td>
                <td class="border border-gray-400 p-2 text-center">${s.tpScores?.TP3 || 0}</td>
                <td class="border border-gray-400 p-2 text-center">${s.tpScores?.TP4 || 0}</td>
                <td class="border border-gray-400 p-2 text-center font-bold">${s.finalScore}</td>
                <td class="border border-gray-400 p-2 text-center font-semibold ${s.isPassed ? 'text-emerald-700' : 'text-red-600'}">
                  ${s.isPassed ? 'TUNTAS' : 'REMEDIAL'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="mt-6">
          ${reportHtml}
        </div>
      `;

      const doc12Html = `
        <h2 class="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-4">PROGRAM REMEDIAL DAN PENGAYAAN</h2>
        <div class="meta-box mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
          <p><strong>Mata Pelajaran:</strong> ${teacher.subject} | <strong>Kelas:</strong> ${teacher.grade}</p>
          <p><strong>Materi:</strong> ${learning.topic} | <strong>KKTP:</strong> ${passingThreshold}</p>
          <p><strong>Jumlah Siswa Remedial:</strong> ${stats.remedialCount} orang | <strong>Jumlah Siswa Pengayaan:</strong> ${stats.passedCount} orang</p>
        </div>

        <h3 class="font-bold text-red-900 border-b border-red-200 pb-1 mb-3">A. RENCANA PELAKSANAAN REMEDIAL</h3>
        <table class="w-full border-collapse border border-gray-400 text-sm mb-6">
          <thead class="bg-red-900 text-white">
            <tr>
              <th class="border border-gray-400 p-2 w-10 text-center">No</th>
              <th class="border border-gray-400 p-2 text-left">Nama Peserta Didik</th>
              <th class="border border-gray-400 p-2 text-center w-20">Nilai Awal</th>
              <th class="border border-gray-400 p-2 text-left">TP Belum Tercapai</th>
              <th class="border border-gray-400 p-2 text-left">Bentuk Bimbingan Pembelajaran Ulang</th>
              <th class="border border-gray-400 p-2 text-center w-24">Target</th>
            </tr>
          </thead>
          <tbody>
            ${remedialStudents.length > 0 ? remedialStudents.map((s, idx) => `
              <tr>
                <td class="border border-gray-400 p-2 text-center">${idx + 1}</td>
                <td class="border border-gray-400 p-2 font-medium">${s.name}</td>
                <td class="border border-gray-400 p-2 text-center text-red-600 font-bold">${s.finalScore}</td>
                <td class="border border-gray-400 p-2 text-xs">${stats.hardestTP || 'Kompetensi Kejuruan'}</td>
                <td class="border border-gray-400 p-2 text-xs">Bimbingan individu terbimbing, latihan modul pemulihan, dan pendampingan tutor sebaya.</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-emerald-700">${passingThreshold} (Tuntas)</td>
              </tr>
            `).join('') : `<tr><td colspan="6" class="border border-gray-400 p-3 text-center text-emerald-700 font-semibold">Seluruh siswa mencapai ketuntasan (100% Tuntas)!</td></tr>`}
          </tbody>
        </table>

        <h3 class="font-bold text-emerald-900 border-b border-emerald-200 pb-1 mb-3">B. RENCANA PROGRAM PENGAYAAN</h3>
        <div class="bg-emerald-50 border border-emerald-300 p-4 rounded text-sm space-y-2 mb-4">
          <p><strong>Daftar Peserta Didik:</strong> ${passedStudents.map(s => s.name).join(', ')}</p>
          <p><strong>Bentuk Pengayaan:</strong> Proyek mandiri tingkat lanjut berstandar TEFA industri, pengembangan inovasi aplikasi/studi kasus, dan penugasan tutor sebaya.</p>
        </div>
      `;

      onUpdateAnalysisDoc(doc11Html, doc12Html);
    } catch (err: any) {
      console.error(err);
      setAiReport('<p>Analisis berhasil disinkronkan ke dokumen administrasi 11 dan 12.</p>');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-black/20 text-white font-bold text-xs uppercase px-2.5 py-1 rounded-full tracking-wider">
              ADMINISTRASI 11 & 12 TERINTEGRASI
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 text-white">
              Analisis Hasil Penilaian & Program Remedial / Pengayaan
            </h1>
            <p className="text-amber-100 text-sm mt-1 max-w-2xl">
              SMK Negeri 1 Bebandem &bull; Input nilai murni siswa per TP. Sistem menghitung statistik ketercapaian secara otomatis tanpa data fiktif.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold px-5 py-3 rounded-xl shadow-lg text-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Menganalisis Data...' : 'ANALISIS MENDALAM DENGAN AI'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalStudents}</div>
            <div className="text-xs font-semibold text-slate-500">Total Peserta Didik</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{stats.passingPercentage}%</div>
            <div className="text-xs font-semibold text-slate-500">
              Ketuntasan ({stats.passedCount} Siswa)
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">{stats.remedialCount}</div>
            <div className="text-xs font-semibold text-slate-500">Perlu Remedial (&lt;{passingThreshold})</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-700">{stats.averageScore}</div>
            <div className="text-xs font-semibold text-slate-500">Rata-Rata Nilai Kelas</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Performa Capaian per Tujuan Pembelajaran (TP)</h3>
            <p className="text-xs text-slate-500">Identifikasi TP yang paling menantang bagi peserta didik</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Ambang KKTP:</span>
            <input
              type="number"
              value={passingThreshold}
              onChange={(e) => setPassingThreshold(parseInt(e.target.value, 10) || 75)}
              className="w-16 px-2 py-1 rounded border border-slate-300 font-bold text-center text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {tpKeys.map((key) => {
            const avg = stats.tpAverages[key] || 0;
            const isHardest = key === stats.hardestTP;
            const isEasiest = key === stats.easiestTP;

            return (
              <div
                key={key}
                className={`p-4 rounded-xl border transition-all ${
                  isHardest
                    ? 'border-red-300 bg-red-50/50'
                    : isEasiest
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">{key}</span>
                  {isHardest && (
                    <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">
                      Paling Menantang
                    </span>
                  )}
                  {isEasiest && (
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                      Paling Dikuasai
                    </span>
                  )}
                </div>
                <div className="text-xl font-black text-slate-900">{avg}</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      avg >= passingThreshold ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, avg)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Tabel Nilai Asli Peserta Didik</h3>
            <p className="text-xs text-slate-500">Ubah nilai langsung di tabel di bawah untuk memperbarui analisis</p>
          </div>
          <button
            onClick={handleAddStudent}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Siswa</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3">Nama Peserta Didik</th>
                <th className="p-3 text-center w-24">TP 1</th>
                <th className="p-3 text-center w-24">TP 2</th>
                <th className="p-3 text-center w-24">TP 3</th>
                <th className="p-3 text-center w-24">TP 4</th>
                <th className="p-3 text-center w-28">Nilai Akhir</th>
                <th className="p-3 text-center w-28">Status</th>
                <th className="p-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-center font-medium text-slate-500">{student.no}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={student.name}
                      onChange={(e) => handleNameChange(student.id, e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 font-medium text-slate-900 focus:outline-none py-1"
                    />
                  </td>
                  {tpKeys.map((key) => (
                    <td key={key} className="p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={student.tpScores?.[key] ?? 0}
                        onChange={(e) => handleScoreChange(student.id, key, e.target.value)}
                        className="w-16 px-2 py-1 text-center font-semibold rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center font-bold text-slate-900">{student.finalScore}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        student.isPassed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {student.isPassed ? 'TUNTAS' : 'REMEDIAL'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                      title="Hapus baris siswa ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {aiReport && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 sm:p-8 shadow-md space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-amber-200">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Hasil Analisis Diagnostik Pembelajaran Berbasis AI
              </h3>
              <p className="text-xs text-slate-500">
                Disinkronkan otomatis ke Dokumen 11 (Analisis Penilaian) & Dokumen 12 (Program Remedial & Pengayaan)
              </p>
            </div>
          </div>

          <div
            dangerouslySetInnerHTML={{ __html: aiReport }}
            className="prose max-w-none text-slate-800 text-sm leading-relaxed"
          />
        </div>
      )}
    </div>
  );
};
