import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generateSingleDoc, generateAllDocs } from './src/utils/documentGenerator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Shared Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to call Gemini with multi-model fallback (gemini-3.5-flash first, then gemini-3.8-flash)
async function callGeminiSafe(prompt: string, timeoutMs = 12000, enableSearch = false): Promise<string | null> {
  if (!ai) return null;
  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.8-flash'];
  for (const model of modelsToTry) {
    try {
      const generatePromise = (async () => {
        if (!ai) return null;
        if (enableSearch) {
          try {
            const resWithSearch = await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                tools: [{ googleSearch: {} }],
              },
            });
            if (resWithSearch.text) return resWithSearch.text.trim();
          } catch (errSearch: any) {
            console.warn(`Search grounding attempt on ${model} error:`, errSearch.message);
          }
        }
        // Standard generation without tools if search fails or is disabled
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        return res.text ? res.text.trim() : null;
      })().catch((err: any) => {
        console.warn(`Gemini call error (${model}):`, err.message);
        return null;
      });

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => {
          resolve(null);
        }, timeoutMs)
      );

      const result = await Promise.race([generatePromise, timeoutPromise]);
      if (result) return result;
    } catch (err: any) {
      console.warn(`Safe Gemini runner caught error on ${model}:`, err.message);
    }
  }
  return null;
}

// Helper to deconstruct / unpack CP into matching sequential TPs strictly aligned with topic and subject
function deriveTpsFromCP(cpText: string, topicText?: string, subjectText?: string): string {
  const targetTopic = topicText?.trim() || 'kompetensi kejuruan';
  const targetSubject = subjectText?.trim() || 'Mata Pelajaran';

  let clean = (cpText || '')
    .replace(/^Pada akhir fase\s+[a-fA-F0-9,\s]+(?:\(kelas\s+[xXvViI0-9\s]+\))?,\s*peserta didik mampu\s+/i, '')
    .replace(/^peserta didik mampu\s+/i, '')
    .trim();

  // Split clauses by comma, " serta ", " dan ", ";"
  const clauses = clean
    .split(/,|\sserta\s|\ndan\s|;/i)
    .map((c) => c.trim().replace(/^dan\s+/i, '').replace(/\.$/, ''))
    .filter((c) => c.length > 8);

  if (clauses.length >= 3) {
    return clauses.slice(0, 5).map((clause, idx) => {
      let formatted = clause.charAt(0).toUpperCase() + clause.slice(1);
      // Ensure topic reference is embedded if missing
      if (!formatted.toLowerCase().includes(targetTopic.toLowerCase().slice(0, 10))) {
        formatted += ` pada materi ${targetTopic}`;
      }
      return `${idx + 1}. ${formatted}.`;
    }).join('\n');
  }

  return [
    `1. Mengidentifikasi konsep esensial, prinsip kerja, dan regulasi keselamatan (K3LH) pada mata pelajaran ${targetSubject} materi ${targetTopic}.`,
    `2. Menerapkan langkah-langkah kerja operasional dan prosedur teknis presisi pada materi ${targetTopic} berdasarkan standar operasional prosedur (SOP).`,
    `3. Mendiagnosis kendala atau deviasi hasil pengujian serta merumuskan tindakan pemecahan masalah (troubleshooting) pada materi ${targetTopic} secara bernalar kritis.`,
    `4. Mengevaluasi mutu hasil kerja/produk materi ${targetTopic} secara mandiri dan berkolaborasi dalam kerja tim dengan menjunjung budaya kerja industri dan kearifan lokal Bali.`,
  ].join('\n');
}

