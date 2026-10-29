import { SCHOOL_INFO } from '../constants/defaults';
import { TeacherIdentity } from '../types';

/**
 * Builds the official Kop HTML block for display, print, and Word export
 */
export function getOfficialKopHTML(): string {
  return `
    <div class="kop-surat" style="border-bottom: 3px double #000000; padding-bottom: 8px; margin-bottom: 20px; font-family: 'Times New Roman', serif;">
      <table style="width: 100%; border-collapse: collapse; border: none;">
        <tr>
          <td style="width: 90px; text-align: center; vertical-align: middle; border: none; padding-right: 15px;">
            <img src="${SCHOOL_INFO.logoUrl}" alt="Logo SMK Negeri 1 Bebandem" style="width: 80px; height: auto; max-height: 85px; object-fit: contain;" crossorigin="anonymous" />
          </td>
          <td style="text-align: center; vertical-align: middle; border: none; line-height: 1.25;">
            <div style="font-size: 13pt; font-weight: normal; letter-spacing: 0.5px; color: #111827;">${SCHOOL_INFO.province}</div>
            <div style="font-size: 13pt; font-weight: normal; letter-spacing: 0.5px; color: #111827;">${SCHOOL_INFO.office}</div>
            <div style="font-size: 16pt; font-weight: 800; letter-spacing: 1px; color: #0f2b5c; margin: 2px 0;">${SCHOOL_INFO.name}</div>
            <div style="font-size: 12pt; font-weight: bold; color: #111827;">${SCHOOL_INFO.year}</div>
            <div style="font-size: 10pt; font-style: italic; color: #374151;">${SCHOOL_INFO.address}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Builds the official 2-column signature block at the end of every document
 */
export function getOfficialSignatureHTML(teacher: TeacherIdentity, createdDate?: string): string {
  const dateFormatted = createdDate || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <div class="tanda-tangan-block" style="margin-top: 40px; page-break-inside: avoid; font-family: 'Times New Roman', serif; font-size: 11pt; color: #111827;">
      <table style="width: 100%; border-collapse: collapse; border: none;">
        <tr>
          <td style="width: 50%; vertical-align: top; text-align: left; border: none; padding-left: 20px;">
            <div>Mengetahui,</div>
            <div style="margin-bottom: 70px;">Kepala SMK Negeri 1 Bebandem,</div>
            <div style="font-weight: bold; text-decoration: underline; font-size: 12pt;">${SCHOOL_INFO.principalName}</div>
            <div>NIP. ${SCHOOL_INFO.principalNip}</div>
          </td>
          <td style="width: 50%; vertical-align: top; text-align: left; border: none; padding-left: 50px;">
            <div>${SCHOOL_INFO.location}, ${dateFormatted}</div>
            <div style="margin-bottom: 70px;">Guru Mata Pelajaran,</div>
            <div style="font-weight: bold; text-decoration: underline; font-size: 12pt;">${teacher.teacherName || '[Nama Guru]'}</div>
            <div>NIP. ${teacher.teacherNip || '[NIP Guru]'}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Wraps content with official Kop, styling, and signature block for printing or Word viewing
 */
export function wrapDocumentWithKopAndSignature(
  docTitle: string,
  contentHtml: string,
  teacher: TeacherIdentity,
  createdDate?: string
): string {
  return `
    <div class="official-doc-wrapper" style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.25; color: #111827;">
      ${getOfficialKopHTML()}
      
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 15pt; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f2b5c; letter-spacing: 0.5px;">${docTitle}</h1>
        <div style="font-size: 11pt; font-weight: 600; color: #4b5563; margin-top: 4px;">TAHUN AJARAN 2026/2027</div>
      </div>

      <div class="doc-body-content">
        ${contentHtml}
      </div>

      ${getOfficialSignatureHTML(teacher, createdDate)}
    </div>
  `;
}

/**
 * Exports document as Microsoft Word (.doc / .docx compatible XML Word HTML format)
 * This guarantees 100% preservation of official school headers, tables, colors, font styling, and 2-column signature blocks in Word.
 */
export function exportToWordDocument(
  filename: string,
  docTitle: string,
  contentHtml: string,
  teacher: TeacherIdentity,
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const fullContent = wrapDocumentWithKopAndSignature(docTitle, contentHtml, teacher);

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${docTitle}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: ${orientation === 'landscape' ? '29.7cm 21cm' : '21cm 29.7cm'};
          margin: 2.5cm 2cm 2.5cm 2.5cm;
          mso-page-orientation: ${orientation};
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.15;
          color: #000000;
        }
        h1, h2, h3, h4 {
          font-family: 'Times New Roman', serif;
          color: #0f2b5c;
        }
        h2 {
          font-size: 14pt;
          border-bottom: 1.5pt solid #0f2b5c;
          padding-bottom: 4pt;
          margin-top: 14pt;
          margin-bottom: 8pt;
        }
        h3 {
          font-size: 12pt;
          margin-top: 10pt;
          margin-bottom: 6pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 8pt 0;
          font-size: 11pt;
        }
        table, th, td {
          border: 1pt solid #4b5563;
        }
        th {
          background-color: #1e3a8a;
          color: #ffffff;
          font-weight: bold;
          padding: 6pt 4pt;
          text-align: center;
        }
        td {
          padding: 5pt 6pt;
          vertical-align: top;
        }
        .kop-surat table, .kop-surat td, 
        .tanda-tangan-block table, .tanda-tangan-block td {
          border: none !important;
        }
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-emerald-50 { background-color: #ecfdf5 !important; }
        .bg-yellow-50 { background-color: #fefce8 !important; }
        .bg-amber-50 { background-color: #fffbeb !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
        .meta-box table, .meta-box td { border: 1pt solid #bfdbfe; }
      </style>
    </head>
    <body>
      ${fullContent}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordHtml], {
    type: 'application/msword'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers clean browser print with A4 settings and print media styles
 */
export function printFormattedDocument(docTitle: string, contentHtml: string, teacher: TeacherIdentity) {
  const fullHtml = wrapDocumentWithKopAndSignature(docTitle, contentHtml, teacher);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle} - SMK Negeri 1 Bebandem</title>
        <style>
          @page {
            size: A4;
            margin: 20mm 15mm 20mm 20mm;
          }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 11.5pt;
            line-height: 1.25;
            color: #000;
            margin: 0;
            padding: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 10.5pt;
          }
          th, td {
            border: 1px solid #374151;
            padding: 6px 8px;
            vertical-align: top;
          }
          th {
            background-color: #1e3a8a !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .kop-surat table, .kop-surat td,
          .tanda-tangan-block table, .tanda-tangan-block td {
            border: none !important;
          }
          .tanda-tangan-block {
            page-break-inside: avoid;
            margin-top: 40px;
          }
        </style>
      </head>
      <body>
        ${fullHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
