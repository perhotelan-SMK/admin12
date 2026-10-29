import { TeacherIdentity, LearningIdentity, LearningMethods, AdditionalSettings } from '../types';

export interface DocGenInput {
  teacher: TeacherIdentity;
  learning: LearningIdentity;
  methods: LearningMethods;
  settings: AdditionalSettings;
}

export function generateSingleDoc(
  docType: string,
  inputOrTeacher: DocGenInput | TeacherIdentity,
  maybeLearning?: LearningIdentity,
  maybeMethods?: LearningMethods,
  maybeSettings?: AdditionalSettings
): string {
  let teacher: TeacherIdentity;
  let learning: LearningIdentity;
  let methods: LearningMethods;
  let settings: AdditionalSettings;

  if (inputOrTeacher && 'teacher' in inputOrTeacher) {
    teacher = (inputOrTeacher as DocGenInput).teacher;
    learning = (inputOrTeacher as DocGenInput).learning;
    methods = (inputOrTeacher as DocGenInput).methods;
    settings = (inputOrTeacher as DocGenInput).settings;
  } else {
    teacher = inputOrTeacher as TeacherIdentity;
    learning = maybeLearning!;
    methods = maybeMethods!;
    settings = maybeSettings!;
  }

  teacher = teacher || ({} as any);
  learning = learning || ({} as any);
  methods = methods || ({} as any);
  settings = settings || ({} as any);

  const teacherName = teacher.teacherName || 'Guru Pengampu';
  const nip = teacher.teacherNip || '-';
  const subject = teacher.subject || 'Mata Pelajaran Kejuruan';
  const vocation = teacher.vocation || 'Teknik & Vokasi';
  const grade = teacher.grade || 'XI (Sebelas)';
  const phase = teacher.phase || 'F';
  const semester = teacher.semester || 'Ganjil';
  const topic = learning.topic || 'Kompetensi Kejuruan';
  const cp = learning.cp || 'Peserta didik mampu memahami dan menerapkan prosedur kejuruan berstandar industri.';
  const duration = learning.duration || '4 JP x 45 Menit';
  const dimensions = methods.dimensions?.length ? methods.dimensions.join(', ') : 'Penalaran Kritis, Kolaborasi, Kemandirian, Kreativitas';
  const methodList = methods.methods?.length ? methods.methods.join(', ') : 'Praktik Langsung, Diskusi, Problem Solving, Demonstrasi';
  const model = methods.model || 'Problem Based Learning (PBL)';

  // Parse TPs into an array of clean strings, removing existing number prefixes if present
  const rawTpLines = (learning.tp || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^(\d+[\.\)]|\-|\*|•)\s*/, ''));

  const parsedTps = rawTpLines.length > 0 ? rawTpLines : [
    `Menganalisis prinsip dasar, arsitektur, dan regulasi industri pada materi ${topic}`,
    `Menerapkan langkah-langkah kerja operasional dan kepatuhan SOP pada materi ${topic}`,
    `Mendiagnosis kendala atau deviasi hasil pengujian serta melakukan troubleshooting pada ${topic}`,
    `Mengevaluasi hasil karya/praktik secara mandiri dan berkolaborasi dalam tim pada ${topic}`,
  ];

  const tp1 = parsedTps[0] || `Memahami konsep esensial pada materi ${topic}`;
  const tp2 = parsedTps[1] || `Menerapkan prosedur teknis operasional pada materi ${topic}`;
  const tp3 = parsedTps[2] || `Mendiagnosis kendala teknis dan troubleshooting pada ${topic}`;
  const tp4 = parsedTps[3] || `Mengevaluasi mutu dan optimalisasi hasil kerja pada ${topic}`;

  const formattedTpList = parsedTps.map((t, idx) => `${idx + 1}. ${t}`).join('\n');

  const headersInfo = `
    <div class="meta-box mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <table class="w-full text-sm">
        <tr><td class="font-semibold w-44">Satuan Pendidikan</td><td>: SMK Negeri 1 Bebandem</td></tr>
        <tr><td class="font-semibold">Mata Pelajaran</td><td>: ${subject}</td></tr>
        <tr><td class="font-semibold">Program Keahlian</td><td>: ${vocation}</td></tr>
        <tr><td class="font-semibold">Kelas / Fase / Semester</td><td>: ${grade} / Fase ${phase} / ${semester}</td></tr>
        <tr><td class="font-semibold">Topik / Materi Pokok</td><td>: <strong>${topic}</strong></td></tr>
        <tr><td class="font-semibold">Alokasi Waktu</td><td>: ${duration}</td></tr>
        <tr><td class="font-semibold">Tahun Ajaran</td><td>: ${teacher.academicYear || '2026/2027'}</td></tr>
        <tr><td class="font-semibold">Guru Pengampu</td><td>: ${teacherName} (NIP. ${nip})</td></tr>
      </table>
    </div>
  `;

  switch (docType) {
    case 'atp':
      return `
        ${headersInfo}
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-blue-950 uppercase tracking-wide">ALUR TUJUAN PEMBELAJARAN (ATP)</h2>
          <p class="text-sm font-semibold text-slate-700">KURIKULUM MERDEKA &bull; FASE ${phase} &bull; TAHUN AJARAN ${teacher.academicYear || '2026/2027'}</p>
        </div>

        <h3 class="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-3">I. RASIONAL DAN ELEMEN CAPAIAN PEMBELAJARAN</h3>
        <p class="text-sm text-justify mb-3 text-slate-800 leading-relaxed">
          Mata pelajaran <strong>${subject}</strong> pada Program Keahlian <strong>${vocation}</strong> di SMK Negeri 1 Bebandem membekali peserta didik dengan kompetensi keahlian profesional yang adaptif terhadap perkembangan dunia usaha, dunia industri, dan dunia kerja (DUDIKA). Alur Tujuan Pembelajaran ini disusun secara logis dan terstruktur dari penguasaan konsep, eksekusi keterampilan teknis, pemecahan masalah (troubleshooting), hingga evaluasi mutu berbasis kearifan lokal Bali (Tri Hita Karana).
        </p>
        <div class="bg-slate-50 border-l-4 border-blue-700 p-3 mb-5 text-sm">
          <strong>Capaian Pembelajaran (CP) Elemen:</strong>
          <p class="italic text-slate-700 mt-1">${cp}</p>
        </div>

        <h3 class="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-3">II. MATRIKS ALUR TUJUAN PEMBELAJARAN (ATP)</h3>
        <p class="text-xs text-slate-600 mb-2 italic">Matriks berikut memetakan elemen CP ke dalam alur Tujuan Pembelajaran terurut yang secara spesifik menuntaskan materi <strong>"${topic}"</strong>:</p>

        <table class="w-full border-collapse border border-gray-400 text-xs my-4 leading-normal">
          <thead class="bg-blue-900 text-white">
            <tr>
              <th class="border border-gray-400 p-2 text-center w-12">Kode Alur</th>
              <th class="border border-gray-400 p-2 text-left w-28">Elemen CP</th>
              <th class="border border-gray-400 p-2 text-left">Alur Tujuan Pembelajaran (TP)</th>
              <th class="border border-gray-400 p-2 text-left w-36">Lingkup Materi Pokok</th>
              <th class="border border-gray-400 p-2 text-left w-36">Indikator Ketercapaian (IKTP)</th>
              <th class="border border-gray-400 p-2 text-center w-12">JP</th>
              <th class="border border-gray-400 p-2 text-left w-28">Profil Kelulusan</th>
              <th class="border border-gray-400 p-2 text-center w-24">Asesmen</th>
            </tr>
          </thead>
          <tbody>
            ${parsedTps
              .map((t, idx) => {
                const subTopics = [
                  `Konsep esensial, arsitektur dasar, dan regulasi K3LH ${topic}`,
                  `Prosedur teknis, alur implementasi SOP, dan eksekusi ${topic}`,
                  `Metode pengujian performa, analisis galat & troubleshooting ${topic}`,
                  `Standar kendali mutu (QC), dokumentasi & portofolio ${topic}`,
                ];
                const iktp = [
                  `Mampu menjelaskan konsep dan prinsip kerja ${topic} secara runut tanpa kesalahan konsep.`,
                  `Mampu mengeksekusi langkah kerja teknis ${topic} sesuai SOP industri dan batas toleransi.`,
                  `Mampu melacak galat/anomali pada ${topic} dan merumuskan perbaikan solutif.`,
                  `Mampu menguji mutu output ${topic} dan mempresentasikan laporan kerja tim secara mandiri.`,
                ];
                const jps = [4, 6, 4, 4];
                const profils = ['Penalaran Kritis', 'Kemandirian & Kritis', 'Kreativitas & Kritis', 'Kolaborasi & Komunikasi'];
                const asses = ['Diagnostik & Tes Tertulis', 'Formatif Praktik (Job Sheet)', 'Formatif Observasi (Troubleshoot)', 'Sumatif Praktik & Portofolio'];

                return `
                  <tr>
                    <td class="border border-gray-400 p-2 text-center font-bold text-blue-900">${phase}.${idx + 1}</td>
                    <td class="border border-gray-400 p-2 font-semibold">${subject.slice(0, 24)}</td>
                    <td class="border border-gray-400 p-2 text-slate-900 font-medium">${t}</td>
                    <td class="border border-gray-400 p-2 text-slate-700">${subTopics[idx % subTopics.length]}</td>
                    <td class="border border-gray-400 p-2 text-slate-700">${iktp[idx % iktp.length]}</td>
                    <td class="border border-gray-400 p-2 text-center font-bold">${jps[idx % jps.length]} JP</td>
                    <td class="border border-gray-400 p-2 text-slate-700">${profils[idx % profils.length]}</td>
                    <td class="border border-gray-400 p-2 text-center text-[11px]">${asses[idx % asses.length]}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
          <tfoot class="bg-slate-100 font-bold">
            <tr>
              <td colspan="5" class="border border-gray-400 p-2 text-right">TOTAL ALOKASI WAKTU MATERI INTI:</td>
              <td class="border border-gray-400 p-2 text-center text-blue-900 font-extrabold">${parsedTps.length * 4} JP</td>
              <td colspan="2" class="border border-gray-400 p-2 text-xs text-slate-600">SMK Negeri 1 Bebandem TA ${teacher.academicYear || '2026/2027'}</td>
            </tr>
          </tfoot>
        </table>

        <h3 class="text-lg font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mt-6 mb-3">III. GLOSARIUM DAN SUMBER BELAJAR</h3>
        <ul class="list-disc pl-6 text-xs space-y-1.5 text-slate-700 mb-4">
          <li><strong>${topic}:</strong> Lingkup kompetensi kejuruan yang dipelajari dan diujikan pada unit pembelajaran ini.</li>
          <li><strong>Capaian Pembelajaran (CP):</strong> Kompetensi pembelajaran yang harus dicapai peserta didik pada setiap fase perkembangan.</li>
          <li><strong>Indikator Ketercapaian Tujuan Pembelajaran (IKTP):</strong> Parameter keterukuran performa peserta didik selama proses dan akhir pembelajaran.</li>
          <li><strong>Sumber Belajar:</strong> Modul Ajar Digital SMK Negeri 1 Bebandem, Jobsheet Praktik Laboratorium/Bengkel, Dokumentasi Resmi Industri Terkait, Standar Operasional Prosedur (SOP) DUDIKA.</li>
        </ul>
      `;

    case 'modul_ajar':
      return `
        ${headersInfo}
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-blue-950 uppercase tracking-wide">MODUL AJAR PEMBELAJARAN MENDALAM (DEEP LEARNING)</h2>
          <p class="text-xs font-semibold text-slate-700">KURIKULUM MERDEKA &bull; SMK NEGERI 1 BEBANDEM &bull; TAHUN AJARAN ${teacher.academicYear || '2026/2027'}</p>
        </div>

        <!-- A. IDENTITAS MODUL -->
        <h3 class="text-base font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-3 uppercase">A. IDENTITAS MODUL</h3>
        <p class="text-xs text-slate-600 mb-2 italic">Isilah identitas pembelajaran berikut.</p>
        <table class="w-full border-collapse border border-gray-300 text-xs mb-5 bg-white">
          <tbody>
            <tr>
              <td class="border border-gray-300 p-2.5 font-semibold bg-slate-50 w-56">Nama satuan pendidikan</td>
              <td class="border border-gray-300 p-2.5 font-bold text-blue-950">SMK Negeri 1 Bebandem</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2.5 font-semibold bg-slate-50">Nama penyusun</td>
              <td class="border border-gray-300 p-2.5 font-medium">${teacherName} (NIP. ${nip})</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2.5 font-semibold bg-slate-50">Mata pelajaran</td>
              <td class="border border-gray-300 p-2.5 font-medium">${subject} (Program Keahlian: ${vocation})</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2.5 font-semibold bg-slate-50">Fase / Kelas</td>
              <td class="border border-gray-300 p-2.5 font-medium">Fase ${phase} / Kelas ${grade}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2.5 font-semibold bg-slate-50">Semester</td>
              <td class="border border-gray-300 p-2.5 font-medium">${semester}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2.5 font-semibold bg-slate-50">Tahun pelajaran</td>
              <td class="border border-gray-300 p-2.5 font-medium">${teacher.academicYear || '2026/2027'}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2.5 font-semibold bg-slate-50">Materi / topik pembelajaran</td>
              <td class="border border-gray-300 p-2.5 font-bold text-blue-900">${topic}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2.5 font-semibold bg-slate-50">Alokasi waktu</td>
              <td class="border border-gray-300 p-2.5 font-medium">${duration}</td>
            </tr>
          </tbody>
        </table>

        <!-- B. IDENTIFIKASI -->
        <h3 class="text-base font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-3 uppercase">B. IDENTIFIKASI</h3>
        
        <div class="mb-4">
          <h4 class="font-bold text-blue-900 text-xs mb-1 uppercase tracking-wide">1. Identifikasi Peserta Didik</h4>
          <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 leading-relaxed space-y-1.5">
            <p><strong>&bull; Gambaran Kesiapan Belajar &amp; Pengetahuan Awal:</strong> Peserta didik telah memahami pengenalan dasar keselamatan kerja bengkel/lab (K3LH) dan operasional perangkat kejuruan dasar, namun memerlukan jembatan penguatan konsep untuk materi spesifik <em>${topic}</em>.</p>
            <p><strong>&bull; Minat &amp; Kebutuhan Belajar:</strong> Memiliki minat tinggi pada aktivitas praktik kejuruan (hands-on workshop) berorientasi produk riil, membutuhkan bimbingan bertahap (scaffolding) pada bagian analisis kendala teknis dan penulisan laporan.</p>
            <p><strong>&bull; Karakteristik Peserta Didik:</strong> ${learning.studentCharacteristics || 'Gaya belajar dominan visual dan kinestetik praktis, antusias terhadap eksplorasi lab, serta adaptif terhadap perangkat digital.'} (Jumlah: ${learning.studentCount || 36} peserta didik).</p>
          </div>
        </div>

        <div class="mb-4">
          <h4 class="font-bold text-blue-900 text-xs mb-1 uppercase tracking-wide">2. Identifikasi Materi Pembelajaran</h4>
          <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 leading-relaxed space-y-1.5">
            <p><strong>&bull; Materi Esensial:</strong> Prinsip dasar arsitektur, prosedur kerja operasional (SOP), verifikasi batas toleransi mutu, dan teknik troubleshooting pada <strong>${topic}</strong>.</p>
            <p><strong>&bull; Jenis Pengetahuan yang Dipelajari:</strong></p>
            <ul class="list-disc pl-5 space-y-0.5">
              <li><em>Pengetahuan Faktual:</em> Istilah teknis, komponen peralatan, regulasi K3LH, dan spesifikasi standar industri.</li>
              <li><em>Pengetahuan Konseptual:</em> Prinsip kerja sistem, keterhubungan antar komponen, dan alur logika proses <strong>${topic}</strong>.</li>
              <li><em>Pengetahuan Prosedural:</em> Langkah kerja pengoperasian, pengukuran parameter, dan algoritma penanganan galat.</li>
              <li><em>Pengetahuan Metakognitif:</em> Kemampuan menilai keandalan hasil kerja mandiri dan merencanakan strategi perbaikan sistematis.</li>
            </ul>
            <p><strong>&bull; Relevansi dengan Kehidupan Nyata:</strong> Kompetensi <em>${topic}</em> digunakan langsung dalam alur kerja industri modern DUDIKA mitra SMK Negeri 1 Bebandem, serta relevan untuk pemberdayaan wirausaha lokal (UMKM di Bali).</p>
            <p><strong>&bull; Tingkat Kesulitan Materi:</strong> Menengah hingga Kompleks (membutuhkan kemampuan berpikir tingkat tinggi C3–C6, ketelitian pengukuran, dan penalaran kritis dalam troubleshooting).</p>
          </div>
        </div>

        <div class="mb-5">
          <h4 class="font-bold text-blue-900 text-xs mb-1 uppercase tracking-wide">3. Dimensi Profil Lulusan</h4>
          <p class="text-xs text-slate-600 mb-2 italic">Dimensi Profil Lulusan yang relevan dengan tujuan pembelajaran:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div class="border border-blue-200 bg-blue-50/50 p-2.5 rounded">
              <span class="font-bold text-blue-900">&check; Keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa:</span> Membuka dan menutup aktivitas praktik dengan doa serta menjunjung tinggi kejujuran data pengukuran.
            </div>
            <div class="border border-blue-200 bg-blue-50/50 p-2.5 rounded">
              <span class="font-bold text-blue-900">&check; Kewargaan:</span> Mematuhi etika profesi kejuruan dan tanggung jawab sosial terhadap keselamatan lingkungan kerja.
            </div>
            <div class="border border-blue-200 bg-blue-50/50 p-2.5 rounded">
              <span class="font-bold text-blue-900">&check; Penalaran kritis:</span> Mendiagnosis akar masalah kerusakan teknis, menganalisis deviasi parameter, dan merumuskan solusi objektif.
            </div>
            <div class="border border-blue-200 bg-blue-50/50 p-2.5 rounded">
              <span class="font-bold text-blue-900">&check; Kreativitas:</span> Mengembangkan inovasi modifikasi alur kerja dan optimalisasi performa hasil karya kejuruan.
            </div>
            <div class="border border-blue-200 bg-blue-50/50 p-2.5 rounded">
              <span class="font-bold text-blue-900">&check; Kolaborasi:</span> Bekerja sama harmonis dalam tim kerja workstation sesuai nilai kearifan lokal Bali <em>"Menyama Braya"</em>.
            </div>
            <div class="border border-blue-200 bg-blue-50/50 p-2.5 rounded">
              <span class="font-bold text-blue-900">&check; Kemandirian:</span> Mengoperasikan peralatan dan menyelesaikan job sheet secara disiplin tanpa bergantung penuh pada instruktur.
            </div>
            <div class="border border-blue-200 bg-blue-50/50 p-2.5 rounded">
              <span class="font-bold text-blue-900">&check; Kesehatan:</span> Menerapkan standar keselamatan kerja K3LH, postur ergonomis, dan kebersihan lingkungan bengkel/lab (5R).
            </div>
            <div class="border border-blue-200 bg-blue-50/50 p-2.5 rounded">
              <span class="font-bold text-blue-900">&check; Komunikasi:</span> Mempresentasikan hasil pengujian teknis secara runut dan menerima masukan dengan sikap terbuka.
            </div>
          </div>
        </div>

        <!-- C. DESAIN PEMBELAJARAN -->
        <h3 class="text-base font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-3 uppercase">C. DESAIN PEMBELAJARAN</h3>
        
        <div class="space-y-3 text-xs text-slate-800 leading-relaxed mb-5">
          <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg">
            <h4 class="font-bold text-blue-900 mb-1 uppercase tracking-wide">1. Capaian Pembelajaran (CP)</h4>
            <p class="italic text-slate-700">${cp}</p>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg">
            <h4 class="font-bold text-blue-900 mb-1 uppercase tracking-wide">2. Lintas Disiplin Ilmu</h4>
            <p>Terintegrasi erat dengan <strong>Matematika Terapan/Numerasi</strong> (analisis toleransi statistik, kalkulasi parameter), <strong>Bahasa Indonesia &amp; Inggris</strong> (literasi dokumen manual book internasional, penyusunan laporan SOP), serta <strong>Pendidikan Pancasila / Muatan Lokal Bali</strong> (etos kerja gotong-royong dan filosofi kerja harmonis <em>Tri Hita Karana</em>).</p>
          </div>

          <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-lg">
            <h4 class="font-bold text-emerald-950 mb-1 uppercase tracking-wide">3. Tujuan Pembelajaran (TP)</h4>
            <p class="text-slate-600 mb-1 italic">Rumusan kemampuan yang dapat ditunjukkan peserta didik setelah belajar:</p>
            <div class="whitespace-pre-line font-medium text-emerald-900">${formattedTpList}</div>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg">
            <h4 class="font-bold text-blue-900 mb-1 uppercase tracking-wide">4. Topik Pembelajaran</h4>
            <p><strong>${topic}</strong> (Penyelesaian masalah kontekstual: Penanganan kasus riil pemenuhan kendali mutu industri DUDIKA dan troubleshooting sistem operasional).</p>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg">
            <h4 class="font-bold text-blue-900 mb-1 uppercase tracking-wide">5. Praktik Pedagogis</h4>
            <p>Pendekatan pembelajaran berpusat pada peserta didik menggunakan model <strong>${model}</strong> dipadukan dengan metode <strong>${methodList}</strong>, menekankan pengalaman otentik, inkuiri terarah, dan pemecahan masalah.</p>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg">
            <h4 class="font-bold text-blue-900 mb-1 uppercase tracking-wide">6. Kemitraan Pembelajaran</h4>
            <p>Keterlibatan kolaboratif bersama instruktur praktisi dari mitra industri DUDIKA SMK Negeri 1 Bebandem (guru tamu/asesor eksternal), kolaborasi antarguru kejuruan serumpun, serta pendampingan orang tua dalam pembiasaan etos kerja positif.</p>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg">
            <h4 class="font-bold text-blue-900 mb-1 uppercase tracking-wide">7. Lingkungan Pembelajaran</h4>
            <p><strong>&bull; Pengaturan Ruang Fisik:</strong> Penataan meja kerja lab/bengkel berkelompok (workstation kolaboratif), pencahayaan memadai, ventilasi udara bersih, dan kepatuhan jalur evakuasi K3LH.<br>
            <strong>&bull; Lingkungan Digital:</strong> Jaringan intranet lab sekolah, akses platform pembelajaran (LMS/Google Classroom), dan repositori materi digital.<br>
            <strong>&bull; Budaya Belajar:</strong> Suasana belajar yang aman, suportif, inklusif terhadap perbedaan kecepatan belajar, bebas intimidasi, dan saling menghargai pendapat.</p>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg">
            <h4 class="font-bold text-blue-900 mb-1 uppercase tracking-wide">8. Pemanfaatan Digital</h4>
            <p>Pemanfaatan media tayang interaktif, video demonstrasi teknis beresolusi tinggi, perangkat lunak simulasi kejuruan, lembar job sheet digital, serta instrumen kuis interaktif reflektif (exit ticket digital).</p>
          </div>
        </div>

        <!-- D. PENGALAMAN BELAJAR (PEMBELAJARAN MENDALAM) -->
        <h3 class="text-base font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-2 uppercase">D. PENGALAMAN BELAJAR</h3>
        <p class="text-xs text-slate-600 mb-3 italic">Bagian ini merupakan inti pelaksanaan Pembelajaran Mendalam (Deep Learning) melalui tahapan Memahami, Mengaplikasi, dan Merefleksi.</p>

        <div class="border border-gray-300 rounded-lg overflow-hidden mb-5">
          <table class="w-full border-collapse text-xs">
            <thead class="bg-blue-900 text-white">
              <tr>
                <th class="p-2.5 text-left w-52 border-r border-blue-800">Tahap &amp; Alokasi Waktu</th>
                <th class="p-2.5 text-left">Aktivitas Guru dan Peserta Didik (Skenario Deep Learning)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <!-- 1. Pendahuluan -->
              <tr class="bg-slate-50">
                <td class="p-3 align-top font-bold text-blue-950 border-r border-gray-300">
                  1. Kegiatan Pendahuluan<br>
                  <span class="text-slate-500 font-normal text-[11px]">(15 Menit)</span>
                </td>
                <td class="p-3 space-y-1.5 leading-relaxed text-slate-800">
                  <p><strong>&bull; Guru Membuka Pembelajaran &amp; Membangun Suasana Positif:</strong> Guru menyapa peserta didik dengan salam panganjali <em>"Om Swastyastu"</em>, berdoa bersama, memeriksa kehadiran, menyanyikan yel-yel motivasi vokasi, dan memastikan workstation bersih sesuai budaya 5R.</p>
                  <p><strong>&bull; Melakukan Asesmen Awal atau Pertanyaan Pemantik:</strong> Guru menggali kesiapan belajar siswa dengan mengajukan pertanyaan pemantik kontekstual: <em>"Apa yang membedakan kualitas hasil kerja seorang teknisi amatir dengan profesional industri pada materi ${topic}?"</em></p>
                  <p><strong>&bull; Menyampaikan Tujuan &amp; Manfaat Pembelajaran:</strong> Guru memaparkan Tujuan Pembelajaran (TP) yang akan dicapai dan nilai kemanfaatannya bagi prospek karier di dunia industri DUDIKA.</p>
                  <p><strong>&bull; Membangun Kesadaran Peserta Didik (Mindfulness):</strong> Guru membimbing peserta didik membangun kesadaran tentang apa yang dipelajari dan mengapa keterampilan <strong>${topic}</strong> krusial untuk masa depan mereka.</p>
                </td>
              </tr>

              <!-- 2. Kegiatan Inti: a. Memahami -->
              <tr class="bg-white">
                <td class="p-3 align-top font-bold text-indigo-950 border-r border-gray-300 bg-indigo-50/40">
                  2. Kegiatan Inti:<br>
                  a. Memahami<br>
                  <span class="text-indigo-700 font-semibold text-[11px]">(Prinsip: Berkesadaran &amp; Bermakna)</span><br>
                  <span class="text-slate-500 font-normal text-[11px]">(40 Menit)</span>
                </td>
                <td class="p-3 space-y-1.5 leading-relaxed text-slate-800">
                  <p><strong>&bull; Mengamati &amp; Menyimak Masalah Kontekstual:</strong> Peserta didik mengamati dan menyimak tayangan demonstrasi teknis atau studi kasus kegagalan operasional materi <strong>${topic}</strong> pada mitra industri DUDIKA.</p>
                  <p><strong>&bull; Membaca &amp; Mengeksplorasi Konsep:</strong> Peserta didik membaca dan menelaah bahan ajar, modul digital, dan lembar SOP untuk mengidentifikasi komponen kunci, prosedur keselamatan K3LH, dan prinsip kerja sistem (Fokus TP 1: <em>${tp1}</em>).</p>
                  <p><strong>&bull; Membangun Pemahaman Konseptual Bermakna:</strong> Peserta didik berdiskusi aktif bersama guru mengaitkan fenomena kontekstual dengan teori kejuruan, sehingga konsep terbangun secara berkesadaran, runut, dan bermakna.</p>
                </td>
              </tr>

              <!-- 2. Kegiatan Inti: b. Mengaplikasi -->
              <tr class="bg-slate-50">
                <td class="p-3 align-top font-bold text-emerald-950 border-r border-gray-300 bg-emerald-50/40">
                  2. Kegiatan Inti:<br>
                  b. Mengaplikasi<br>
                  <span class="text-emerald-700 font-semibold text-[11px]">(Prinsip: Bermakna)</span><br>
                  <span class="text-slate-500 font-normal text-[11px]">(75 Menit)</span>
                </td>
                <td class="p-3 space-y-1.5 leading-relaxed text-slate-800">
                  <p><strong>&bull; Menerapkan Pengetahuan Melalui Praktik Nyata:</strong> Peserta didik bekerja dalam kelompok workstation/lab menggunakan LKPD Job Sheet, mengeksekusi langkah kerja teknis materi <strong>${topic}</strong> secara presisi sesuai standar operasional industri (Fokus TP 2: <em>${tp2}</em>).</p>
                  <p><strong>&bull; Eksperimen, Pengukuran Parameter &amp; Problem Solving:</strong> Peserta didik melakukan uji coba fungsional, mencatat data hasil pengukuran parameter, serta membandingkannya dengan batas toleransi baku.</p>
                  <p><strong>&bull; Mendiagnosis &amp; Troubleshooting Anomali:</strong> Saat menjumpai deviasi atau galat teknis, peserta didik menganalisis akar masalah dan menguji tindakan perbaikan (troubleshooting) secara bernalar kritis dan kolaboratif (Fokus TP 3: <em>${tp3}</em>).</p>
                  <p><strong>&bull; Diferensiasi Proses:</strong> Guru melakukan pendampingan terarah (scaffolding) bagi peserta didik yang memerlukan bimbingan ekstra, serta memberikan pengayaan bagi kelompok yang selesai lebih awal.</p>
                </td>
              </tr>

              <!-- 2. Kegiatan Inti: c. Merefleksi -->
              <tr class="bg-white">
                <td class="p-3 align-top font-bold text-amber-950 border-r border-gray-300 bg-amber-50/40">
                  2. Kegiatan Inti:<br>
                  c. Merefleksi<br>
                  <span class="text-amber-700 font-semibold text-[11px]">(Prinsip: Berkesadaran)</span><br>
                  <span class="text-slate-500 font-normal text-[11px]">(35 Menit)</span>
                </td>
                <td class="p-3 space-y-1.5 leading-relaxed text-slate-800">
                  <p><strong>&bull; Mengevaluasi Proses &amp; Hasil Belajar:</strong> Setiap kelompok mempresentasikan hasil pengerjaan proyek <strong>${topic}</strong>, mendemonstrasikan keandalan sistem, dan membandingkannya dengan standar mutu QC DUDIKA (Fokus TP 4: <em>${tp4}</em>).</p>
                  <p><strong>&bull; Mengidentifikasi Kesulitan &amp; Umpan Balik:</strong> Peserta didik bersama rekan tim saling memberikan tanggapan positif dengan nilai kearifan lokal Bali <em>"Menyama Braya"</em>, mengidentifikasi tantangan kerja, serta mengevaluasi deviasi teknis.</p>
                  <p><strong>&bull; Merencanakan Perbaikan Secara Menggembirakan:</strong> Guru mengemas refleksi pembelajaran dengan metode menyenangkan (misalnya kuis interaktif reflektif atau lembar 3-2-1 Exit Ticket), mendorong siswa merumuskan rencana tindak lanjut perbaikan secara mandiri dan optimis.</p>
                </td>
              </tr>

              <!-- 3. Penutup -->
              <tr class="bg-slate-50">
                <td class="p-3 align-top font-bold text-blue-950 border-r border-gray-300">
                  3. Kegiatan Penutup<br>
                  <span class="text-slate-500 font-normal text-[11px]">(15 Menit)</span>
                </td>
                <td class="p-3 space-y-1.5 leading-relaxed text-slate-800">
                  <p><strong>&bull; Menyimpulkan Pembelajaran Bersama:</strong> Guru bersama peserta didik merangkum simpulan kunci kompetensi materi <strong>${topic}</strong> yang telah dipelajari.</p>
                  <p><strong>&bull; Memberikan Umpan Balik &amp; Penguatan:</strong> Guru mengapresiasi kinerja tim, memberikan penguatan konsep bermakna, dan menegaskan pentingnya etos kerja profesional.</p>
                  <p><strong>&bull; Menyampaikan Tindak Lanjut atau Tugas:</strong> Menginformasikan materi/proyek Teaching Factory (TEFA) pada sesi berikutnya serta tugas portofolio mandiri jika diperlukan.</p>
                  <p><strong>&bull; Menutup Pembelajaran:</strong> Melakukan perapian peralatan dan area kerja (5R), doa syukur bersama, serta salam penutup <em>"Parama Santih: Om Santih, Santih, Santih Om"</em>.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- E. ASESMEN PEMBELAJARAN -->
        <h3 class="text-base font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-3 uppercase">E. ASESMEN PEMBELAJARAN</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-4">
          <div class="border border-blue-200 bg-blue-50/50 p-3 rounded-lg">
            <h4 class="font-bold text-blue-900 mb-1 uppercase tracking-wide">1. Asesmen Awal (Diagnostik)</h4>
            <p class="text-slate-700">Untuk mengetahui kesiapan dan pengetahuan awal peserta didik melalui kuis lisan prasyarat dan asesmen non-kognitif kesiapan belajar materi ${topic}.</p>
          </div>
          <div class="border border-emerald-200 bg-emerald-50/50 p-3 rounded-lg">
            <h4 class="font-bold text-emerald-900 mb-1 uppercase tracking-wide">2. Asesmen Proses (Formatif)</h4>
            <p class="text-slate-700">Untuk memantau perkembangan belajar melalui observasi unjuk kerja praktik (Job Sheet LKPD), keaktifan diskusi, pemecahan masalah, dan kepatuhan K3LH.</p>
          </div>
          <div class="border border-purple-200 bg-purple-50/50 p-3 rounded-lg">
            <h4 class="font-bold text-purple-900 mb-1 uppercase tracking-wide">3. Asesmen Akhir (Sumatif)</h4>
            <p class="text-slate-700">Untuk menilai ketercapaian tujuan pembelajaran melalui uji tulis terstandar (10 butir soal PG + HOTS), presentasi laporan, dan penilaian produk hasil kerja ${topic}.</p>
          </div>
        </div>

        <div class="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 mb-5 leading-relaxed">
          <h4 class="font-bold text-blue-900 mb-1 uppercase tracking-wide">4. Instrumen dan Kriteria Ketercapaian</h4>
          <p><strong>&bull; Kriteria Ketercapaian Tujuan Pembelajaran (KKTP):</strong> Skor ketuntasan minimum adalah <strong>75</strong>. Peserta didik dengan nilai &lt; 75 wajib mengikuti bimbingan remedial.</p>
          <p><strong>&bull; Kelengkapan Instrumen Terlampir:</strong> Naskah 10 butir soal terstandar, kunci jawaban dan pembahasan lengkap, lembar observasi proses unjuk kerja, rubrik penilaian analitik skala 1-4 per butir TP, dan pedoman penskoran.</p>
        </div>

        <!-- F. TINDAK LANJUT DAN LAMPIRAN -->
        <h3 class="text-base font-bold text-blue-900 border-b-2 border-blue-900 pb-1 mb-3 uppercase">F. TINDAK LANJUT DAN LAMPIRAN</h3>
        
        <div class="space-y-2 text-xs text-slate-800 leading-relaxed mb-4">
          <div class="p-2.5 border-l-4 border-emerald-600 bg-emerald-50/40 rounded-r">
            <strong>&bull; Pengayaan:</strong> Diberikan kepada peserta didik yang telah mencapai tujuan pembelajaran (&ge; 75) berupa penugasan proyek tingkat lanjut Teaching Factory (TEFA) materi <em>${topic}</em> dan peran sebagai tutor sebaya bagi rekannya.
          </div>
          <div class="p-2.5 border-l-4 border-red-600 bg-red-50/40 rounded-r">
            <strong>&bull; Remedial:</strong> Diberikan pendampingan intensif bagi peserta didik yang belum tuntas (&lt; 75) melalui bimbingan individual, pengulangan langkah kerja teknis yang belum dikuasai, dan tes ulang pada TP terkait.
          </div>
          <div class="p-2.5 border-l-4 border-blue-600 bg-blue-50/40 rounded-r">
            <strong>&bull; Lembar Kerja Peserta Didik (LKPD):</strong> Job Sheet Praktik Kejuruan materi <em>${topic}</em> memuat panduan keselamatan K3LH, langkah kerja, tabel parameter pengamatan, dan studi kasus (tersedia pada dokumen LKPD).
          </div>
          <div class="p-2.5 border-l-4 border-indigo-600 bg-indigo-50/40 rounded-r">
            <strong>&bull; Bahan Bacaan dan Media Pembelajaran:</strong> Modul teori ajar vokasi terpadu, lembar spesifikasi alat DUDIKA, video demonstrasi teknis, dan slide deck interaktif (tersedia pada dokumen Bahan Ajar &amp; Media).
          </div>
          <div class="p-2.5 border-l-4 border-purple-600 bg-purple-50/40 rounded-r">
            <strong>&bull; Rubrik Penilaian:</strong> Rubrik penilaian analitik komprehensif mengukur dimensi sikap Profil Lulusan, pengetahuan, dan keterampilan proses unjuk kerja (tersedia pada dokumen Rubrik Penilaian).
          </div>
          <div class="p-2.5 border-l-4 border-amber-600 bg-amber-50/40 rounded-r">
            <strong>&bull; Lembar Refleksi Guru dan Peserta Didik:</strong> Instrumen refleksi berkala (lembar 3-2-1 Exit Ticket untuk siswa dan format evaluasi keterlaksanaan RPP oleh guru).
          </div>
          <div class="p-2.5 border-l-4 border-slate-600 bg-slate-100 rounded-r">
            <strong>&bull; Referensi Pembelajaran:</strong> Buku Teks Kejuruan Kemendikbudristek Kurikulum Merdeka, Standar Kompetensi Kerja Nasional Indonesia (SKKNI), Pedoman Pembelajaran Mendalam (Deep Learning), dan Standard Operating Procedure (SOP) Industri DUDIKA Mitra SMK Negeri 1 Bebandem.
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-300">
          <h4 class="font-bold text-blue-900 text-xs mb-2 uppercase tracking-wide">Ringkasan Struktur Modul Ajar Pembelajaran Mendalam (Deep Learning):</h4>
          <table class="w-full border-collapse border border-gray-400 text-xs bg-white mb-2">
            <thead class="bg-blue-900 text-white">
              <tr>
                <th class="border border-gray-400 p-2 text-center w-16">Bagian</th>
                <th class="border border-gray-400 p-2 text-left">Komponen Utama</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="border border-gray-400 p-2 text-center font-bold text-blue-950">A</td><td class="border border-gray-400 p-2 font-medium">Identitas modul</td></tr>
              <tr><td class="border border-gray-400 p-2 text-center font-bold text-blue-950">B</td><td class="border border-gray-400 p-2 font-medium">Identifikasi (Peserta didik, materi pembelajaran, dimensi profil lulusan)</td></tr>
              <tr><td class="border border-gray-400 p-2 text-center font-bold text-blue-950">C</td><td class="border border-gray-400 p-2 font-medium">Desain pembelajaran (CP, lintas disiplin, TP, topik, praktik pedagogis, kemitraan, lingkungan, digital)</td></tr>
              <tr><td class="border border-gray-400 p-2 text-center font-bold text-blue-950">D</td><td class="border border-gray-400 p-2 font-medium">Pengalaman belajar: memahami, mengaplikasi, merefleksi</td></tr>
              <tr><td class="border border-gray-400 p-2 text-center font-bold text-blue-950">E</td><td class="border border-gray-400 p-2 font-medium">Asesmen pembelajaran (awal, proses, akhir, instrumen &amp; kriteria KKTP)</td></tr>
              <tr><td class="border border-gray-400 p-2 text-center font-bold text-blue-950">F</td><td class="border border-gray-400 p-2 font-medium">Tindak lanjut dan lampiran (pengayaan, remedial, LKPD, bahan bacaan, rubrik, refleksi, referensi)</td></tr>
            </tbody>
          </table>
        </div>
      `;

    case 'bahan_ajar':
      return `
        ${headersInfo}
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-blue-900 uppercase">BAHAN AJAR DAN MODUL TEORI PEMBELAJARAN</h2>
          <p class="font-semibold text-gray-700">Topik Utama: ${topic} &bull; Program Keahlian: ${vocation}</p>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
          <h4 class="font-bold text-blue-950 text-sm uppercase tracking-wide mb-1">PETA KONSEP PEMBELAJARAN: ${topic}</h4>
          <p class="text-xs text-slate-700 mb-2">Materi ini terstruktur menjadi 4 tahapan berurutan sesuai Tujuan Pembelajaran:</p>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
            <div class="bg-white p-2.5 rounded border border-blue-200 shadow-sm">
              <span class="font-bold text-blue-800 block mb-1">Tahap 1 (Konsep & Dasar)</span>
              <span>${tp1}</span>
            </div>
            <div class="bg-white p-2.5 rounded border border-blue-200 shadow-sm">
              <span class="font-bold text-blue-800 block mb-1">Tahap 2 (Implementasi SOP)</span>
              <span>${tp2}</span>
            </div>
            <div class="bg-white p-2.5 rounded border border-blue-200 shadow-sm">
              <span class="font-bold text-blue-800 block mb-1">Tahap 3 (Troubleshooting)</span>
              <span>${tp3}</span>
            </div>
            <div class="bg-white p-2.5 rounded border border-blue-200 shadow-sm">
              <span class="font-bold text-blue-800 block mb-1">Tahap 4 (Kendali Mutu)</span>
              <span>${tp4}</span>
            </div>
          </div>
        </div>

        <h3 class="font-bold text-blue-900 text-base mt-6 mb-2 border-b border-blue-200 pb-1">1. Uraian Teori Esensial: ${topic}</h3>
        <p class="text-sm text-justify text-slate-800 leading-relaxed mb-3">
          Dalam konteks kejuruan <strong>${vocation}</strong>, penguasaan <strong>${topic}</strong> merupakan kompetensi inti yang sangat dicari oleh dunia industri. Peserta didik dituntut tidak hanya menguasai prinsip teoritis, melainkan mampu mengaplikasikannya secara terstandar sesuai regulasi teknis.
        </p>
        <p class="text-sm text-justify text-slate-800 leading-relaxed mb-4">
          <strong>Fokus Tujuan Pembelajaran 1:</strong> ${tp1}. Pemahaman mendalam ini mencakup struktur dasar, definisi operasional, dan kepatuhan standar keselamatan kerja (K3LH) sebelum eksekusi teknis dimulai.
        </p>

        <h3 class="font-bold text-blue-900 text-base mt-6 mb-2 border-b border-blue-200 pb-1">2. Standar Operasional Prosedur (SOP) & Eksekusi Praktik</h3>
        <p class="text-sm text-justify text-slate-800 leading-relaxed mb-3">
          <strong>Fokus Tujuan Pembelajaran 2:</strong> ${tp2}. Eksekusi kerja pada materi <strong>${topic}</strong> harus mengikuti langkah-langkah kerja sistematis:
        </p>
        <ol class="list-decimal pl-6 text-sm text-slate-800 space-y-1.5 mb-4">
          <li><strong>Persiapan Peralatan & Media:</strong> Memeriksa kesiapan instrumen, kelengkapan software/hardware/bahan, dan penataan area kerja yang resik.</li>
          <li><strong>Konfigurasi & Pengaturan Parameter:</strong> Menyetel parameter teknis <em>${topic}</em> sesuai batas spesifikasi acuan lembar kerja.</li>
          <li><strong>Eksekusi Operasional Terpadu:</strong> Menjalankan proses pengerjaan inti secara cermat, meminimalkan deviasi toleransi.</li>
          <li><strong>Verifikasi Fungsional:</strong> Menguji apakah hasil kerja <em>${topic}</em> telah memenuhi fungsi operasional yang ditargetkan.</li>
        </ol>

        <h3 class="font-bold text-blue-900 text-base mt-6 mb-2 border-b border-blue-200 pb-1">3. Diagnosis Masalah & Troubleshooting (Fokus TP: ${tp3})</h3>
        <p class="text-sm text-justify text-slate-800 leading-relaxed mb-3">
          Dalam implementasi nyata di lapangan, teknisi sering menghadapi deviasi atau kegagalan sistem. Pendekatan troubleshooting pada materi <strong>${topic}</strong> dilakukan dengan metode <em>Root-Cause Analysis</em>:
        </p>
        <div class="bg-amber-50 border border-amber-300 p-3.5 rounded-lg text-xs text-amber-950 mb-4 space-y-1">
          <p><strong>&bull; Gejala Anomali:</strong> Terjadi deviasi pengukuran atau kegagalan fungsi operasional pada unit <em>${topic}</em>.</p>
          <p><strong>&bull; Langkah Isolasi:</strong> Memeriksa konektivitas, memvalidasi input parameter, dan menguji komponen secara parsial.</p>
          <p><strong>&bull; Tindakan Solutif:</strong> Melakukan re-kalibrasi, perbaikan kode/rangkaian, serta pengujian ulang verifikasi kestabilan.</p>
        </div>

        <h3 class="font-bold text-blue-900 text-base mt-6 mb-2 border-b border-blue-200 pb-1">4. Penerapan di Dunia Usaha / Industri (DUDIKA) & Budaya Kerja Bali</h3>
        <p class="text-sm text-justify text-slate-800 leading-relaxed mb-3">
          <strong>Fokus Tujuan Pembelajaran 4:</strong> ${tp4}. Mitra industri SMK Negeri 1 Bebandem menerapkan standar kendali mutu ketat (<em>Quality Assurance</em>). Hasil pengerjaan <strong>${topic}</strong> harus lolos uji fungsional 100%. Di samping keterampilan teknis, peserta didik menginternalisasi nilai kearifan lokal Bali <em>"Tri Hita Karana"</em> (keharmonisan antar manusia/rekan kerja dan pemeliharaan kebersihan lingkungan kerja).
        </p>
      `;

    case 'lkpd':
      return `
        ${headersInfo}
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-blue-950 uppercase">LEMBAR KERJA PESERTA DIDIK (LKPD)</h2>
          <p class="font-semibold text-gray-700 text-sm">JOB SHEET PRAKTIK KEJURUAN: ${topic}</p>
        </div>

        <div class="border border-slate-300 p-3.5 mb-4 bg-slate-50 rounded-lg text-xs space-y-1">
          <div class="grid grid-cols-2 gap-4">
            <div><p><strong>Nama Kelompok / Workstation:</strong> ____________________________________</p></div>
            <div><p><strong>Kelas / Program Keahlian:</strong> ${grade} / ${vocation}</p></div>
          </div>
          <p><strong>Nama Anggota Tim:</strong> 1. ___________________ 2. ___________________ 3. ___________________ 4. ___________________</p>
        </div>

        <h3 class="font-bold text-blue-900 text-sm mb-1 uppercase tracking-wider">A. Tujuan Praktikum</h3>
        <p class="text-xs text-slate-700 mb-2">Setelah menyelesaikan praktikum ini, peserta didik mampu secara mandiri dan berkolaborasi:</p>
        <ul class="list-disc pl-6 text-xs text-slate-800 space-y-1 mb-4">
          ${parsedTps.map((t) => `<li>${t}</li>`).join('')}
        </ul>

        <h3 class="font-bold text-blue-900 text-sm mb-1 uppercase tracking-wider">B. Alat, Bahan & Standar K3LH</h3>
        <ul class="list-disc pl-6 text-xs text-slate-700 space-y-1 mb-4">
          <li>Perangkat Lab/Workstation SMK Negeri 1 Bebandem yang telah terverifikasi laik pakai.</li>
          <li>Software / Tools pengembang / Manual Book instrumen terkait <strong>${topic}</strong>.</li>
          <li>APD wajib: Wearpack / Pakaian Praktik Lab, ID Card, dan alat keselamatan kerja sesuai SOP.</li>
        </ul>

        <h3 class="font-bold text-blue-900 text-sm mb-1 uppercase tracking-wider">C. Langkah Kerja Praktik Terpadu (SOP: ${topic})</h3>
        <ol class="list-decimal pl-6 text-xs text-slate-800 space-y-1.5 mb-4">
          <li>Lakukan pemeriksaan awal (inspeksi visual) terhadap seluruh instrumen kerja materi <strong>${topic}</strong>.</li>
          <li>Konfigurasikan lingkungan kerja dan tetapkan parameter acuan sesuai petunjuk guru pembimbing.</li>
          <li>Eksekusi langkah kerja teknis untuk merealisasikan tujuan: <em>${tp2}</em>.</li>
          <li>Lakukan pengujian hasil kerja, catat data parameter uji pada tabel pengamatan di bawah ini.</li>
          <li>Jika menemukan kendala atau anomali teknis (troubleshoot), lakukan diagnosis mandiri sesuai prinsip: <em>${tp3}</em>.</li>
          <li>Rapikan kembali seluruh peralatan kerja sesuai budaya 5R (Ringkas, Rapi, Resik, Rawat, Rajin).</li>
        </ol>

        <h3 class="font-bold text-blue-900 text-sm mb-1 uppercase tracking-wider">D. Tabel Data Pengamatan & Pengujian Parameter Kerja</h3>
        <table class="w-full border-collapse border border-gray-400 text-xs mb-4">
          <thead class="bg-blue-900 text-white">
            <tr>
              <th class="border border-gray-400 p-2 w-10 text-center">No</th>
              <th class="border border-gray-400 p-2 text-left">Parameter Pengujian (${topic})</th>
              <th class="border border-gray-400 p-2 text-left">Standar Spesifikasi Acuan</th>
              <th class="border border-gray-400 p-2 text-left w-36">Hasil Pengamatan Siswa</th>
              <th class="border border-gray-400 p-2 text-center w-24">Status Mutu</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">1</td>
              <td class="border border-gray-400 p-2 font-medium">Kesiapan Infrastruktur & Prosedur Awal (${tp1.slice(0, 40)}...)</td>
              <td class="border border-gray-400 p-2 text-slate-600">Lengkap, aman & sesuai SOP K3LH</td>
              <td class="border border-gray-400 p-2 text-slate-400 italic">[Isi catatan observasi]</td>
              <td class="border border-gray-400 p-2 text-center text-slate-400">&square; OK &nbsp; &square; Deviasi</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">2</td>
              <td class="border border-gray-400 p-2 font-medium">Eksekusi Fungsional Teknis Inti (${tp2.slice(0, 40)}...)</td>
              <td class="border border-gray-400 p-2 text-slate-600">Berjalan lancar, toleransi &plusmn;5%</td>
              <td class="border border-gray-400 p-2 text-slate-400 italic">[Isi data hasil uji]</td>
              <td class="border border-gray-400 p-2 text-center text-slate-400">&square; OK &nbsp; &square; Deviasi</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">3</td>
              <td class="border border-gray-400 p-2 font-medium">Ketahanan Beban & Penanganan Kendala (${tp3.slice(0, 40)}...)</td>
              <td class="border border-gray-400 p-2 text-slate-600">Tidak ada kegagalan / galat tertangani</td>
              <td class="border border-gray-400 p-2 text-slate-400 italic">[Isi catatan troubleshooting]</td>
              <td class="border border-gray-400 p-2 text-center text-slate-400">&square; OK &nbsp; &square; Deviasi</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">4</td>
              <td class="border border-gray-400 p-2 font-medium">Mutu Akhir & Kerapian Output (${tp4.slice(0, 40)}...)</td>
              <td class="border border-gray-400 p-2 text-slate-600">Memenuhi standar industri DUDIKA</td>
              <td class="border border-gray-400 p-2 text-slate-400 italic">[Isi penilaian portofolio]</td>
              <td class="border border-gray-400 p-2 text-center text-slate-400">&square; OK &nbsp; &square; Deviasi</td>
            </tr>
          </tbody>
        </table>

        <h3 class="font-bold text-blue-900 text-sm mb-1 uppercase tracking-wider">E. Pertanyaan Analisis & Refleksi Siswa</h3>
        <p class="text-xs text-slate-700 mb-2">Berdasarkan praktik materi <strong>${topic}</strong> yang Anda selesaikan:</p>
        <div class="border border-slate-300 p-3 rounded-lg text-xs text-slate-600 bg-white space-y-2 mb-2">
          <p>1. Apa saja kendala teknis yang tim Anda jumpai saat menerapkan <em>${tp2}</em> dan bagaimana solusi perbaikannya?</p>
          <div class="h-10 border-b border-dashed border-slate-300"></div>
          <p>2. Jelaskan kaitan antara kepatuhan standar mutu <strong>${topic}</strong> dengan tuntutan profesionalitas industri DUDIKA saat ini!</p>
          <div class="h-10 border-b border-dashed border-slate-300"></div>
        </div>
      `;

    case 'media_pembelajaran':
      return `
        ${headersInfo}
        <h2 class="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-4">RANCANGAN MEDIA PEMBELAJARAN INTERAKTIF</h2>
        <p><strong>Judul Media:</strong> Slide Deck Interaktif & Storyboard Digital: <em>${topic}</em></p>
        <p><strong>Program Keahlian:</strong> ${vocation} &bull; <strong>Sasaran:</strong> Kelas ${grade}</p>
        <p><strong>Fokus Tujuan Pembelajaran:</strong> Menuntaskan ${parsedTps.length} TP yang telah dirumuskan secara visual dan interaktif.</p>

        <div class="space-y-4 mt-5">
          <div class="border border-blue-200 p-4 rounded-xl bg-blue-50/70">
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-bold text-blue-900 text-sm">Slide 1: Pengenalan & Urgensi Materi di Industri</h4>
              <span class="text-xs font-semibold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">Pengantar</span>
            </div>
            <p class="text-xs text-slate-700 mb-1"><strong>Visual:</strong> Logo SMK Negeri 1 Bebandem, ilustrasi penerapan riil materi <em>"${topic}"</em> pada mitra industri DUDIKA modern.</p>
            <p class="text-xs text-slate-700"><strong>Narasi Instruktur:</strong> Menjelaskan relevansi materi terhadap karir masa depan teknisi vokasi dan menyampaikan target pembelajaran.</p>
          </div>

          <div class="border border-blue-200 p-4 rounded-xl bg-white shadow-sm">
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-bold text-blue-900 text-sm">Slide 2: Pembedahan Konsep Inti (Fokus TP 1)</h4>
              <span class="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">TP 1: ${tp1.slice(0, 24)}...</span>
            </div>
            <p class="text-xs text-slate-700 mb-1"><strong>Visual:</strong> Diagram alur arsitektur, peta konsep, dan infografis interaktif mengenai <em>${topic}</em>.</p>
            <p class="text-xs text-slate-700"><strong>Narasi Instruktur:</strong> Menekankan aspek pemahaman mendalam: <em>${tp1}</em>.</p>
          </div>

          <div class="border border-blue-200 p-4 rounded-xl bg-white shadow-sm">
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-bold text-blue-900 text-sm">Slide 3: Video Demonstrasi Prosedur Kerja SOP (Fokus TP 2)</h4>
              <span class="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">TP 2: ${tp2.slice(0, 24)}...</span>
            </div>
            <p class="text-xs text-slate-700 mb-1"><strong>Visual:</strong> Video demonstrasi teknis step-by-step dari workstation instruktur, menampilkan parameter operasional <em>${topic}</em> yang presisi.</p>
            <p class="text-xs text-slate-700"><strong>Narasi Instruktur:</strong> Memandu peserta didik mengeksekusi job sheet praktik sesuai SOP K3LH: <em>${tp2}</em>.</p>
          </div>

          <div class="border border-blue-200 p-4 rounded-xl bg-white shadow-sm">
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-bold text-blue-900 text-sm">Slide 4: Studi Kasus Troubleshooting & Anomali (Fokus TP 3)</h4>
              <span class="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">TP 3: ${tp3.slice(0, 24)}...</span>
            </div>
            <p class="text-xs text-slate-700 mb-1"><strong>Visual:</strong> Cuplikan studi kasus deviasi pengukuran atau kegagalan sistem pada proyek <em>${topic}</em>.</p>
            <p class="text-xs text-slate-700"><strong>Narasi Instruktur:</strong> Mengajak siswa bernalar kritis melakukan isolasi masalah dan perbaikan: <em>${tp3}</em>.</p>
          </div>

          <div class="border border-blue-200 p-4 rounded-xl bg-white shadow-sm">
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-bold text-blue-900 text-sm">Slide 5: Evaluasi Mutu & Refleksi Nilai Vokasi (Fokus TP 4)</h4>
              <span class="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">TP 4: ${tp4.slice(0, 24)}...</span>
            </div>
            <p class="text-xs text-slate-700 mb-1"><strong>Visual:</strong> Rubrik penilaian mutu portofolio dan kutipan kearifan lokal Bali <em>"Menyama Braya"</em> dalam kerja tim.</p>
            <p class="text-xs text-slate-700"><strong>Narasi Instruktur:</strong> Menyimpulkan capaian peserta didik pada materi <strong>${topic}</strong> dan memberikan kuis penguatan (exit ticket).</p>
          </div>
        </div>
      `;

    case 'kisi_kisi':
      return `
        ${headersInfo}
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-blue-950 uppercase">KISI-KISI PENULISAN SOAL ASESMEN LINGKUP MATERI</h2>
          <p class="font-semibold text-slate-700 text-sm">10 Butir Soal Terstandar &bull; Topik: ${topic} &bull; Fase ${phase}</p>
        </div>

        <div class="bg-blue-50 border-l-4 border-blue-700 p-3.5 mb-4 text-xs rounded-r-lg">
          <p class="font-bold text-blue-950 uppercase tracking-wide">Rujukan Capaian Pembelajaran (CP) Elemen:</p>
          <p class="text-slate-700 italic mt-0.5 mb-2">${cp}</p>
          <p class="font-bold text-blue-950 uppercase tracking-wide">Dekonstruksi Tujuan Pembelajaran (TP) yang Diukur:</p>
          <div class="text-slate-800 whitespace-pre-line mt-0.5 font-medium">${formattedTpList}</div>
        </div>

        <p class="text-xs text-slate-700 mb-3">
          Kisi-kisi penulisan soal ini memetakan secara presisi setiap butir Tujuan Pembelajaran (TP) yang diturunkan dari CP pada materi <strong>"${topic}"</strong> dengan indikator soal, level kognitif Taksonomi Bloom (C1-C6), bentuk soal, dan bobot penilaian (Total = 100):
        </p>

        <table class="min-w-full border-collapse border border-gray-400 text-xs my-4 leading-normal">
          <thead class="bg-blue-900 text-white">
            <tr>
              <th class="border border-gray-400 p-2 w-10 text-center">No</th>
              <th class="border border-gray-400 p-2 text-left w-36">Klausul CP & Elemen</th>
              <th class="border border-gray-400 p-2 text-left">Tujuan Pembelajaran (TP)</th>
              <th class="border border-gray-400 p-2 text-left w-32">Materi Pokok</th>
              <th class="border border-gray-400 p-2 text-left">Indikator Butir Soal Spesifik</th>
              <th class="border border-gray-400 p-2 w-16 text-center">Level Bloom</th>
              <th class="border border-gray-400 p-2 w-20 text-center">Bentuk Soal</th>
              <th class="border border-gray-400 p-2 w-14 text-center">Bobot</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">1</td>
              <td class="border border-gray-400 p-2 text-[11px] text-blue-950 font-semibold bg-blue-50/50">Klausul 1: Konsep & K3LH</td>
              <td class="border border-gray-400 p-2 font-medium">${tp1}</td>
              <td class="border border-gray-400 p-2 text-slate-700">Prinsip & Regulasi ${topic}</td>
              <td class="border border-gray-400 p-2">Peserta didik dapat mengidentifikasi prosedur keselamatan kerja (K3LH) dan konsep esensial pada ${topic}.</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-blue-800">C2</td>
              <td class="border border-gray-400 p-2 text-center">PG (A-E)</td>
              <td class="border border-gray-400 p-2 text-center font-bold">8</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">2</td>
              <td class="border border-gray-400 p-2 text-[11px] text-blue-950 font-semibold bg-blue-50/50">Klausul 1: Arsitektur Sistem</td>
              <td class="border border-gray-400 p-2 font-medium">${tp1}</td>
              <td class="border border-gray-400 p-2 text-slate-700">Komponen Dasar ${topic}</td>
              <td class="border border-gray-400 p-2">Peserta didik dapat menjelaskan fungsi arsitektur atau komponen pembentuk ${topic} secara tepat.</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-blue-800">C2</td>
              <td class="border border-gray-400 p-2 text-center">PG (A-E)</td>
              <td class="border border-gray-400 p-2 text-center font-bold">8</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">3</td>
              <td class="border border-gray-400 p-2 text-[11px] text-blue-950 font-semibold bg-blue-50/50">Klausul 2: Implementasi SOP</td>
              <td class="border border-gray-400 p-2 font-medium">${tp2}</td>
              <td class="border border-gray-400 p-2 text-slate-700">SOP Operasional ${topic}</td>
              <td class="border border-gray-400 p-2">Disajikan alur pengerjaan, peserta didik dapat menentukan urutan kerja teknis ${topic} sesuai SOP industri.</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-emerald-800">C3</td>
              <td class="border border-gray-400 p-2 text-center">PG (A-E)</td>
              <td class="border border-gray-400 p-2 text-center font-bold">10</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">4</td>
              <td class="border border-gray-400 p-2 text-[11px] text-blue-950 font-semibold bg-blue-50/50">Klausul 2: Parameter Teknis</td>
              <td class="border border-gray-400 p-2 font-medium">${tp2}</td>
              <td class="border border-gray-400 p-2 text-slate-700">Pengukuran & Toleransi</td>
              <td class="border border-gray-400 p-2">Peserta didik dapat menerapkan batas toleransi dan parameter pengukuran pada pengoperasian ${topic}.</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-emerald-800">C3</td>
              <td class="border border-gray-400 p-2 text-center">PG (A-E)</td>
              <td class="border border-gray-400 p-2 text-center font-bold">10</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">5</td>
              <td class="border border-gray-400 p-2 text-[11px] text-blue-950 font-semibold bg-blue-50/50">Klausul 3: Diagnosis Anomali</td>
              <td class="border border-gray-400 p-2 font-medium">${tp3}</td>
              <td class="border border-gray-400 p-2 text-slate-700">Analisis Deviasi ${topic}</td>
              <td class="border border-gray-400 p-2">Disajikan tabel data anomali, peserta didik mampu mendeteksi penyebab penyimpangan kinerja ${topic}.</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-purple-800">C4</td>
              <td class="border border-gray-400 p-2 text-center">PG (A-E)</td>
              <td class="border border-gray-400 p-2 text-center font-bold">10</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">6</td>
              <td class="border border-gray-400 p-2 text-[11px] text-blue-950 font-semibold bg-blue-50/50">Klausul 3: Troubleshooting</td>
              <td class="border border-gray-400 p-2 font-medium">${tp3}</td>
              <td class="border border-gray-400 p-2 text-slate-700">Troubleshooting Sistem</td>
              <td class="border border-gray-400 p-2">Peserta didik dapat menentukan langkah isolasi perbaikan tercepat terhadap gangguan teknis ${topic}.</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-purple-800">C4</td>
              <td class="border border-gray-400 p-2 text-center">PG (A-E)</td>
              <td class="border border-gray-400 p-2 text-center font-bold">10</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">7</td>
              <td class="border border-gray-400 p-2 text-[11px] text-blue-950 font-semibold bg-blue-50/50">Klausul 4: Etika Vokasi Bali</td>
              <td class="border border-gray-400 p-2 font-medium">${tp4}</td>
              <td class="border border-gray-400 p-2 text-slate-700">Etika Profesi & Bali</td>
              <td class="border border-gray-400 p-2">Peserta didik dapat mengintegrasikan nilai kolaborasi "Menyama Braya" dan etos kerja industri dalam proyek ${topic}.</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-emerald-800">C3</td>
              <td class="border border-gray-400 p-2 text-center">PG (A-E)</td>
              <td class="border border-gray-400 p-2 text-center font-bold">8</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">8</td>
              <td class="border border-gray-400 p-2 text-[11px] text-blue-950 font-semibold bg-blue-50/50">Klausul 4: Standar QC Industri</td>
              <td class="border border-gray-400 p-2 font-medium">${tp4}</td>
              <td class="border border-gray-400 p-2 text-slate-700">Standar Mutu (QC) DUDIKA</td>
              <td class="border border-gray-400 p-2">Peserta didik mampu mengevaluasi kelaikan mutu produk/output ${topic} sebelum serah terima konsumen.</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-purple-800">C5</td>
              <td class="border border-gray-400 p-2 text-center">PG (A-E)</td>
              <td class="border border-gray-400 p-2 text-center font-bold">10</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">9</td>
              <td class="border border-gray-400 p-2 text-[11px] text-blue-950 font-semibold bg-blue-50/50">Multi-Klausul: Integrasi CP</td>
              <td class="border border-gray-400 p-2 font-medium">${tp3} & ${tp4}</td>
              <td class="border border-gray-400 p-2 text-slate-700">Kasus Kompleks ${topic}</td>
              <td class="border border-gray-400 p-2">Disajikan kasus multi-faktor, peserta didik dapat menyeleksi kombinasi hipotesis teknis kegagalan sistem ${topic}.</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-red-800">C5 (HOTS)</td>
              <td class="border border-gray-400 p-2 text-center">PG Kompleks</td>
              <td class="border border-gray-400 p-2 text-center font-bold">12</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">10</td>
              <td class="border border-gray-400 p-2 text-[11px] text-blue-950 font-semibold bg-blue-50/50">Sintesis Penuh Elemen CP</td>
              <td class="border border-gray-400 p-2 font-medium">${tp2}, ${tp3}, ${tp4}</td>
              <td class="border border-gray-400 p-2 text-slate-700">Desain Solusi & SOP</td>
              <td class="border border-gray-400 p-2">Peserta didik mampu merumuskan SOP pencegahan preventif dan diagram alur perbaikan komprehensif pada ${topic}.</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-red-800">C6 (HOTS)</td>
              <td class="border border-gray-400 p-2 text-center">Uraian Kasus</td>
              <td class="border border-gray-400 p-2 text-center font-bold">14</td>
            </tr>
          </tbody>
          <tfoot class="bg-slate-100 font-bold">
            <tr>
              <td colspan="7" class="border border-gray-400 p-2 text-right">TOTAL BOBOT SKOR MAKSIMAL:</td>
              <td class="border border-gray-400 p-2 text-center text-blue-900 font-extrabold">100</td>
            </tr>
          </tfoot>
        </table>
      `;

    case 'naskah_soal':
      return `
        ${headersInfo}
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold uppercase text-blue-950 tracking-wide">NASKAH SOAL EVALUASI PEMBELAJARAN (10 BUTIR SOAL)</h2>
          <p class="text-xs text-slate-600 font-medium">Mata Pelajaran: ${subject} &bull; Materi Pokok: <strong>${topic}</strong> &bull; Kelas: ${grade}</p>
          <p class="text-[11px] text-slate-500 italic mt-0.5">Petunjuk: Pilihlah jawaban yang paling tepat (A, B, C, D, atau E) pada lembar jawaban yang tersedia.</p>
        </div>

        <div class="bg-blue-50 border-l-4 border-blue-700 p-3.5 mb-5 text-xs rounded-r-lg">
          <p class="font-bold text-blue-950 uppercase tracking-wide">Rujukan Capaian Pembelajaran (CP) Elemen Terkait:</p>
          <p class="text-slate-700 italic mt-0.5 mb-1.5">${cp}</p>
          <p class="font-bold text-blue-950 uppercase tracking-wide">Penyelarasan Butir Soal dengan Tujuan Pembelajaran (TP):</p>
          <div class="text-slate-800 whitespace-pre-line mt-0.5 font-medium">${formattedTpList}</div>
        </div>

        <div class="space-y-5 text-sm leading-relaxed">
          <!-- Soal 1 -->
          <div class="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
            <p class="font-semibold text-slate-900">1. [Menguji CP Klausul 1 & TP 1: ${tp1.slice(0, 48)}...] (Level C2 - Konsep & K3LH)<br>
            Sebelum memulai aktivitas teknis pada materi <strong>${topic}</strong> di bengkel/lab SMK Negeri 1 Bebandem, tindakan keselamatan kerja (K3LH) dan verifikasi awal yang wajib dilakukan oleh seorang teknisi adalah...</p>
            <div class="pl-4 text-xs space-y-1.5 mt-2 text-slate-800">
              <div>A. Mengoperasikan seluruh unit pada kapasitas maksimum tanpa membaca petunjuk pengoperasian.</div>
              <div>B. Melakukan inspeksi visual kelayakan sarana kerja, memeriksa grounding/konektivitas, dan mengenakan APD lengkap sesuai SOP.</div>
              <div>C. Mengubah pengaturan parameter bawaan pabrik sebelum memeriksa kondisi fisik perangkat.</div>
              <div>D. Memulai pekerjaan kelompok tanpa koordinasi dan mengabaikan pembagian tugas antar teknisi.</div>
              <div>E. Meninggalkan sampah sisa material praktikum di area kerja demi efisiensi waktu.</div>
            </div>
          </div>

          <!-- Soal 2 -->
          <div class="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
            <p class="font-semibold text-slate-900">2. [Menguji CP Klausul 1 & TP 1: ${tp1.slice(0, 48)}...] (Level C2 - Arsitektur & Logika Sistem)<br>
            Dalam arsitektur dan prinsip kerja materi <strong>${topic}</strong>, fungsi dari komponen inti atau variabel utama sistem adalah...</p>
            <div class="pl-4 text-xs space-y-1.5 mt-2 text-slate-800">
              <div>A. Menghilangkan data input secara acak untuk menghemat kapasitas media penyimpanan.</div>
              <div>B. Menjadi pengatur alur kerja logika, menerima input, serta memproses keluaran sesuai spesifikasi yang telah ditetapkan.</div>
              <div>C. Mengabaikan penanganan kesalahan (error handling) agar eksekusi sistem berjalan lebih cepat.</div>
              <div>D. Membatasi komunikasi antar modul agar sistem tidak dapat diintegrasikan dengan aplikasi lain.</div>
              <div>E. Menghentikan seluruh proses kerja ketika beban kerja berada pada batas minimum.</div>
            </div>
          </div>

          <!-- Soal 3 -->
          <div class="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
            <p class="font-semibold text-slate-900">3. [Menguji CP Klausul 2 & TP 2: ${tp2.slice(0, 48)}...] (Level C3 - Prosedur SOP & Alur Kerja)<br>
            Berdasarkan Standard Operating Procedure (SOP) pengerjaan materi <strong>${topic}</strong>, urutan langkah kerja teknis yang paling tepat dan aman adalah...</p>
            <div class="pl-4 text-xs space-y-1.5 mt-2 text-slate-800">
              <div>A. Eksekusi pengujian akhir &rarr; Konfigurasi parameter &rarr; Persiapan alat &rarr; Pembuatan laporan.</div>
              <div>B. Persiapan sarana kerja & APD &rarr; Kalibrasi/Konfigurasi parameter awal &rarr; Pelaksanaan proses teknis &rarr; Pengujian fungsional & verifikasi mutu.</div>
              <div>C. Pelaksanaan proses teknis secara tergesa-gesa &rarr; Pembersihan &rarr; Penyetelan alat.</div>
              <div>D. Penyerahan produk ke DUDIKA &rarr; Pengujian toleransi &rarr; Perbaikan kerusakan.</div>
              <div>E. Penggantian seluruh komponen tanpa melakukan pemeriksaan prasyarat kerja terlebih dahulu.</div>
            </div>
          </div>

          <!-- Soal 4 -->
          <div class="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
            <p class="font-semibold text-slate-900">4. [Menguji CP Klausul 2 & TP 2: ${tp2.slice(0, 48)}...] (Level C3 - Batas Toleransi & Akurasi)<br>
            Saat menerapkan prosedur kerja pada <strong>${topic}</strong>, seorang teknisi menemukan nilai hasil pengukuran berada di luar batas toleransi (&plusmn;5%). Sikap kerja profesional yang harus diambil adalah...</p>
            <div class="pl-4 text-xs space-y-1.5 mt-2 text-slate-800">
              <div>A. Memanipulasi angka pengukuran pada lembar laporan agar dianggap tuntas oleh guru penilai.</div>
              <div>B. Menghentikan proses sementara, memeriksa kalibrasi alat ukur, meneliti sambungan/parameter, dan mendiskusikan temuan dengan instruktur.</div>
              <div>C. Meneruskan pengerjaan dan mengabaikan deviasi karena dianggap tidak mempengaruhi hasil akhir.</div>
              <div>D. Menyalahkan rekan satu kelompok tanpa melakukan pengecekan ulang secara teknis.</div>
              <div>E. Membongkar paksa seluruh sistem tanpa panduan skematik atau job sheet.</div>
            </div>
          </div>

          <!-- Soal 5 -->
          <div class="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
            <p class="font-semibold text-slate-900">5. [Menguji CP Klausul 3 & TP 3: ${tp3.slice(0, 48)}...] (Level C4 - Analisis Gejala Deviasi & Anomali)<br>
            Perhatikan gejala teknis berikut pada pelaksanaan <strong>${topic}</strong>: respons sistem mengalami kelambatan signifikan disertai peningkatan indikator galat (error rate). Faktor penyebab utama yang paling rasional untuk dianalisis adalah...</p>
            <div class="pl-4 text-xs space-y-1.5 mt-2 text-slate-800">
              <div>A. Sirkulasi pendinginan area kerja yang bekerja terlalu bersih.</div>
              <div>B. Terjadinya ketidaksesuaian format payload/input atau kelebihan beban (bottleneck) pada jalur transmisi data dan pemrosesan.</div>
              <div>C. Penggunaan kabel konduktor berkualitas tinggi dengan hambatan rendah.</div>
              <div>D. Penyetelan tegangan listrik yang stabil tepat pada batas standar industri.</div>
              <div>E. Kepatuhan terhadap SOP yang dilakukan secara terlalu teliti oleh operator.</div>
            </div>
          </div>

          <!-- Soal 6 -->
          <div class="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
            <p class="font-semibold text-slate-900">6. [Menguji CP Klausul 3 & TP 3: ${tp3.slice(0, 48)}...] (Level C4 - Troubleshooting & Isolasi Masalah)<br>
            Dalam troubleshooting materi <strong>${topic}</strong>, metode "Divide and Conquer" (pemecahan masalah bertahap) diterapkan dengan cara...</p>
            <div class="pl-4 text-xs space-y-1.5 mt-2 text-slate-800">
              <div>A. Mengganti semua elemen sistem secara bersamaan tanpa mengisolasi bagian yang rusak.</div>
              <div>B. Memisahkan sistem menjadi beberapa modul/blok independen, menguji input-output tiap modul untuk menentukan lokasi galat secara presisi.</div>
              <div>C. Mematikan sistem dan menunggu hingga sistem memperbaiki dirinya sendiri.</div>
              <div>D. Mengabaikan pesan log kesalahan dan melanjutkan proses ke tahap berikutnya.</div>
              <div>E. Menghapus seluruh konfigurasi tanpa membuat cadangan (backup) terlebih dahulu.</div>
            </div>
          </div>

          <!-- Soal 7 -->
          <div class="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
            <p class="font-semibold text-slate-900">7. [Menguji CP Klausul 4 & TP 4: ${tp4.slice(0, 48)}...] (Level C3 - Etika Kerja & Nilai Bali)<br>
            Nilai kearifan lokal Bali <em>"Menyama Braya"</em> dan <em>"Tri Kaya Parisudha"</em> dalam konteks kerja kelompok praktikum <strong>${topic}</strong> di SMK Negeri 1 Bebandem diwujudkan melalui...</p>
            <div class="pl-4 text-xs space-y-1.5 mt-2 text-slate-800">
              <div>A. Menyelesaikan pekerjaan sendiri tanpa mempedulikan rekan tim yang mengalami kesulitan belajar.</div>
              <div>B. Berpikir benar, berkata jujur mengenai hasil pengukuran, serta berkolaborasi saling membantu menyelesaikan proyek kejuruan secara harmonis.</div>
              <div>C. Menutupi kekurangan hasil kerja rekan tim dari instruktur agar terbebas dari remedial.</div>
              <div>D. Memanfaatkan sarana lab secara berlebihan tanpa memikirkan giliran kelompok lain.</div>
              <div>E. Menyerahkan seluruh beban penyusunan laporan akhir hanya kepada ketua kelompok.</div>
            </div>
          </div>

          <!-- Soal 8 -->
          <div class="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
            <p class="font-semibold text-slate-900">8. [Menguji CP Klausul 4 & TP 4: ${tp4.slice(0, 48)}...] (Level C5 - Pengujian Kendali Mutu QC DUDIKA)<br>
            Tolak ukur utama dalam pengujian kendali mutu (Quality Control) terhadap hasil proyek materi <strong>${topic}</strong> sebelum dinyatakan layak diserahkan kepada konsumen/mitra DUDIKA adalah...</p>
            <div class="pl-4 text-xs space-y-1.5 mt-2 text-slate-800">
              <div>A. Unit memenuhi seluruh spesifikasi fungsional, lulus uji toleransi keselamatan kerja, andal saat beban kerja penuh, dan terdokumentasi rapi.</div>
              <div>B. Penampilan fisik luar yang menarik meskipun fungsi teknis di dalamnya sering mengalami kegagalan.</div>
              <div>C. Biaya pengerjaan yang ditekan serendah mungkin dengan mengabaikan material standar industri.</div>
              <div>D. Kecepatan penyelesaian kerja yang mengorbankan prosedur uji keandalan sistem.</div>
              <div>E. Hasil kerja yang hanya dapat dioperasikan oleh pembuatnya tanpa petunjuk manual bagi pengguna lain.</div>
            </div>
          </div>

          <!-- Soal 9 -->
          <div class="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
            <p class="font-semibold text-slate-900">9. [PILIHAN GANDA KOMPLEKS HOTS - Menguji Integrasi CP & TP 3-4] (Level C5 - Kasus Multi-Faktor)<br>
            Saat tim teknisi SMK Negeri 1 Bebandem menguji coba produk implementasi <strong>${topic}</strong> pada mitra industri di Karangasem, ditemukan bahwa keluaran sistem tidak stabil saat beban puncak. Tim merumuskan beberapa hipotesis:<br>
            (1) Terjadi inkonsistensi struktur data input atau ketidakcocokan tipe parameter.<br>
            (2) Terdapat penurunan catu daya atau keterbatasan bandwidth yang memicu time-out.<br>
            (3) Warna cat pelindung luar workstation tidak sesuai selera operator.<br>
            (4) Penanganan galat (exception handling) belum menangani status kegagalan tak terduga.<br>
            Kombinasi hipotesis teknis yang logis dan wajib diuji terlebih dahulu adalah...</p>
            <div class="pl-4 text-xs space-y-1.5 mt-2 text-slate-800">
              <div>A. (1), (2), dan (3)</div>
              <div>B. (1), (2), dan (4)</div>
              <div>C. (2), (3), dan (4)</div>
              <div>D. (1) dan (3) saja</div>
              <div>E. (3) dan (4) saja</div>
            </div>
          </div>

          <!-- Soal 10 -->
          <div class="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
            <p class="font-semibold text-slate-900">10. [STUDI KASUS URAIAN HOTS - Menguji Sintesis Penuh CP & TP 2-4] (Level C6 - Perumusan SOP & Solusi Terpadu)<br>
            Sebagai calon teknisi lulusan SMK Negeri 1 Bebandem yang kompeten pada bidang <strong>${vocation}</strong>, Anda ditugaskan menyusun rancangan penanganan kendala dan standar mutu pada materi <strong>${topic}</strong>. Uraikan secara sistematis:<br>
            a. 3 (tiga) tahapan sistematis dalam mendeteksi dan menyelesaikan permasalahan teknis (troubleshoot) pada <em>${topic}</em>!<br>
            b. Langkah pencegahan preventif (preventive maintenance) agar gangguan serupa tidak terulang kembali di masa depan!<br>
            c. Bagaimana penerapan nilai kearifan lokal Bali <em>"Menyama Braya"</em> dapat meningkatkan efektivitas kolaborasi tim Anda?</p>
            <div class="border border-slate-300 rounded-lg h-28 p-2 text-xs text-slate-400 bg-white italic mt-2">
              [Ruang Lembar Jawaban Uraian Peserta Didik]
            </div>
          </div>
        </div>

        <!-- ================= LEMBAR TERPISAH KUNCI JAWABAN ================= -->
        <div class="page-break" style="page-break-before: always; border-top: 3px double #000; margin-top: 45px; padding-top: 25px;">
          <div class="text-center mb-5">
            <span class="bg-red-100 text-red-900 text-xs font-bold px-3 py-1 rounded-full border border-red-300">
              DOKUMEN RAHASIA PENDIDIK
            </span>
            <h2 class="text-xl font-bold uppercase text-red-950 mt-2">
              KUNCI JAWABAN DAN PEDOMAN PEMBAHASAN LENGKAP
            </h2>
            <p class="text-xs font-bold text-slate-700 tracking-wider">
              (LEMBAR TERPISAH - KHUSUS GURU PENGAMPU / ASESOR SMK NEGERI 1 BEBANDEM)
            </p>
          </div>

          <table class="w-full border-collapse border border-gray-400 text-xs mb-6">
            <thead class="bg-red-900 text-white">
              <tr>
                <th class="border border-gray-400 p-2 w-10 text-center">No</th>
                <th class="border border-gray-400 p-2 w-16 text-center">Kunci</th>
                <th class="border border-gray-400 p-2 w-14 text-center">Level</th>
                <th class="border border-gray-400 p-2 text-left">Penyelarasan CP &amp; TP / Pembahasan Rinci Standar Vokasi (${topic})</th>
                <th class="border border-gray-400 p-2 w-14 text-center">Bobot</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-400 p-2 text-center font-bold">1</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-red-700">B</td>
                <td class="border border-gray-400 p-2 text-center">C2</td>
                <td class="border border-gray-400 p-2 text-slate-700"><strong>[Selaras CP Klausul 1 &amp; TP 1]:</strong> Kepatuhan K3LH dan inspeksi sarana kerja merupakan standar mutlak industri sebelum mengalirkan energi/memulai pengerjaan pada ${topic}.</td>
                <td class="border border-gray-400 p-2 text-center font-semibold">8</td>
              </tr>
              <tr>
                <td class="border border-gray-400 p-2 text-center font-bold">2</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-red-700">B</td>
                <td class="border border-gray-400 p-2 text-center">C2</td>
                <td class="border border-gray-400 p-2 text-slate-700"><strong>[Selaras CP Klausul 1 &amp; TP 1]:</strong> Komponen arsitektur materi ${topic} berfungsi menerima dan memproses data/variabel input untuk menghasilkan luaran fungsional yang stabil.</td>
                <td class="border border-gray-400 p-2 text-center font-semibold">8</td>
              </tr>
              <tr>
                <td class="border border-gray-400 p-2 text-center font-bold">3</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-red-700">B</td>
                <td class="border border-gray-400 p-2 text-center">C3</td>
                <td class="border border-gray-400 p-2 text-slate-700"><strong>[Selaras CP Klausul 2 &amp; TP 2]:</strong> SOP pengerjaan yang benar harus dimulai dari verifikasi alat/K3LH, kalibrasi/konfigurasi, eksekusi teknis, hingga pengujian mutu.</td>
                <td class="border border-gray-400 p-2 text-center font-semibold">10</td>
              </tr>
              <tr>
                <td class="border border-gray-400 p-2 text-center font-bold">4</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-red-700">B</td>
                <td class="border border-gray-400 p-2 text-center">C3</td>
                <td class="border border-gray-400 p-2 text-slate-700"><strong>[Selaras CP Klausul 2 &amp; TP 2]:</strong> Integritas vokasi menuntut penelusuran deviasi teknis pada ${topic} secara objektif tanpa manipulasi data laporan praktikum.</td>
                <td class="border border-gray-400 p-2 text-center font-semibold">10</td>
              </tr>
              <tr>
                <td class="border border-gray-400 p-2 text-center font-bold">5</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-red-700">B</td>
                <td class="border border-gray-400 p-2 text-center">C4</td>
                <td class="border border-gray-400 p-2 text-slate-700"><strong>[Selaras CP Klausul 3 &amp; TP 3]:</strong> Kelambatan respons dan peningkatan error rate pada ${topic} berakar pada bottleneck transmisi data atau ketidaksesuaian struktur payload.</td>
                <td class="border border-gray-400 p-2 text-center font-semibold">10</td>
              </tr>
              <tr>
                <td class="border border-gray-400 p-2 text-center font-bold">6</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-red-700">B</td>
                <td class="border border-gray-400 p-2 text-center">C4</td>
                <td class="border border-gray-400 p-2 text-slate-700"><strong>[Selaras CP Klausul 3 &amp; TP 3]:</strong> Metode Divide and Conquer memungkinkan teknisi mengisolasi modul rusak pada materi ${topic} secara sistematis tanpa merusak modul yang sudah bekerja baik.</td>
                <td class="border border-gray-400 p-2 text-center font-semibold">10</td>
              </tr>
              <tr>
                <td class="border border-gray-400 p-2 text-center font-bold">7</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-red-700">B</td>
                <td class="border border-gray-400 p-2 text-center">C3</td>
                <td class="border border-gray-400 p-2 text-slate-700"><strong>[Selaras CP Klausul 4 &amp; TP 4]:</strong> Nilai Menyama Braya dan Tri Kaya Parisudha menanamkan kejujuran mencatat hasil dan semangat gotong-royong menyelesaikan proyek kejuruan ${vocation}.</td>
                <td class="border border-gray-400 p-2 text-center font-semibold">8</td>
              </tr>
              <tr>
                <td class="border border-gray-400 p-2 text-center font-bold">8</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-red-700">A</td>
                <td class="border border-gray-400 p-2 text-center">C5</td>
                <td class="border border-gray-400 p-2 text-slate-700"><strong>[Selaras CP Klausul 4 &amp; TP 4]:</strong> Standar mutu DUDIKA mengutamakan kepatuhan spesifikasi fungsional, keandalan beban kerja, dan dokumentasi operasional lengkap.</td>
                <td class="border border-gray-400 p-2 text-center font-semibold">10</td>
              </tr>
              <tr>
                <td class="border border-gray-400 p-2 text-center font-bold">9</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-red-700">B</td>
                <td class="border border-gray-400 p-2 text-center">C5 (HOTS)</td>
                <td class="border border-gray-400 p-2 text-slate-700"><strong>[Selaras Integrasi CP &amp; TP 3-4]:</strong> Ketidakstabilan sistem saat beban puncak selalu berkorelasi dengan ketidakcocokan tipe input (1), gangguan jalur catu/bandwidth (2), dan kelemahan exception handling (4). Warna cat (3) tidak berpengaruh.</td>
                <td class="border border-gray-400 p-2 text-center font-semibold">12</td>
              </tr>
              <tr>
                <td class="border border-gray-400 p-2 text-center font-bold">10</td>
                <td class="border border-gray-400 p-2 text-center font-bold text-red-700">Rubrik Uraian</td>
                <td class="border border-gray-400 p-2 text-center">C6 (HOTS)</td>
                <td class="border border-gray-400 p-2 text-slate-700">
                  <strong>[Selaras Sintesis Penuh CP &amp; TP 2-4] (Total Skor 14):</strong><br>
                  a. Menjelaskan 3 langkah troubleshoot sistematis materi ${topic} (identifikasi gejala, isolasi komponen, perbaikan &amp; uji ulang): Skor maks 5.<br>
                  b. Merumuskan tindakan preventif pemeliharaan berkala materi ${topic}: Skor maks 5.<br>
                  c. Menjelaskan implementasi nilai Menyama Braya dalam kerja tim kejuruan: Skor maks 4.
                </td>
                <td class="border border-gray-400 p-2 text-center font-semibold">14</td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-100 font-bold">
              <tr>
                <td colspan="4" class="border border-gray-400 p-2 text-right">TOTAL NILAI SKOR MAKSIMAL:</td>
                <td class="border border-gray-400 p-2 text-center text-red-900 font-extrabold">100</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;

    case 'rubrik_penilaian':
      return `
        ${headersInfo}
        <h2 class="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-4">RUBRIK PENILAIAN KOMPREHENSIF PEMBELAJARAN</h2>
        <p class="text-sm mb-3 text-slate-800">
          Pedoman penskoran autentik untuk mengukur ketercapaian Tujuan Pembelajaran pada materi <strong>"${topic}"</strong> Program Keahlian <strong>${vocation}</strong>:
        </p>

        <table class="w-full border-collapse border border-gray-400 text-xs mb-4">
          <thead class="bg-blue-900 text-white">
            <tr>
              <th class="border border-gray-400 p-2 w-40 text-left">Aspek Dinilai (Sesuai TP)</th>
              <th class="border border-gray-400 p-2 text-left">Sangat Mahir (Skor 4)</th>
              <th class="border border-gray-400 p-2 text-left">Mahir (Skor 3)</th>
              <th class="border border-gray-400 p-2 text-left">Cukup (Skor 2)</th>
              <th class="border border-gray-400 p-2 text-left">Perlu Bimbingan (Skor 1)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold bg-slate-50">1. Penguasaan Konseptual & Dasar (${tp1.slice(0, 32)}...)</td>
              <td class="border border-gray-400 p-2">Mampu menjelaskan teori, regulasi, dan arsitektur ${topic} secara mendalam dan tanpa keraguan.</td>
              <td class="border border-gray-400 p-2">Mampu menjelaskan konsep ${topic} dengan benar dan terstruktur.</td>
              <td class="border border-gray-400 p-2">Penjelasan konsep masih membutuhkan panduan buku atau bantuan guru.</td>
              <td class="border border-gray-400 p-2">Belum menguasai konsep dasar materi ${topic}.</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold bg-slate-50">2. Keterampilan Praktik SOP (${tp2.slice(0, 32)}...)</td>
              <td class="border border-gray-400 p-2">Eksekusi kerja teknis ${topic} sangat presisi, mematuhi SOP K3LH 100%, efisien dalam penggunaan waktu.</td>
              <td class="border border-gray-400 p-2">Langkah kerja tepat sesuai SOP industri, alat dipergunakan secara aman.</td>
              <td class="border border-gray-400 p-2">Masih melakukan kesalahan minor dalam langkah kerja yang dapat diperbaiki sendiri.</td>
              <td class="border border-gray-400 p-2">Melanggar SOP kerja teknis yang berpotensi merusak peralatan.</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold bg-slate-50">3. Troubleshooting & Nalar Kritis (${tp3.slice(0, 32)}...)</td>
              <td class="border border-gray-400 p-2">Mampu mendeteksi anomali pada ${topic} dengan cepat, menganalisis akar masalah, dan merumuskan solusi mandiri.</td>
              <td class="border border-gray-400 p-2">Mampu mengatasi kendala operasional dengan metode bertahap.</td>
              <td class="border border-gray-400 p-2">Memerlukan bantuan instruktur untuk melacak titik kesalahan sistem.</td>
              <td class="border border-gray-400 p-2">Panik dan tidak mampu melakukan langkah isolasi masalah.</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold bg-slate-50">4. Kualitas Output & Evaluasi (${tp4.slice(0, 32)}...)</td>
              <td class="border border-gray-400 p-2">Hasil karya/proyek ${topic} memenuhi seluruh standar industri DUDIKA dengan toleransi ketat.</td>
              <td class="border border-gray-400 p-2">Hasil karya baik, berfungsi normal sesuai batas spesifikasi job sheet.</td>
              <td class="border border-gray-400 p-2">Hasil karya berfungsi sebagian namun masih ada fitur/komponen yang deviasi.</td>
              <td class="border border-gray-400 p-2">Produk/hasil kerja tidak berfungsi (gagal fungsi total).</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold bg-slate-50">5. Sikap Kerja & Kearifan Lokal (Menyama Braya)</td>
              <td class="border border-gray-400 p-2">Sangat disiplin, aktif membantu rekan tim, memelihara kebersihan area kerja (Resik).</td>
              <td class="border border-gray-400 p-2">Bekerja sama dengan baik dan mematuhi etika bengkel/lab.</td>
              <td class="border border-gray-400 p-2">Cenderung pasif dalam kerja tim namun tetap tertib.</td>
              <td class="border border-gray-400 p-2">Mengganggu kekompakan tim dan mengabaikan kebersihan workstation.</td>
            </tr>
          </tbody>
        </table>

        <div class="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900">
          <strong>Konversi Nilai Akhir:</strong> Nilai = (Total Skor Perolehan / 20) &times; 100.<br>
          Kriteria Ketercapaian Tujuan Pembelajaran (KKTP): <strong>75</strong>. Peserta didik dengan nilai &lt; 75 wajib mengikuti bimbingan remedial.
        </div>
      `;

    case 'asesmen_diagnostik':
      return `
        ${headersInfo}
        <h2 class="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-4">INSTRUMEN ASESMEN DIAGNOSTIK AWAL</h2>
        <p class="text-xs text-slate-600 mb-4">Pemetaan Kesiapan Belajar Siswa Sebelum Mempelajari Materi: <strong>${topic}</strong></p>

        <h3 class="font-bold text-blue-900 text-sm mb-2">A. Diagnostik Non-Kognitif (Kesiapan Emosional & Gaya Belajar)</h3>
        <div class="border border-gray-300 p-3 bg-gray-50 rounded-lg text-xs space-y-2 mb-4">
          <p>1. Bagaimana kesiapan dan minat Anda dalam mempelajari materi <strong>${topic}</strong> hari ini? (Sangat Antusias / Cukup Siap / Kurang Siap)</p>
          <p>2. Metode belajar mana yang paling memudahkan Anda memahami langkah teknis kejuruan? (A. Menonton Video Demonstrasi B. Membaca Jobsheet C. Langsung Praktik Mandiri)</p>
          <p>3. Apakah terdapat kendala sarana (laptop/peralatan) yang Anda alami saat persiapan praktik materi ini?</p>
        </div>

        <h3 class="font-bold text-blue-900 text-sm mb-2">B. Diagnostik Kognitif (Penguasaan Kompetensi Prasyarat)</h3>
        <table class="w-full border-collapse border border-gray-300 text-xs">
          <thead class="bg-blue-900 text-white">
            <tr>
              <th class="border border-gray-300 p-2 w-10 text-center">No</th>
              <th class="border border-gray-300 p-2 text-left">Pertanyaan Uji Prasyarat Materi (${topic})</th>
              <th class="border border-gray-300 p-2 text-left">Kriteria Jawaban Tepat</th>
              <th class="border border-gray-300 p-2 w-36 text-center">Tindak Lanjut Pembelajaran</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 p-2 text-center font-bold">1</td>
              <td class="border border-gray-300 p-2 font-medium">Sebutkan 3 komponen utama keselamatan kerja (K3LH) sebelum mengoperasikan perangkat kejuruan!</td>
              <td class="border border-gray-300 p-2">Memakai pakaian kerja/APD, memeriksa kabel grounding, membaca lembar SOP.</td>
              <td class="border border-gray-300 p-2 text-center text-slate-600">Review kilat 5 menit di awal sesi</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2 text-center font-bold">2</td>
              <td class="border border-gray-300 p-2 font-medium">Apa yang Anda ketahui tentang fungsi dasar pada ${tp1.slice(0, 45)}...?</td>
              <td class="border border-gray-300 p-2">Mampu menyebutkan definisi atau peran komponen pembentuk sistem dasar.</td>
              <td class="border border-gray-300 p-2 text-center text-slate-600">Dikelompokkan dengan tutor sebaya</td>
            </tr>
          </tbody>
        </table>
      `;

    case 'asesmen_formatif':
      return `
        ${headersInfo}
        <h2 class="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-4">INSTRUMEN ASESMEN FORMATIF (MONITORING PROSES)</h2>
        <p class="text-xs text-slate-600 mb-3">Lembar Observasi Proses Pembelajaran Aktif & Pemantauan Ketercapaian TP Materi: <strong>${topic}</strong></p>

        <table class="w-full border-collapse border border-gray-300 text-xs mb-4">
          <thead class="bg-blue-900 text-white">
            <tr>
              <th class="border border-gray-300 p-2 w-10 text-center">No</th>
              <th class="border border-gray-300 p-2 text-left">Nama Peserta Didik</th>
              <th class="border border-gray-300 p-2 text-center">TP 1 (Konsep)</th>
              <th class="border border-gray-300 p-2 text-center">TP 2 (Praktik SOP)</th>
              <th class="border border-gray-300 p-2 text-center">TP 3 (Troubleshoot)</th>
              <th class="border border-gray-300 p-2 text-center">Karakter / K3LH</th>
              <th class="border border-gray-300 p-2 text-left">Catatan Guru Pengampu</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 p-2 text-center font-bold">1</td>
              <td class="border border-gray-300 p-2 font-semibold">I Gede Agus Santika</td>
              <td class="border border-gray-300 p-2 text-center text-emerald-700 font-bold">Tercapai</td>
              <td class="border border-gray-300 p-2 text-center text-emerald-700 font-bold">Tercapai</td>
              <td class="border border-gray-300 p-2 text-center text-emerald-700 font-bold">Tercapai</td>
              <td class="border border-gray-300 p-2 text-center">Sangat Baik</td>
              <td class="border border-gray-300 p-2 text-slate-600">Menjadi tutor sebaya bagi kelompok dalam materi ${topic}</td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-2 text-center font-bold">2</td>
              <td class="border border-gray-300 p-2 font-semibold">I Komang Raditya</td>
              <td class="border border-gray-300 p-2 text-center text-emerald-700 font-bold">Tercapai</td>
              <td class="border border-gray-300 p-2 text-center text-amber-700 font-medium">Perlu Bimbingan</td>
              <td class="border border-gray-300 p-2 text-center text-red-600 font-medium">Belum Tercapai</td>
              <td class="border border-gray-300 p-2 text-center">Cukup</td>
              <td class="border border-gray-300 p-2 text-slate-600">Butuh pendampingan khusus saat eksekusi parameter teknis</td>
            </tr>
          </tbody>
        </table>
      `;

    case 'asesmen_sumatif':
      return `
        ${headersInfo}
        <h2 class="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-4">INSTRUMEN ASESMEN SUMATIF LINGKUP MATERI</h2>
        <p class="text-xs text-slate-600 mb-3">Uji Capaian Akhir Unit Pembelajaran Materi: <strong>${topic}</strong> (KKTP: <strong>75</strong>)</p>

        <table class="w-full border-collapse border border-gray-400 text-xs mb-4">
          <thead class="bg-blue-900 text-white">
            <tr>
              <th class="border border-gray-400 p-2 w-10 text-center">No</th>
              <th class="border border-gray-400 p-2 text-left">Nama Peserta Didik</th>
              <th class="border border-gray-400 p-2 text-center">Ujian Teori (40%)</th>
              <th class="border border-gray-400 p-2 text-center">Ujian Praktik (60%)</th>
              <th class="border border-gray-400 p-2 text-center">Nilai Akhir (NA)</th>
              <th class="border border-gray-400 p-2 text-center">Ketercapaian TP</th>
              <th class="border border-gray-400 p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">1</td>
              <td class="border border-gray-400 p-2 font-semibold">I Gede Agus Santika</td>
              <td class="border border-gray-400 p-2 text-center">88</td>
              <td class="border border-gray-400 p-2 text-center">92</td>
              <td class="border border-gray-400 p-2 text-center font-extrabold text-blue-950">90.4</td>
              <td class="border border-gray-400 p-2 text-center text-emerald-700 font-semibold">TP 1, 2, 3, 4 Tuntas</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-emerald-700 bg-emerald-50">TUNTAS</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">2</td>
              <td class="border border-gray-400 p-2 font-semibold">I Komang Raditya</td>
              <td class="border border-gray-400 p-2 text-center">68</td>
              <td class="border border-gray-400 p-2 text-center">70</td>
              <td class="border border-gray-400 p-2 text-center font-extrabold text-red-700">69.2</td>
              <td class="border border-gray-400 p-2 text-center text-red-600 font-semibold">TP 3 Belum Tuntas</td>
              <td class="border border-gray-400 p-2 text-center font-bold text-red-700 bg-red-50">REMEDIAL</td>
            </tr>
          </tbody>
        </table>
      `;

    case 'analisis_penilaian':
      return `
        ${headersInfo}
        <h2 class="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-4">ANALISIS HASIL PENILAIAN & KETERCAPAIAN TP</h2>
        <p class="text-xs text-slate-600 mb-3">Distribusi Ketercapaian Indikator Tujuan Pembelajaran Materi: <strong>${topic}</strong></p>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5 text-center">
          <div class="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div class="text-xl font-extrabold text-blue-900">80.0%</div>
            <div class="text-xs text-slate-600 mt-1">Ketuntasan Klasikal</div>
          </div>
          <div class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
            <div class="text-xl font-extrabold text-emerald-800">81.4</div>
            <div class="text-xs text-slate-600 mt-1">Rata-Rata Nilai Siswa</div>
          </div>
          <div class="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <div class="text-xl font-extrabold text-amber-800">2 Siswa</div>
            <div class="text-xs text-slate-600 mt-1">Perlu Remedial TP</div>
          </div>
          <div class="bg-purple-50 border border-purple-200 p-3 rounded-lg">
            <div class="text-xl font-extrabold text-purple-900">8 Siswa</div>
            <div class="text-xs text-slate-600 mt-1">Mengikuti Pengayaan</div>
          </div>
        </div>

        <h3 class="font-bold text-blue-900 text-sm mb-2">Pemetaan Daya Serap per Butir Tujuan Pembelajaran:</h3>
        <table class="w-full border-collapse border border-gray-300 text-xs mb-4">
          <thead class="bg-blue-900 text-white">
            <tr>
              <th class="border border-gray-300 p-2 w-16 text-center">Kode TP</th>
              <th class="border border-gray-300 p-2 text-left">Rumusan Tujuan Pembelajaran</th>
              <th class="border border-gray-300 p-2 text-center w-24">Rata-Rata Skor</th>
              <th class="border border-gray-300 p-2 text-center w-28">Status Ketercapaian</th>
            </tr>
          </thead>
          <tbody>
            ${parsedTps
              .map(
                (t, idx) => `
              <tr>
                <td class="border border-gray-300 p-2 text-center font-bold">TP ${idx + 1}</td>
                <td class="border border-gray-300 p-2 font-medium text-slate-800">${t}</td>
                <td class="border border-gray-300 p-2 text-center font-bold">${85 - idx * 4}.2</td>
                <td class="border border-gray-300 p-2 text-center text-emerald-700 font-semibold">${idx === 2 ? 'Kategori Kritis' : 'Tuntas'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;

    case 'program_remedial':
      return `
        ${headersInfo}
        <h2 class="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-4">PROGRAM REMEDIAL DAN PENGAYAAN TERSTRUKTUR</h2>
        <p class="text-xs text-slate-600 mb-4">Tindak Lanjut Hasil Evaluasi Ketercapaian TP Materi: <strong>${topic}</strong></p>

        <h3 class="font-bold text-red-900 text-sm mb-2 border-b border-red-200 pb-1">A. PROGRAM REMEDIAL (PESERTA DIDIK BELUM TUNTAS KKTP &lt; 75)</h3>
        <table class="w-full border-collapse border border-gray-400 text-xs mb-5">
          <thead class="bg-red-900 text-white">
            <tr>
              <th class="border border-gray-400 p-2 w-10 text-center">No</th>
              <th class="border border-gray-400 p-2 text-left">Nama Peserta Didik</th>
              <th class="border border-gray-400 p-2 text-left">TP yang Belum Tercapai (${topic})</th>
              <th class="border border-gray-400 p-2 text-left">Bentuk Bimbingan & Penugasan</th>
              <th class="border border-gray-400 p-2 text-center w-20">Nilai Awal</th>
              <th class="border border-gray-400 p-2 text-center w-20">Target Akhir</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-400 p-2 text-center font-bold">1</td>
              <td class="border border-gray-400 p-2 font-semibold">I Komang Raditya</td>
              <td class="border border-gray-400 p-2 text-slate-800 font-medium">${tp3}</td>
              <td class="border border-gray-400 p-2 text-slate-700">Bimbingan individual praktik di lab dan pendampingan tutor sebaya materi ${topic}</td>
              <td class="border border-gray-400 p-2 text-center text-red-700 font-bold">69.2</td>
              <td class="border border-gray-400 p-2 text-center text-emerald-700 font-bold">75 (Tuntas)</td>
            </tr>
          </tbody>
        </table>

        <h3 class="font-bold text-emerald-900 text-sm mb-2 border-b border-emerald-200 pb-1">B. PROGRAM PENGAYAAN (PESERTA DIDIK TUNTAS KKTP &ge; 75)</h3>
        <div class="bg-emerald-50 border border-emerald-300 p-3.5 rounded-lg text-xs space-y-1.5 text-emerald-950">
          <p><strong>Peserta Didik Sasaran:</strong> Siswa yang telah mencapai nilai &ge; 75 (I Gede Agus Santika, Ni Putu Ayu Mirah, dkk).</p>
          <p><strong>Bentuk Aktivitas Pengayaan:</strong> Diberikan proyek lanjutan Teaching Factory (TEFA) materi <strong>${topic}</strong> dengan tingkat kompleksitas lebih tinggi, serta ditugaskan sebagai tutor sebaya bagi rekan kelompok yang remedial.</p>
        </div>
      `;

    default:
      return `${headersInfo}<h2 class="text-xl font-bold text-blue-900 mb-2">${topic}</h2><p>Dokumen administrasi pembelajaran SMK Negeri 1 Bebandem.</p>`;
  }
}

export function generateAllDocs(
  inputOrTeacher: DocGenInput | TeacherIdentity,
  maybeLearning?: LearningIdentity,
  maybeMethods?: LearningMethods,
  maybeSettings?: AdditionalSettings
): Record<string, string> {
  const docTypes = [
    'atp',
    'modul_ajar',
    'bahan_ajar',
    'lkpd',
    'media_pembelajaran',
    'kisi_kisi',
    'naskah_soal',
    'rubrik_penilaian',
    'asesmen_diagnostik',
    'asesmen_formatif',
    'asesmen_sumatif',
    'analisis_penilaian',
    'program_remedial',
  ];

  const results: Record<string, string> = {};
  for (const t of docTypes) {
    results[t] = generateSingleDoc(t, inputOrTeacher, maybeLearning, maybeMethods, maybeSettings);
  }
  return results;
}