// 0. API: Cari Capaian Pembelajaran (CP) Resmi dengan AI Disesuaikan Khusus dengan Mata Pelajaran dan Topik Materi
app.post('/api/gemini/find-cp', async (req, res) => {
  const { subject, vocation, grade, phase, topic } = req.body;

  const subjectStr = subject || 'Kejuruan SMK';
  const topicStr = topic || 'Kompetensi Pembelajaran';
  const gradeStr = grade || 'XI';
  const phaseStr = phase || 'F';
  const vocationStr = vocation || 'SMK Negeri 1 Bebandem';

  const prompt = `
Anda adalah Pakar Kurikulum Merdeka Kemendikbudristek untuk Sekolah Menengah Kejuruan (SMK) di SMK Negeri 1 Bebandem, Karangasem, Bali.

INFORMASI PEMBELAJARAN RESMI:
- Satuan Pendidikan: SMK Negeri 1 Bebandem (Tahun Ajaran 2026/2027)
- Mata Pelajaran: "${subjectStr}"
- Materi / Topik Spesifik: "${topicStr}"
- Program Keahlian: "${vocationStr}"
- Kelas / Fase: Kelas ${gradeStr} (Fase ${phaseStr})

PETUNJUK KETAT PENYELARASAN:
1. Carikan teks resmi Capaian Pembelajaran (CP) elemen yang paling relevan dari Keputusan BSKAP Kemendikbudristek yang SECARA EKSKLUSIF mengatur Mata Pelajaran "${subjectStr}" dan menaungi materi pokok "${topicStr}".
   PENTING: Jangan memberikan CP umum yang tidak ada hubungannya dengan mata pelajaran "${subjectStr}" atau topik "${topicStr}". Teks CP harus secara eksplisit menyebut atau memayungi kompetensi keahlian "${subjectStr}" dan materi "${topicStr}".
2. Lakukan dekonstruksi (unpacking) terhadap CP tersebut menjadi 3 hingga 5 butir Tujuan Pembelajaran (TP) terukur (berjenjang KKO Bloom C2 s.d. C6) yang 100% SESUAI DENGAN CP DAN MATERI "${topicStr}".
   Setiap butir TP harus secara eksplisit mencantumkan kata kerja operasional terukur dan materi "${topicStr}".

FORMAT RESPON (WAJIB JSON murni tanpa markdown \`\`\`):
{
  "cp": "Pada akhir Fase ${phaseStr}, peserta didik mampu ... (tuliskan CP resmi mata pelajaran ${subjectStr} yang menaungi materi ${topicStr}) ...",
  "tp": "1. [KKO] ... materi ${topicStr}\\n2. [KKO] ... materi ${topicStr}\\n3. [KKO] ... materi ${topicStr}\\n4. [KKO] ... materi ${topicStr}"
}
`;

  const aiText = await callGeminiSafe(prompt, 9000);
  if (aiText) {
    try {
      const cleaned = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.cp && parsed.tp) {
        return res.json({ cp: parsed.cp, tp: parsed.tp, source: 'ai' });
      }
      if (parsed.cp) {
        const derivedTP = deriveTpsFromCP(parsed.cp, topicStr, subjectStr);
        return res.json({ cp: parsed.cp, tp: derivedTP, source: 'ai' });
      }
    } catch {
      // If not pure JSON, use text as CP and derive TPs
      const derivedTP = deriveTpsFromCP(aiText, topicStr, subjectStr);
      return res.json({ cp: aiText, tp: derivedTP, source: 'ai' });
    }
  }

  // Dynamic curated fallback matching specific subject and topic
  const subjLower = subjectStr.toLowerCase();
  const vocLower = vocationStr.toLowerCase();
  let fallbackCP = '';

  if (subjLower.includes('web') || subjLower.includes('rpl') || vocLower.includes('rekayasa perangkat lunak') || subjLower.includes('aplikasi')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu memahami arsitektur sistem, merancang komponen antarmuka, mengimplementasikan kode program, serta menguji performa dan keamanan pada materi ${topicStr} sesuai standar industri perangkat lunak.`;
  } else if (subjLower.includes('jaringan') || subjLower.includes('tkj') || vocLower.includes('jaringan')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu merencanakan topologi, mengonfigurasi perangkat, menerapkan sistem proteksi keamanan, serta melakukan diagnosis gangguan (troubleshooting) pada materi ${topicStr} sesuai standar industri telekomunikasi.`;
  } else if (subjLower.includes('otomotif') || subjLower.includes('tkr') || vocLower.includes('kendaraan')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu melakukan inspeksi, perawatan berkala, pengujian sistem mekanikal dan elektrikal, serta penanganan gangguan teknis pada materi ${topicStr} sesuai manual book operasional industri otomotif.`;
  } else if (subjLower.includes('sepeda motor') || subjLower.includes('tbsm') || vocLower.includes('sepeda motor')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu melakukan servis berkala, pengujian performa sistem injeksi, diagnosis kelistrikan, serta perbaikan komponen pada materi ${topicStr} sesuai standar ATPM sepeda motor.`;
  } else if (subjLower.includes('kuliner') || subjLower.includes('boga') || vocLower.includes('kuliner')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu merencanakan resep, mempersiapkan bahan baku higienis (HACCP), mengolah sajian dengan teknik standar, serta menyajikan olahan kuliner pada materi ${topicStr} berstandar industri hospitaliti.`;
  } else if (subjLower.includes('hotel') || vocLower.includes('perhotelan')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu menerapkan standar pelayanan prima, menjalankan prosedur operasional departemen terkait, serta mengelola sarana pelayanan pada materi ${topicStr} sesuai standar industri perhotelan internasional.`;
  } else if (subjLower.includes('akuntansi') || subjLower.includes('keuangan') || vocLower.includes('akuntansi')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu mengidentifikasi dokumen transaksi, mencatat jurnal, menyusun kertas kerja, serta menyajikan laporan keuangan pada materi ${topicStr} sesuai Standar Akuntansi Keuangan (SAK).`;
  } else if (subjLower.includes('salak') || subjLower.includes('pertanian') || vocLower.includes('pertanian')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu mengidentifikasi karakteristik bahan baku lokal salak Sibetan Bebandem, mengoperasikan mesin pengolahan, menerapkan prinsip sanitasi GMP, serta mengemas hasil olahan pada materi ${topicStr}.`;
  } else if (subjLower.includes('matematika')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu memodelkan fenomena matematis, menerapkan konsep kalkulasi dan logika aljabar terapan, serta memecahkan masalah kontekstual kejuruan pada materi ${topicStr} secara kritis.`;
  } else if (subjLower.includes('bahasa indonesia')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu menyimak, membaca kritis, mengevaluasi informasi, serta menyusun teks laporan hasil observasi dan dokumen teknis komunikatif pada materi ${topicStr}.`;
  } else if (subjLower.includes('bahasa inggris')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu memahami teks teknis (manual guides), berkomunikasi lisan dan tulisan dalam konteks dunia kerja internasional, serta mempresentasikan materi ${topicStr} dengan bahasa Inggris komunikatif.`;
  } else if (subjLower.includes('agama') || subjLower.includes('budi pekerti')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu memahami ajaran keimanan dan ketakwaan, menginternalisasi etika moral, serta menerapkan keharmonisan Tri Hita Karana dalam lingkungan kerja pada materi ${topicStr}.`;
  } else if (subjLower.includes('pancasila') || subjLower.includes('kewarganegaraan')) {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu menganalisis norma hukum, menghargai keberagaman kebinekaan, serta menunjukkan integritas etika profesi warga negara pada materi ${topicStr}.`;
  } else {
    fallbackCP = `Pada akhir Fase ${phaseStr}, peserta didik mampu memahami konsep fundamental, menerapkan prosedur teknis berstandar operasional industri, menguji kelaikan mutu hasil karya, serta mendiagnosis kendala kerja pada mata pelajaran ${subjectStr} materi ${topicStr} secara bernalar kritis dan mandiri.`;
  }

  const fallbackTP = deriveTpsFromCP(fallbackCP, topicStr, subjectStr);
  return res.json({ cp: fallbackCP, tp: fallbackTP, source: 'curated' });
});

// 1. API: Generate Tujuan Pembelajaran (TP) yang Disesuaikan Penuh dengan CP, Mapel & Topik
app.post('/api/gemini/generate-tp', async (req, res) => {
  const { cp, subject, grade, phase, vocation, characteristics, topic } = req.body;

  if (!cp || !cp.trim()) {
    return res.status(400).json({ error: 'Capaian Pembelajaran (CP) wajib diisi' });
  }

  const subjectStr = subject || 'Mata Pelajaran';
  const topicStr = topic || 'Materi Pembelajaran';

  const prompt = `
Anda adalah Ahli Kurikulum Pendidikan Vokasi (SMK) Indonesia di SMK Negeri 1 Bebandem, Karangasem, Bali.
Mata Pelajaran: ${subjectStr}
Materi / Topik: ${topicStr}
Program Keahlian: ${vocation || 'SMK'}
Kelas / Fase: Kelas ${grade || 'X'} (Fase ${phase || 'E'})
Karakteristik Siswa: ${characteristics || 'Praktis, minat vokasi'}
Capaian Pembelajaran (CP) yang WAJIB DIDEKONSTRUKSI:
"""${cp}"""

TUGAS UTAMA:
Lakukan analisis dan dekonstruksi (unpacking) mendalam terhadap Capaian Pembelajaran (CP) di atas.
Rumuskan 3 hingga 5 Tujuan Pembelajaran (TP) terukur (berjenjang KKO Taksonomi Bloom C2-C6) yang 100% SESUAI DENGAN CP DAN SECARA SPESIFIK MEMBAHAS MATERI "${topicStr}" DALAM MATA PELAJARAN "${subjectStr}".
Setiap butir TP harus secara eksplisit memuat kata kerja kompetensi operasional dan materi "${topicStr}".
Keluarkan HANYA daftar nomor TP (1. ..., 2. ..., 3. ..., dst.) tanpa teks pembuka atau penutup.
`;

  const aiText = await callGeminiSafe(prompt, 8000);
  if (aiText) {
    return res.json({ tp: aiText });
  }

  // Resilient fallback strictly derived from the provided CP text and topic
  const fallback = deriveTpsFromCP(cp, topicStr, subjectStr);
  return res.json({ tp: fallback });
});

// 1C. API: Cari / Buat Soal Evaluasi Berdasarkan Tujuan Pembelajaran (TP) & Topik Materi Menggunakan AI
app.post('/api/gemini/generate-soal', async (req, res) => {
  const { subject, vocation, grade, phase, semester, topic, tp, cp, teacherName, teacherNip } = req.body;

  const subjectStr = subject || 'Kejuruan SMK';
  const topicStr = topic || 'Materi Pembelajaran';
  const gradeStr = grade || 'XI';
  const phaseStr = phase || 'F';
  const semesterStr = semester || 'Ganjil';
  const teacherStr = teacherName || 'Guru Pengampu';
  const nipStr = teacherNip || '-';

  const prompt = `
Anda adalah Tim Ahli Penulisan Soal dan Asesmen Pendidikan Vokasi di SMK Negeri 1 Bebandem, Karangasem, Bali.
Susunlah NASKAH SOAL EVALUASI PEMBELAJARAN (10 BUTIR SOAL) dan KISI-KISI SOAL yang 100% DITURUNKAN SECARA PRESISI DARI TUJUAN PEMBELAJARAN (TP) DAN TOPIK MATERI BERIKUT:

INFORMASI PEMBELAJARAN:
- Satuan Pendidikan: SMK Negeri 1 Bebandem (Tahun Ajaran 2026/2027)
- Guru Pengampu: ${teacherStr} (NIP. ${nipStr})
- Mata Pelajaran: ${subjectStr}
- Program Keahlian: ${vocation || 'SMK'}
- Kelas / Fase / Semester: Kelas ${gradeStr} / Fase ${phaseStr} / ${semesterStr}
- Materi / Topik Pokok: "${topicStr}"
- Capaian Pembelajaran (CP):
"""${cp || '-'}"""
- Rincian Tujuan Pembelajaran (TP) Wajib Diuji:
"""${tp || '-'}"""

TUGAS UTAMA:
Buatkan naskah 10 butir soal asesmen evaluasi komprehensif berstandar Kurikulum Merdeka yang stimulus dan pertanyaannya secara eksplisit menguji materi "${topicStr}" dan setiap butir Tujuan Pembelajaran (TP):
1. Soal 1 & 2: [Menguji TP 1] (Level Kognitif C2 - Pemahaman Konsep Dasar, Regulasi K3LH materi ${topicStr})
2. Soal 3 & 4: [Menguji TP 2] (Level Kognitif C3 - Penerapan Langkah Kerja Teknis & SOP Industri materi ${topicStr})
3. Soal 5 & 6: [Menguji TP 3] (Level Kognitif C4 - Analisis Deviasi Pengujian, Anomali & Troubleshooting materi ${topicStr})
4. Soal 7 & 8: [Menguji TP 4] (Level Kognitif C4/C5 - Evaluasi Mutu QC DUDIKA & Kearifan Budaya Kerja Bali "Tri Hita Karana" materi ${topicStr})
5. Soal 9: [Menguji HOTS Multi-TP] (Pilihan Ganda Kompleks C5 - Studi Kasus Multi-Faktor materi ${topicStr})
6. Soal 10: [Menguji HOTS Sintesis Pemecahan Masalah] (Soal Uraian Kasus Industri C6 - Desain Solusi & SOP Teknis materi ${topicStr})

Wajib sertakan di bagian bawah:
- TABEL KUNCI JAWABAN LENGKAP DENGAN LEVEL TAKSONOMI BLOOM (C1-C6)
- PEMBAHASAN ANALITIK MENDALAM TIAP BUTIR SOAL
- RUBRIK DAN PEDOMAN PENSKORAN TOTAL 100

Format output: HTML bersih (gunakan tag h2, h3, p, div, table class="w-full border-collapse border border-gray-400 text-sm my-4"). Tanpa wrapper <html> atau <body>.
`;

  const aiSoalHtml = await callGeminiSafe(prompt, 12000);

  // Generate corresponding kisi-kisi with local generator or AI
  const promptKisi = `
Anda adalah Pengembang Kisi-Kisi Soal Kurikulum Merdeka di SMK Negeri 1 Bebandem.
Susun TABEL KISI-KISI PENULISAN 10 BUTIR SOAL untuk Mata Pelajaran "${subjectStr}", Topik "${topicStr}", Kelas ${gradeStr} (Fase ${phaseStr}).
Tujuan Pembelajaran:
"""${tp}"""
Capaian Pembelajaran:
"""${cp}"""
Tabel kisi-kisi memuat kolom: No, Klausul CP, Tujuan Pembelajaran (TP), Materi Pokok ("${topicStr}"), Indikator Spesifik Butir Soal, Level Kognitif (C1-C6), Bentuk Soal (PG/PG Kompleks/Uraian), dan Bobot Nilai (Total 100).
Sajikan dalam HTML bersih (table class="w-full border-collapse border border-gray-400 text-xs my-4").
`;
  const aiKisiHtml = await callGeminiSafe(promptKisi, 9000);

  const fallbackSoal = generateSingleDoc('naskah_soal', {
    teacher: { teacherName: teacherStr, teacherNip: nipStr, subject: subjectStr, vocation: vocation || '', grade: gradeStr, phase: phaseStr, semester: semesterStr, academicYear: '2026/2027' },
    learning: { topic: topicStr, cp: cp || '', tp: tp || '', duration: '4 JP', studentCount: 36, studentCharacteristics: '' },
    methods: { methods: ['Praktik', 'Problem Solving'], model: 'Problem Based Learning (PBL)', dimensions: ['Penalaran Kritis', 'Kolaborasi'] },
    settings: { deepLearning: true, differentiation: true, digitalTech: true, literacy: true, numeracy: true, baliWisdom: true, characterEducation: true, vocationalPractice: true },
  });

  const fallbackKisi = generateSingleDoc('kisi_kisi', {
    teacher: { teacherName: teacherStr, teacherNip: nipStr, subject: subjectStr, vocation: vocation || '', grade: gradeStr, phase: phaseStr, semester: semesterStr, academicYear: '2026/2027' },
    learning: { topic: topicStr, cp: cp || '', tp: tp || '', duration: '4 JP', studentCount: 36, studentCharacteristics: '' },
    methods: { methods: ['Praktik', 'Problem Solving'], model: 'Problem Based Learning (PBL)', dimensions: ['Penalaran Kritis', 'Kolaborasi'] },
    settings: { deepLearning: true, differentiation: true, digitalTech: true, literacy: true, numeracy: true, baliWisdom: true, characterEducation: true, vocationalPractice: true },
  });

  return res.json({
    naskah_soal: aiSoalHtml || fallbackSoal,
    kisi_kisi: aiKisiHtml || fallbackKisi,
    title: 'NASKAH SOAL & KISI-KISI EVALUASI PEMBELAJARAN',
    source: aiSoalHtml ? 'ai' : 'curated',
  });
});

// 1B. API: Buat Alur Tujuan Pembelajaran (ATP) Lengkap dengan AI
app.post('/api/gemini/generate-atp', async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'data wajib disertakan' });
  }

  const prompt = `
Anda adalah Ahli Kurikulum Merdeka SMK di SMK Negeri 1 Bebandem, Bali.
Susun dokumen resmi "ALUR TUJUAN PEMBELAJARAN (ATP)" untuk:
- Satuan Pendidikan: SMK Negeri 1 Bebandem (Tahun Ajaran 2026/2027)
- Mata Pelajaran: ${data.subject}
- Program Keahlian: ${data.vocation}
- Kelas / Fase / Semester: ${data.grade} / Fase ${data.phase} / ${data.semester}
- Guru Pengampu: ${data.teacherName} (NIP. ${data.teacherNip})
- Materi Pokok / Topik: ${data.topic}
- Capaian Pembelajaran (CP):
"""${data.cp}"""
- Tujuan Pembelajaran (TP) Dasar:
"""${data.tp}"""

TUGAS:
Buat dokumen Alur Tujuan Pembelajaran (ATP) lengkap dalam format HTML bersih.
Struktur Dokumen:
1. Identitas Mata Pelajaran
2. Rasional & Elemen Capaian Pembelajaran
3. Tabel Matriks Lengkap Alur Tujuan Pembelajaran dengan kolom:
   - No / Kode Alur (misal 11.1, 11.2, 11.3, 11.4...)
   - Elemen Capaian Pembelajaran
   - Capaian Pembelajaran (CP) Elemen
   - Alur Tujuan Pembelajaran (TP) terurut logis dari pemahaman dasar hingga evaluasi/kreasi
   - Lingkup Materi / Pokok Bahasan (berakar kuat pada topik "${data.topic}")
   - Indikator Ketercapaian Tujuan Pembelajaran (IKTP)
   - Alokasi Waktu (JP)
   - Dimensi Profil Kelulusan (Karakter)
   - Asesmen / Penilaian (Diagnostik, Formatif, Sumatif)
4. Karakteristik & Integrasi Kearifan Lokal Bali (Tri Hita Karana)

Sajikan dalam HTML bersih (menggunakan h2, h3, p, table class="w-full border-collapse border border-gray-400 text-sm my-4"). Tanpa wrapper <html> atau <body>.
`;

  const aiText = await callGeminiSafe(prompt, 10000);
  if (aiText) {
    return res.json({ content: aiText, title: 'ALUR TUJUAN PEMBELAJARAN (ATP)' });
  }

  // Fallback to local ATP generator
  const fallbackContent = generateSingleDoc('atp', {
    teacher: {
      teacherName: data.teacherName,
      teacherNip: data.teacherNip,
      subject: data.subject,
      vocation: data.vocation,
      grade: data.grade,
      phase: data.phase,
      semester: data.semester,
      academicYear: data.academicYear,
    },
    learning: {
      topic: data.topic,
      cp: data.cp,
      tp: data.tp,
      duration: data.duration,
      studentCount: data.studentCount,
      studentCharacteristics: data.studentCharacteristics,
    },
    methods: {
      methods: data.methods || [],
      model: data.model || 'Problem Based Learning (PBL)',
      dimensions: data.dimensions || [],
    },
    settings: {
      deepLearning: !!data.deepLearning,
      differentiation: !!data.differentiation,
      digitalTech: !!data.digitalTech,
      literacy: !!data.literacy,
      numeracy: !!data.numeracy,
      baliWisdom: !!data.baliWisdom,
      characterEducation: !!data.characterEducation,
      vocationalPractice: !!data.vocationalPractice,
    },
  });

  return res.json({ content: fallbackContent, title: 'ALUR TUJUAN PEMBELAJARAN (ATP)' });
});

// 2. API: Generate Single Dokumen
app.post('/api/gemini/generate-doc', async (req, res) => {
  const { docType, data } = req.body;

  if (!docType || !data) {
    return res.status(400).json({ error: 'docType dan data wajib disertakan' });
  }

  const docTitles: Record<string, string> = {
    atp: 'ALUR TUJUAN PEMBELAJARAN (ATP)',
    modul_ajar: 'MODUL AJAR / RENCANA PEMBELAJARAN',
    bahan_ajar: 'BAHAN AJAR DAN MATERI PEMBELAJARAN',
    lkpd: 'LEMBAR KERJA PESERTA DIDIK (LKPD/LKS)',
    media_pembelajaran: 'RANCANGAN MEDIA PEMBELAJARAN',
    kisi_kisi: 'KISI-KISI PENULISAN SOAL ASESMEN',
    naskah_soal: 'NASKAH SOAL DAN KUNCI JAWABAN',
    rubrik_penilaian: 'RUBRIK PENILAIAN KOMPREHENSIF',
    asesmen_diagnostik: 'INSTRUMEN ASESMEN DIAGNOSTIK AWAL',
    asesmen_formatif: 'INSTRUMEN ASESMEN FORMATIF',
    asesmen_sumatif: 'INSTRUMEN ASESMEN SUMATIF LINGKUP MATERI',
    analisis_penilaian: 'ANALISIS HASIL PENILAIAN DAN KETERCAPAIAN TP',
    program_remedial: 'PROGRAM REMEDIAL DAN PENGAYAAN',
  };

  const title = docTitles[docType] || 'DOKUMEN ADMINISTRASI';

  const prompt = `
Anda adalah Instruktur Ahli Kurikulum Merdeka Pendidikan Vokasi di SMK Negeri 1 Bebandem, Karangasem, Bali.
Buatkan dokumen administrasi pembelajaran resmi: "${title}".

DATA PEMBELAJARAN RESMI:
- Satuan Pendidikan: SMK Negeri 1 Bebandem (Tahun Ajaran 2026/2027)
- Guru Pengampu: ${data.teacherName} (NIP. ${data.teacherNip})
- Mata Pelajaran: ${data.subject}
- Program Keahlian: ${data.vocation}
- Kelas / Fase / Semester: ${data.grade} / Fase ${data.phase} / ${data.semester}
- Alokasi Waktu: ${data.duration}
- Materi Pokok / Topik Pembelajaran: "${data.topic}"
- Capaian Pembelajaran (CP):
"""${data.cp}"""
- Tujuan Pembelajaran (TP) Wajib:
"""${data.tp}"""
- Model Pembelajaran: ${data.model}
- Metode: ${(data.methods || []).join(', ')}
- Dimensi Karakter: ${(data.dimensions || []).join(', ')}
- Karakteristik Peserta Didik: ${data.studentCharacteristics}

PETUNJUK KETAT PENYELARASAN CP & TP (WAJIB DITERAPKAN DI SELURUH DOKUMEN & SOAL):
1. PRINSIP KESELARASAN MUTLAK: Seluruh dokumen, kegiatan inti, materi ajar, indikator ketercapaian, soal-soal (butir 1 s.d. 10), rubrik, dan instrumen asesmen HARUS 100% SESUAI dan DITURUNKAN SECARA KETAT dari Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) serta materi pokok "${data.topic}".
2. JIKA DOKUMEN ADALAH NASKAH SOAL:
   - Wajib menyusun 10 butir soal evaluasi berkualitas tinggi yang stimulus dan pertanyaannya secara eksplisit menguji materi "${data.topic}" dan setiap butir Tujuan Pembelajaran (TP).
   - Cantumkan label indikator di awal setiap soal:
     * Soal 1 & 2: [Menguji CP Klausul 1 & TP 1] (Level Kognitif C2 - Pemahaman Konsep, Arsitektur, K3LH Industri)
     * Soal 3 & 4: [Menguji CP Klausul 2 & TP 2] (Level Kognitif C3 - Penerapan Prosedur SOP, Pengoperasian, Batas Toleransi)
     * Soal 5 & 6: [Menguji CP Klausul 3 & TP 3] (Level Kognitif C4 - Analisis Deviasi, Diagnosis Anomali & Troubleshooting)
     * Soal 7 & 8: [Menguji CP Klausul 4 & TP 4] (Level Kognitif C4/C5 - Evaluasi Mutu QC DUDIKA, Etika Kerja Menyama Braya)
     * Soal 9: [Menguji HOTS Kasus Multi-Kompetensi CP & TP] (Pilihan Ganda Kompleks C5 - Studi Kasus Multi-Faktor)
     * Soal 10: [Menguji HOTS Sintesis Pemecahan Masalah Komprehensif CP & TP] (Soal Uraian Studi Kasus Industri C6 - Perumusan SOP & Diagram Solutif)
   - Wajib sertakan "LEMBAR TERPISAH KUNCI JAWABAN DAN PEMBAHASAN LENGKAP" di bagian bawah dengan tabel: Nomor, Kunci Jawaban, Level Bloom (C1-C6), Keterkaitan CP & TP / Pembahasan Vokasi Mendalam, dan Bobot Nilai (Total 100).
3. JIKA DOKUMEN ADALAH KISI-KISI SOAL:
   - Buat tabel kisi-kisi penulisan 10 butir soal lengkap memetakan: No, Elemen & Klausul CP, Tujuan Pembelajaran (TP), Lingkup Materi Esensial ("${data.topic}"), Indikator Spesifik Butir Soal, Level Kognitif (C1-C6), Bentuk Soal (PG/PG Kompleks/Uraian), dan Bobot Skor.
4. JIKA DOKUMEN ADALAH MODUL AJAR:
   - WAJIB MENGIKUTI FORMAT PEMBELAJARAN DEEP LEARNING RESMI SECARA UTUH DARI BAGIAN A SAMPAI F:
     * A. IDENTITAS MODUL: Memuat Nama satuan pendidikan (SMK Negeri 1 Bebandem), Nama penyusun (${data.teacherName}), Mata pelajaran (${data.subject}), Fase/Kelas (Fase ${data.phase} / Kelas ${data.grade}), Semester (${data.semester}), Tahun pelajaran (${data.academicYear || '2026/2027'}), Materi/topik pembelajaran ("${data.topic}"), dan Alokasi waktu (${data.duration}).
     * B. IDENTIFIKASI:
       1. Identifikasi peserta didik (gambaran kesiapan belajar, pengetahuan awal, minat, kebutuhan belajar vokasi, dan karakteristik: ${data.studentCharacteristics}).
       2. Identifikasi materi pembelajaran (materi esensial "${data.topic}", jenis pengetahuan faktual, konseptual, prosedural, metakognitif, relevansi kehidupan nyata DUDIKA/Bali, serta tingkat kesulitan materi).
       3. Dimensi Profil Lulusan (pilih dimensi yang relevan dari 8 dimensi resmi: Keimanan & ketakwaan terhadap Tuhan YME, Kewargaan, Penalaran kritis, Kreativitas, Kolaborasi, Kemandirian, Kesehatan, Komunikasi).
     * C. DESAIN PEMBELAJARAN:
       1. Capaian Pembelajaran (CP).
       2. Lintas disiplin ilmu (integrasi numerasi/matematika terapan, bahasa/literasi manual book internasional, dan muatan lokal Bali Tri Hita Karana).
       3. Tujuan Pembelajaran (TP) yang dituju.
       4. Topik pembelajaran (masalah kontekstual).
       5. Praktik pedagogis (${data.model} dipadukan metode ${(data.methods || []).join(', ')}).
       6. Kemitraan pembelajaran (keterlibatan DUDIKA, guru serumpun, orang tua).
       7. Lingkungan pembelajaran (pengaturan ruang fisik lab/bengkel 5R, lingkungan digital, dan budaya belajar aman-inklusif).
       8. Pemanfaatan digital (video demonstrasi, software simulasi, LMS, kuis interaktif).
     * D. PENGALAMAN BELAJAR (Inti Pelaksanaan Pembelajaran Mendalam):
       1. Kegiatan Pendahuluan: Membuka pembelajaran dan membangun suasana positif, asesmen awal atau pertanyaan pemantik kontekstual, menyampaikan tujuan dan manfaat, membangun kesadaran (mindfulness) peserta didik tentang apa dan mengapa mereka belajar.
       2. Kegiatan Inti:
          a. Memahami (Prinsip: Berkesadaran dan Bermakna): Mengamati, membaca, menyimak, mengeksplorasi masalah/fenomena kontekstual, dan membangun pemahaman konsep esensial.
          b. Mengaplikasi (Prinsip: Bermakna): Menerapkan pengetahuan melalui praktik job sheet di lab/workstation, eksperimen, pengukuran parameter kerja, dan pemecahan masalah troubleshooting.
          c. Merefleksi (Prinsip: Berkesadaran): Mengevaluasi proses dan hasil belajar terhadap standar industri DUDIKA, mengidentifikasi kesulitan, saling memberikan umpan balik (Menyama Braya), serta merencanakan perbaikan secara menggembirakan.
       3. Kegiatan Penutup: Menyimpulkan pembelajaran bersama, memberikan umpan balik dan penguatan konsep, menyampaikan tindak lanjut/tugas TEFA, dan menutup pembelajaran dengan doa & salam.
     * E. ASESMEN PEMBELAJARAN:
       1. Asesmen awal (diagnostik kesiapan & pengetahuan awal).
       2. Asesmen proses (formatif: observasi LKPD, diskusi, checklist K3LH).
       3. Asesmen akhir (sumatif: tes tertulis 10 soal & unjuk kerja produk).
       4. Instrumen dan kriteria ketercapaian (KKTP = 75, rubrik analitik per butir TP, pedoman penskoran).
     * F. TINDAK LANJUT DAN LAMPIRAN:
       - Program pengayaan (peserta didik mencapai tujuan >= 75).
       - Program remedial atau pendampingan (peserta didik < 75).
       - Lembar Kerja Peserta Didik (LKPD).
       - Bahan bacaan dan media pembelajaran digital.
       - Rubrik penilaian komprehensif.
       - Lembar refleksi guru dan peserta didik (3-2-1 Exit Ticket).
       - Referensi pembelajaran (SKKNI, buku teks Kemendikbudristek, SOP industri).
5. JIKA DOKUMEN ADALAH BAHAN AJAR:
   - Sajikan modul materi yang terstruktur rapi per butir TP, mengupas tuntas konsep dan prosedur kejuruan "${data.topic}", studi kasus industri DUDIKA, serta pedoman keselamatan.
6. JIKA DOKUMEN ADALAH LKPD:
   - Susun Job Sheet Praktik dengan langkah kerja SOP teknis, parameter uji terukur, dan tabel pengamatan yang secara langsung menguji ketercapaian TP 1 sampai TP 4.
7. JIKA DOKUMEN ADALAH RUBRIK PENILAIAN / ASESMEN:
   - Setiap kriteria penilaian, skala performa (Sangat Mahir, Mahir, Cukup, Perlu Bimbingan), dan instrumen asesmen wajib menggunakan indikator ketercapaian dari setiap butir TP.

Format output: HTML bersih (gunakan tag h2, h3, p, ul, ol, table class="w-full border-collapse border border-gray-400 text-sm my-4"). Tanpa tag <html> atau <body>.
`;

  const aiText = await callGeminiSafe(prompt, 12000);
  if (aiText) {
    return res.json({ content: aiText, title });
  }

  // Resilient instant generator strictly aligned with topic & TP
  const content = generateSingleDoc(docType, {
    teacher: {
      teacherName: data.teacherName,
      teacherNip: data.teacherNip,
      subject: data.subject,
      vocation: data.vocation,
      grade: data.grade,
      phase: data.phase,
      semester: data.semester,
      academicYear: data.academicYear,
    },
    learning: {
      topic: data.topic,
      cp: data.cp,
      tp: data.tp,
      duration: data.duration,
      studentCount: data.studentCount,
      studentCharacteristics: data.studentCharacteristics,
    },
    methods: {
      methods: data.methods || [],
      model: data.model || 'Problem Based Learning (PBL)',
      dimensions: data.dimensions || [],
    },
    settings: {
      deepLearning: !!data.deepLearning,
      differentiation: !!data.differentiation,
      digitalTech: !!data.digitalTech,
      literacy: !!data.literacy,
      numeracy: !!data.numeracy,
      baliWisdom: !!data.baliWisdom,
      characterEducation: !!data.characterEducation,
      vocationalPractice: !!data.vocationalPractice,
    },
  });

  return res.json({ content, title });
});

// 3. API: Generate ALL 12 Documents in a single batch request!
app.post('/api/gemini/generate-all', async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'data wajib disertakan' });
  }

  const generated = generateAllDocs({
    teacher: {
      teacherName: data.teacherName,
      teacherNip: data.teacherNip,
      subject: data.subject,
      vocation: data.vocation,
      grade: data.grade,
      phase: data.phase,
      semester: data.semester,
      academicYear: data.academicYear,
    },
    learning: {
      topic: data.topic,
      cp: data.cp,
      tp: data.tp,
      duration: data.duration,
      studentCount: data.studentCount,
      studentCharacteristics: data.studentCharacteristics,
    },
    methods: {
      methods: data.methods || [],
      model: data.model || 'Problem Based Learning (PBL)',
      dimensions: data.dimensions || [],
    },
    settings: {
      deepLearning: !!data.deepLearning,
      differentiation: !!data.differentiation,
      digitalTech: !!data.digitalTech,
      literacy: !!data.literacy,
      numeracy: !!data.numeracy,
      baliWisdom: !!data.baliWisdom,
      characterEducation: !!data.characterEducation,
      vocationalPractice: !!data.vocationalPractice,
    },
  });

  return res.json({ documents: generated });
});

// 4. API: Refine / Edit Document with AI (Maximized Context & Search Grounding)
app.post('/api/gemini/refine-doc', async (req, res) => {
  const { currentContent, actionType, instruction, docType, data } = req.body;

  if (!currentContent) {
    return res.status(400).json({ error: 'currentContent wajib disertakan' });
  }

  const subjectStr = data?.subject || 'Kejuruan SMK';
  const topicStr = data?.topic || 'Kompetensi Pembelajaran';
  const cpStr = data?.cp || '';
  const tpStr = data?.tp || '';
  const gradeStr = data?.grade || 'XI';
  const phaseStr = data?.phase || 'F';
  const vocationStr = data?.vocation || 'SMK Negeri 1 Bebandem';
  const teacherNameStr = data?.teacherName || 'Guru Mata Pelajaran';

  const isSearchRequest =
    actionType === 'search_latest' ||
    actionType === 'soal_hots' ||
    actionType === 'remedial_pengayaan' ||
    actionType === 'bahan_ajar' ||
    actionType === 'media' ||
    (instruction && /cari|terbaru|terkini|update|2026|2027|dudika|industri|soal|remidi|pengayaan/i.test(instruction));

  const prompt = `
Anda adalah Asisten Pakar AI Kurikulum Merdeka & Konsultan DUDIKA di SMK Negeri 1 Bebandem, Karangasem, Bali.
Anda bertugas mencari informasi terbaru, menyusun konten pembelajaran berbobot tinggi, dan memperkaya dokumen administrasi guru secara presisi dan sistematis.

KONTEKS LENGKAP PEMBELAJARAN:
- Satuan Pendidikan: SMK Negeri 1 Bebandem (Tahun Ajaran 2026/2027)
- Guru Pengampu: ${teacherNameStr}
- Program Keahlian: ${vocationStr}
- Mata Pelajaran: "${subjectStr}"
- Materi Pokok / Topik: "${topicStr}"
- Kelas / Fase: Kelas ${gradeStr} (Fase ${phaseStr})
- Capaian Pembelajaran (CP) Terkait:
"""${cpStr}"""
- Rincian Tujuan Pembelajaran (TP) Terkait:
"""${tpStr}"""
- Jenis Dokumen: "${docType || 'Dokumen Administrasi Guru'}"

AKSI YANG DIPILIH: "${actionType}"
INSTRUKSI KHUSUS DARI GURU:
"""${instruction}"""

DOKUMEN AWAL SAAT INI (HTML):
"""${currentContent}"""

ATURAN DAN FORMAT EKSEKUSI:
1. JIKA AKSI TERKAIT SOAL (soal_hots, kisi_kisi, atau mencari/menambah soal):
   - Cari dan rumuskan butir-butir soal evaluasi baru berbasis stimulus studi kasus nyata industri atau troubleshooting pada materi "${topicStr}".
   - Setiap butir soal WAJIB secara eksplisit menguji indikator dari Tujuan Pembelajaran (TP) di atas.
   - Sertakan Kunci Jawaban Lengkap, Tingkat Kognitif Bloom (C2-C6), dan Rubrik/Pedoman Penskoran terukur.
   - Integrasikan ke dalam dokumen yang ada dengan susunan tabel atau daftar yang rapi.

2. JIKA AKSI TERKAIT PROGRAM REMEDIAL & PENGAYAAN (remedial_pengayaan, remidi, tutor sebaya):
   - Cari dan susun skenario bimbingan remedial yang membedah akar kesulitan siswa pada materi "${topicStr}" dan TP yang belum tuntas (KKTP < 75).
   - Susun Job Sheet atau Lembar Kerja Remedial praktis yang fokus melatih kembali kompetensi dasar "${topicStr}".
   - Susun Program Pengayaan nyata berbasis Teaching Factory (TEFA) atau studi kasus industri DUDIKA tingkat lanjut bagi siswa yang sudah tuntas (KKTP >= 75) serta skenario penugasan tutor sebaya.
   - Sajikan dalam format tabel matrik dan penjelasan langkah terstruktur.

3. JIKA AKSI TERKAIT BAHAN AJAR / LKPD / MEDIA:
   - Cari konsep esensial terkini, standar SOP industri (SKKNI/DUDIKA), prosedur keselamatan kerja (K3LH), dan studi kasus nyata untuk materi "${topicStr}".
   - Hubungkan secara nyata dengan kemitraan DUDIKA dan kearifan lokal Bali (Tri Hita Karana / Menyama Braya).

4. FORMAT OUTPUT:
   - Kembalikan HANYA kode HTML bersih (gunakan tag h2, h3, h4, p, ul, ol, table class="w-full border-collapse border border-gray-400 text-sm my-4", div).
   - Dilarang memberikan teks pendahuluan atau penutup seperti "Berikut adalah...".
   - Dilarang membungkus dengan tag <html>, <head>, atau <body>.
`;

  const aiText = await callGeminiSafe(prompt, 14000, isSearchRequest);
  if (aiText) {
    const cleaned = aiText.replace(/```html/g, '').replace(/```/g, '').trim();
    return res.json({ content: cleaned, source: 'ai' });
  }

  // Fallback if AI service is temporarily delayed - generate context-aware topic-aligned enhancement
  let refined = currentContent;
  if (actionType === 'soal_hots' || (instruction && /soal/i.test(instruction))) {
    refined += `
      <div class="mt-6 p-4 bg-rose-50 border border-rose-300 rounded-xl">
        <h4 class="font-bold text-rose-950 text-base mb-2">Tambahan Paket Soal Evaluasi &amp; Studi Kasus HOTS Terkini (${topicStr})</h4>
        <p class="text-xs text-rose-800 mb-3">Disusun selaras dengan Tujuan Pembelajaran dan standar kompetensi industri DUDIKA:</p>
        
        <div class="p-3 bg-white rounded border border-rose-200 text-xs text-slate-800 mb-3">
          <p class="font-semibold text-slate-900 mb-1">Soal Kasus 1 (Analisis Gangguan C4 - Selaras TP 3):</p>
          <p class="mb-2">Saat mengoperasikan atau menguji unit <strong>${topicStr}</strong> di workstation lab SMK Negeri 1 Bebandem, teknisi mendeteksi deviasi parameter kerja di atas batas toleransi yang mengakibatkan penurunan efisiensi sistem. Analisislah 2 kemungkinan faktor penyebab utama dan uraikan prosedur isolasi masalah secara berurutan sesuai SOP!</p>
          <div class="bg-slate-50 p-2 rounded text-slate-700">
            <strong>Kunci &amp; Rubrik:</strong> Identifikasi sumber anomali (skor 5), langkah isolasi komponen bertahap (skor 5). Total Skor: 10.
          </div>
        </div>

        <div class="p-3 bg-white rounded border border-rose-200 text-xs text-slate-800">
          <p class="font-semibold text-slate-900 mb-1">Soal Kasus 2 (Sintesis Solusi C6 - Selaras TP 4):</p>
          <p class="mb-2">Rancanglah lembar ceklis kendali mutu (Quality Control) untuk memvalidasi kelaikan hasil kerja materi <strong>${topicStr}</strong> sebelum diserahterimakan kepada mitra industri atau unit produksi Teaching Factory (TEFA)!</p>
          <div class="bg-slate-50 p-2 rounded text-slate-700">
            <strong>Kunci &amp; Rubrik:</strong> Kelengkapan parameter QC (skor 5), kejelasan standar toleransi (skor 5). Total Skor: 10.
          </div>
        </div>
      </div>
    `;
  } else if (actionType === 'remedial_pengayaan' || (instruction && /remidi|pengayaan/i.test(instruction))) {
    refined += `
      <div class="mt-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl">
        <h4 class="font-bold text-emerald-950 text-base mb-2">Program Remedial &amp; Pengayaan Terstruktur Materi: ${topicStr}</h4>
        
        <div class="mb-4">
          <h5 class="font-semibold text-red-900 text-xs uppercase tracking-wider mb-1">1. Rencana Aksi Remedial Khusus (KKTP &lt; 75):</h5>
          <table class="w-full border-collapse border border-red-300 text-xs bg-white">
            <thead class="bg-red-800 text-white">
              <tr>
                <th class="border border-red-300 p-2 text-left">Fokus Indikator TP (${topicStr})</th>
                <th class="border border-red-300 p-2 text-left">Bentuk Intervensi Pembelajaran</th>
                <th class="border border-red-300 p-2 text-center w-28">Instrumen Re-Asesmen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-red-300 p-2 font-medium">Penguasaan Prosedur &amp; Langkah Praktik Kerja</td>
                <td class="border border-red-300 p-2">Praktik ulang terbimbing di workstation lab didampingi tutor sebaya dan instruktur.</td>
                <td class="border border-red-300 p-2 text-center">Job Sheet Remedial Mandiri</td>
              </tr>
              <tr>
                <td class="border border-red-300 p-2 font-medium">Analisis Troubleshooting &amp; Deviasi Teknis</td>
                <td class="border border-red-300 p-2">Pemberian studi kasus terarah mengenai anomali operasional pada unit ${topicStr}.</td>
                <td class="border border-red-300 p-2 text-center">Tes Lisan &amp; Simulasi</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h5 class="font-semibold text-emerald-900 text-xs uppercase tracking-wider mb-1">2. Rencana Aksi Pengayaan (KKTP &ge; 75):</h5>
          <div class="p-3 bg-white rounded border border-emerald-200 text-xs text-slate-800 space-y-1">
            <p><strong>&bull; Penugasan Teaching Factory (TEFA):</strong> Siswa ditugaskan merakit atau menyelesaikan pesanan riil mitra DUDIKA materi <em>${topicStr}</em> dengan standar toleransi industri presisi tinggi.</p>
            <p><strong>&bull; Pemberdayaan Tutor Sebaya:</strong> Siswa berperan memfasilitasi rekan satu regu dalam mempraktikkan SOP teknis dengan mengedepankan etika kerja Bali <em>Menyama Braya</em>.</p>
          </div>
        </div>
      </div>
    `;
  } else if (actionType === 'perluas') {
    refined += `
      <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h4 class="font-bold text-blue-900 text-sm mb-1">Tambahan Pengayaan &amp; Konteks Industri Terkini (DUDIKA 2026/2027)</h4>
        <p class="text-xs text-slate-700 leading-relaxed mb-2">Pada implementasi terkini di dunia usaha dan dunia industri (DUDIKA), materi <strong>${topicStr}</strong> telah mengadopsi integrasi sistem otomasi cerdas, efisiensi energi, dan protokol keamanan data berstandar global. Peserta didik dibekali kemampuan membaca alur sistem secara holistik dan melakukan tindakan preventif guna menjamin keandalan operasional.</p>
        <p class="text-xs text-blue-950 font-semibold">&bull; Standar Acuan: SKKNI Level II/III dan Manual Operasional Mitra DUDIKA SMK Negeri 1 Bebandem.</p>
      </div>
    `;
  } else if (actionType === 'bali') {
    refined += `
      <div class="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-xl">
        <h4 class="font-bold text-amber-900 text-sm mb-1">Integrasi Kearifan Lokal Bali (Tri Hita Karana &amp; Menyama Braya)</h4>
        <p class="text-xs text-amber-950 leading-relaxed mb-1">Dalam setiap tahapan praktik materi <strong>${topicStr}</strong>, peserta didik senantiasa mengamalkan nilai-nilai luhur Bali:</p>
        <ul class="list-disc pl-5 text-xs text-amber-900 space-y-1">
          <li><strong>Parahyangan:</strong> Mengawali dan mengakhiri kegiatan di lab/bengkel dengan doa rasa syukur atas keselamatan kerja.</li>
          <li><strong>Pawongan (Menyama Braya):</strong> Menjaga komunikasi santun, saling membantu dalam tim kerja teknis, dan menghindari perselisihan.</li>
          <li><strong>Palemahan:</strong> Menjaga kelestarian lingkungan bengkel melalui pengelolaan limbah praktik dan budaya 5R (Ringkas, Rapi, Resik, Rawat, Rajin).</li>
        </ul>
      </div>
    `;
  } else if (actionType === 'sederhanakan') {
    refined += `
      <div class="mt-4 p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800">
        <h4 class="font-bold text-slate-900 mb-1">Ringkasan Konsep Inti (Bahasa Siswa):</h4>
        <p class="leading-relaxed">Secara sederhana, materi <strong>${topicStr}</strong> mengajarkan kita 3 langkah pokok: pertama mengenali bagian dan fungsi dasarnya, kedua merangkai atau mengoperasikannya sesuai urutan buku panduan (SOP), dan ketiga memeriksa apakah hasilnya sudah berfungsi normal dan aman digunakan.</p>
      </div>
    `;
  } else {
    refined += `
      <div class="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950">
        <h4 class="font-bold text-indigo-900 mb-1">Pembaruan Berbasis AI (Materi: ${topicStr}):</h4>
        <p class="text-slate-700 leading-relaxed">${instruction || 'Data dan uraian kompetensi telah diselaraskan dengan standar capaian pembelajaran terkini.'}</p>
      </div>
    `;
  }

  return res.json({ content: refined, source: 'curated' });
});


// 5. API: Google Spreadsheet Web App Sync Proxy (Solves browser CORS & follows redirects)
app.post('/api/sync-sheets', async (req, res) => {
  const { webAppUrl, record } = req.body;
  if (!webAppUrl || typeof webAppUrl !== 'string' || !webAppUrl.trim()) {
    return res.status(400).json({
      success: false,
      message: 'URL Google Apps Script wajib diisi. Silakan tempel URL Web App dari menu Terapkan Google Spreadsheet.',
    });
  }

  const cleanUrl = webAppUrl.trim();

  // Diagnostic 1: User pasted spreadsheet link instead of Web App URL
  if (cleanUrl.includes('docs.google.com/spreadsheets')) {
    return res.status(400).json({
      success: false,
      message: 'GAGAL: Anda memasukkan tautan Google Spreadsheet, BUKAN URL Aplikasi Web! Ikuti langkah: Buka Spreadsheet > Ekstensi > Apps Script > Terapkan (Deploy) > Penerapan Baru > Aplikasi Web, lalu salin URL yang berakhiran "/exec".',
    });
  }

  // Diagnostic 2: User pasted /dev testing URL
  if (cleanUrl.endsWith('/dev')) {
    return res.status(400).json({
      success: false,
      message: 'GAGAL: URL Anda berakhiran "/dev" (URL pengujian pribadi). Di Google Apps Script, klik Terapkan > Kelola Penerapan > Salin URL Aplikasi Web resmi yang berakhiran "/exec".',
    });
  }

  // Diagnostic 3: Invalid domain
  if (!cleanUrl.includes('script.google.com/macros/s/')) {
    return res.status(400).json({
      success: false,
      message: 'GAGAL: Format URL tidak valid. URL resmi Google Apps Script harus berformat: https://script.google.com/macros/s/.../exec',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const payload = JSON.stringify({
      action: 'SYNC_ALL',
      record: record || {},
    });

    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseText = await response.text();

    // Diagnostic 4: Error 404 - File/Deployment not found
    if (
      response.status === 404 ||
      responseText.includes('檔案不存在') ||
      responseText.includes('File not found') ||
      responseText.includes('does not exist') ||
      responseText.includes('找不到網頁')
    ) {
      return res.status(404).json({
        success: false,
        code: 'URL_NOT_FOUND',
        message: 'URL Web App Google Apps Script Tidak Ditemukan (Error 404). Kemungkinan penyebab: 1) Anda menyalin Script ID dari address bar editor browser (bukan dari tombol Terapkan), atau 2) Penerapan belum dibuat/disimpan. Solusi: Buka Apps Script > klik tombol Terapkan (Deploy) di kanan atas > Kelola Penerapan > Salin URL Aplikasi Web yang berakhiran "/exec".',
      });
    }

    // Diagnostic 5: Access set to "Only myself" redirecting to Google Login
    if (
      response.status === 401 ||
      response.status === 403 ||
      responseText.includes('ServiceLogin') ||
      responseText.includes('accounts.google.com') ||
      responseText.includes('Sign in - Google Accounts')
    ) {
      return res.status(403).json({
        success: false,
        code: 'PERMISSION_DENIED',
        message: 'GAGAL OTORISASI: Web App Anda saat ini disetel dengan akses "Hanya saya" (Only myself) atau dibatasi domain sekolah. Cara memperbaikinya: Buka Google Apps Script > Terapkan > Kelola Penerapan > Klik ikon Pensil (Edit) > Pada "Siapa yang memiliki akses", pilih "Siapa saja" (Anyone) > Klik Terapkan.',
      });
    }

    try {
      const data = JSON.parse(responseText);
      if (data.status === 'SUCCESS' || response.ok) {
        return res.json({
          success: true,
          message: data.message || 'Data berhasil disinkronkan ke 6 Sheet Google Spreadsheet!',
          timestamp: data.timestamp || new Date().toLocaleString('id-ID'),
        });
      } else {
        return res.status(500).json({
          success: false,
          message: data.error || data.message || 'Google Apps Script merespons kesalahan saat menulis data.',
        });
      }
    } catch {
      if (response.ok) {
        return res.json({
          success: true,
          message: 'Data berhasil terkirim ke Google Apps Script!',
          timestamp: new Date().toLocaleString('id-ID'),
        });
      }
      return res.status(500).json({
        success: false,
        message: `Google Apps Script merespons status ${response.status}: ${responseText.slice(0, 180)}`,
      });
    }
  } catch (err: any) {
    console.error('Server sync-sheets error:', err);
    if (err.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'Koneksi ke Google Apps Script batas waktu (timeout). Pastikan spreadsheet Anda aktif dan coba kembali.',
      });
    }
    return res.status(500).json({
      success: false,
      message: `Gagal menghubungi Google Apps Script: ${err.message}`,
    });
  }
});

// 6. API: Test Google Spreadsheet Web App Connection (GET check)
app.post('/api/test-sheets-url', async (req, res) => {
  const { webAppUrl } = req.body;
  if (!webAppUrl || typeof webAppUrl !== 'string' || !webAppUrl.trim()) {
    return res.json({ success: false, message: 'URL tidak boleh kosong. Masukkan URL Web App Google Apps Script.' });
  }

  const cleanUrl = webAppUrl.trim();
  if (cleanUrl.includes('docs.google.com/spreadsheets')) {
    return res.json({
      success: false,
      message: 'Ini tautan Google Spreadsheet biasa, bukan URL Aplikasi Web. Salin URL dari Apps Script > Terapkan > Kelola Penerapan.',
    });
  }
  if (!cleanUrl.includes('script.google.com/macros/s/')) {
    return res.json({
      success: false,
      message: 'Format URL tidak valid. Harus diawali: https://script.google.com/macros/s/... dan berakhiran /exec',
    });
  }
  if (cleanUrl.endsWith('/dev')) {
    return res.json({
      success: false,
      message: 'URL berakhiran /dev (mode pengujian pribadi). Di Google Apps Script, klik Terapkan > Kelola Penerapan > Salin URL resmi yang berakhiran /exec.',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(cleanUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();

    // Check for 404 / does not exist
    if (
      response.status === 404 ||
      text.includes('檔案不存在') ||
      text.includes('File not found') ||
      text.includes('does not exist') ||
      text.includes('找不到網頁')
    ) {
      return res.json({
        success: false,
        code: 'URL_NOT_FOUND',
        message: 'URL Web App TIDAK DITEMUKAN oleh Google (Error 404). Pastikan Anda telah mengklik tombol Terapkan (Deploy) > Penerapan Baru > Aplikasi Web, bukan menyalin ID dari address bar editor.',
      });
    }

    if (
      response.status === 401 ||
      response.status === 403 ||
      text.includes('accounts.google.com') ||
      text.includes('ServiceLogin')
    ) {
      return res.json({
        success: false,
        code: 'PERMISSION_DENIED',
        message: 'Web App terdeteksi, namun akses masih terkunci "Hanya Saya" (Only myself) atau akun domain. Ubah ke "Siapa saja" (Anyone) di menu Penerapan Google Apps Script.',
      });
    }

    if (!response.ok) {
      return res.json({
        success: false,
        message: `Google Apps Script merespons status HTTP ${response.status}: ${text.slice(0, 120)}`,
      });
    }

    try {
      const json = JSON.parse(text);
      return res.json({
        success: true,
        message: `Koneksi Berhasil! Status: ${json.status || 'ONLINE'} - ${json.school || 'SMK Negeri 1 Bebandem'}`,
      });
    } catch {
      return res.json({
        success: true,
        message: 'Koneksi terhubung ke Google Apps Script (HTTP 200 OK)!',
      });
    }
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Gagal menghubungi URL: ${err.message}`,
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      console.warn(`[WARN] dist directory not found at ${distPath}. Falling back to Vite middleware.`);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SI GURU server running at http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
