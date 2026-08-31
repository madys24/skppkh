import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  PageBreak, 
  ImageRun 
} from "docx";
import { ReportData, PhotoAttachment } from "../types";
import { getReportFileName, formatJudulLaporan } from "./dateFormatter";

const KEMENSOS_SVG_RAW = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="455pt" height="510.2pt" viewBox="0 0 455 510.2" version="1.1">
<defs>
<clipPath id="clip1">
  <path d="M 0 331 L 440 331 L 440 510.199219 L 0 510.199219 Z M 0 331 "/>
</clipPath>
</defs>
<g id="surface1">
<path style=" stroke:none;fill-rule:evenodd;fill:rgb(15.696716%,29.026794%,52.929688%);fill-opacity:1;" d="M 12.722656 133.859375 C 62.632813 172.242188 108.160156 182.398438 143.222656 158.023438 C 118.410156 206.359375 112.933594 271.445313 126.789063 353.289063 C 121.570313 260.761719 74.683594 192.855469 12.722656 133.859375 Z M 91.746094 61.816406 C 114.371094 61.816406 132.816406 80.265625 132.816406 102.886719 C 132.816406 125.503906 114.371094 143.953125 91.746094 143.953125 C 69.132813 143.953125 50.683594 125.503906 50.683594 102.886719 C 50.683594 80.265625 69.132813 61.816406 91.746094 61.816406 Z M 91.746094 61.816406 "/>
<path style=" stroke:none;fill-rule:evenodd;fill:rgb(0%,59.959412%,20.384216%);fill-opacity:1;" d="M 312.191406 42.3125 C 237.410156 83.753906 150.660156 155.960938 133.550781 264.519531 C 133.507813 261.273438 133.492188 258.019531 133.539063 254.753906 C 135.511719 124.046875 235.386719 44.980469 318.886719 -0.078125 L 312.195313 42.3125 Z M 135.53125 359.777344 C 146.585938 302.101563 202.128906 245.566406 316.714844 190.546875 L 370.472656 211.449219 C 271.078125 238.753906 181.734375 276.617188 135.53125 359.777344 Z M 135.53125 324.933594 C 152.789063 209.128906 307.421875 129.152344 374.453125 106.921875 L 455.089844 132.804688 C 260.304688 160.015625 190.949219 249.941406 135.53125 324.933594 Z M 133.585938 291.4375 C 152.691406 167.960938 267.976563 90.632813 384.410156 19.316406 L 364.496094 90.992188 C 249.078125 132.121094 172.019531 205.183594 133.585938 291.4375 Z M 133.585938 291.4375 "/>
<g clip-path="url(#clip1)" clip-rule="nonzero">
<path style=" stroke:none;fill-rule:evenodd;fill:rgb(97.264099%,76.5625%,0.392151%);fill-opacity:1;" d="M 0 331.601563 C 12.769531 363.601563 38.863281 386.878906 90.011719 386.878906 C 133.746094 386.878906 174.664063 363.601563 187.363281 331.601563 L 223.070313 331.601563 C 217.21875 334.132813 212.726563 338.234375 210.652344 342.574219 C 197.304688 370.503906 169.984375 393.839844 133.40625 400.839844 C 185.492188 400.714844 229.191406 371.011719 239.796875 331.601563 L 275.808594 331.601563 C 266.050781 338.234375 256.621094 347.675781 255.734375 353.261719 C 249.03125 395.527344 214.078125 422.078125 168.273438 432.65625 C 232.585938 431.511719 269.789063 398.589844 278.984375 353.867188 C 280.171875 348.089844 284.15625 337.214844 291.578125 331.601563 L 324.414063 331.601563 C 317.433594 337.046875 310.03125 344.335938 309.410156 352.585938 C 305.566406 403.855469 262.367188 446.027344 204.886719 456.191406 C 269.445313 454.007813 326.34375 412.09375 334.359375 358.222656 C 335.5625 350.152344 339.570313 339.339844 344.730469 331.601563 L 380.535156 331.601563 C 371.941406 337.128906 363.800781 344.628906 363.800781 351.210938 C 361.183594 406.324219 313.3125 459.789063 242.269531 480.144531 C 324.949219 474.097656 386.214844 416.460938 390.953125 353.3125 C 391.449219 346.734375 394.699219 339.351563 400.085938 331.601563 L 439.5625 331.601563 C 423.019531 339.117188 422.910156 346.355469 421.453125 353.730469 C 403.460938 445.085938 325.246094 510.15625 213.203125 510.15625 C 106.398438 510.15625 17.253906 432.726563 0 331.601563 Z M 0 331.601563 "/>
</g>
</g>
</svg>`;

// Helper to convert base64 image string to ArrayBuffer for docx ImageRun
async function base64ToArrayBuffer(base64: string): Promise<ArrayBuffer> {
  const base64Content = base64.split(",")[1] || base64;
  const binaryString = window.atob(base64Content);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert SVG text to high-res PNG ArrayBuffer for seamless MS Word rendering
async function renderSvgToPngArrayBuffer(svgString: string): Promise<ArrayBuffer | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const blobURL = window.URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, 400, 400);
            ctx.drawImage(img, 0, 0, 400, 400);
            const pngDataUrl = canvas.toDataURL("image/png");
            window.URL.revokeObjectURL(blobURL);
            base64ToArrayBuffer(pngDataUrl).then(resolve).catch(() => resolve(null));
          } else {
            window.URL.revokeObjectURL(blobURL);
            resolve(null);
          }
        } catch {
          window.URL.revokeObjectURL(blobURL);
          resolve(null);
        }
      };

      img.onerror = () => {
        window.URL.revokeObjectURL(blobURL);
        resolve(null);
      };

      img.src = blobURL;
    } catch {
      resolve(null);
    }
  });
}

export async function exportToWord(data: ReportData, photos: PhotoAttachment[]): Promise<void> {
  const docChildren: any[] = [];

  // Headings & Styling Helpers
  const createTitle = (text: string) => {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240 },
      children: [
        new TextRun({
          text,
          bold: true,
          font: "Arial",
          size: 28, // 14pt
          color: "000000"
        })
      ]
    });
  };

  const createSubtitle = (text: string) => {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [
        new TextRun({
          text,
          bold: true,
          font: "Arial",
          size: 24, // 12pt
          color: "333333"
        })
      ]
    });
  };

  const createHeading1 = (code: string, text: string) => {
    return new Paragraph({
      spacing: { before: 360, after: 120 },
      keepNext: true,
      children: [
        new TextRun({
          text: `${code}. ${text}`,
          bold: true,
          font: "Arial",
          size: 24, // 12pt
          color: "000000"
        })
      ]
    });
  };

  const createHeading2 = (code: string, text: string) => {
    return new Paragraph({
      spacing: { before: 200, after: 80 },
      indent: { left: 360 }, // indent 0.25" (approx 360 twips)
      keepNext: true,
      children: [
        new TextRun({
          text: `${code}. ${text}`,
          bold: true,
          font: "Arial",
          size: 22, // 11pt
          color: "111111"
        })
      ]
    });
  };

  const createBodyParagraph = (text: string, isIndented = false) => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 100, after: 120, line: 360 },
      indent: isIndented ? { left: 720 } : undefined, // double indent for level 2 children
      children: [
        new TextRun({
          text,
          font: "Arial",
          size: 22, // 11pt
        })
      ]
    });
  };

  // Add Letterhead (Kop Surat) if configured
  if (data.kopTipe && data.kopTipe !== "none") {
    const isKemensos = data.kopTipe === "kemensos";
    const kementerian = isKemensos 
      ? "KEMENTERIAN SOSIAL REPUBLIK INDONESIA" 
      : (data.kopKementerian || "").toUpperCase();
    
    const eselon1 = isKemensos
      ? "DIREKTORAT JENDERAL PERLINDUNGAN DAN JAMINAN SOSIAL"
      : (data.kopEselon1 || "").toUpperCase();
    
    const eselon2 = isKemensos
      ? "DIREKTORAT PERLINDUNGAN SOSIAL NON KEBENCANAAN"
      : (data.kopEselon2 || "").toUpperCase();

    const alamat = isKemensos
      ? "Jl. Salemba Raya No. 28 Jakarta Pusat 10430 Telp. (021) 3103591 http://www.kemsos.go.id"
      : [data.kopAlamat, data.kopTelepon ? `Telp. ${data.kopTelepon}` : "", data.kopWebsite].filter(Boolean).join(" ");

    // Convert SVG Logo to high-quality PNG for Word
    let logoPngBuffer: ArrayBuffer | null = null;
    if (isKemensos) {
      logoPngBuffer = await renderSvgToPngArrayBuffer(KEMENSOS_SVG_RAW);
    }

    const noBorders = {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
    };

    const textParagraphs: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        children: [
          new TextRun({
            text: kementerian,
            bold: true,
            font: "Arial",
            size: 24, // 12pt
            color: "000000"
          })
        ]
      })
    ];

    if (eselon1) {
      textParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 30 },
          children: [
            new TextRun({
              text: eselon1,
              bold: true,
              font: "Arial",
              size: 20, // 10pt
              color: "000000"
            })
          ]
        })
      );
    }

    if (eselon2) {
      textParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 30 },
          children: [
            new TextRun({
              text: eselon2,
              bold: true,
              font: "Arial",
              size: 18, // 9pt
              color: "000000"
            })
          ]
        })
      );
    }

    if (alamat) {
      textParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({
              text: alamat,
              font: "Arial",
              size: 15, // 7.5pt
              color: "333333"
            })
          ]
        })
      );
    }

    if (logoPngBuffer) {
      // 2-column Table for professional KOP layout: Logo on left (16%), Text on right (84%)
      const kopTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 16, type: WidthType.PERCENTAGE },
                borders: noBorders,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                    children: [
                      new ImageRun({
                        data: logoPngBuffer,
                        transformation: {
                          width: 72,
                          height: 80,
                        },
                      } as any),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 84, type: WidthType.PERCENTAGE },
                borders: noBorders,
                children: textParagraphs,
              }),
            ],
          }),
        ],
      });

      docChildren.push(kopTable);
    } else {
      docChildren.push(...textParagraphs);
    }

    // Thick Divider Line (Kop double line equivalent in Word docx)
    docChildren.push(
      new Paragraph({
        border: {
          bottom: { color: "000000", space: 4, style: BorderStyle.DOUBLE, size: 24 } // DOUBLE thick line
        },
        spacing: { before: 80, after: 300 }
      })
    );
  }

  // Add Document Header / Title (Naskah Dinas standard format)
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: "LAPORAN",
          bold: true,
          font: "Arial",
          size: 28, // 14pt
          color: "000000"
        })
      ]
    })
  );

  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({
          text: "TENTANG",
          bold: true,
          font: "Arial",
          size: 24, // 12pt
          color: "000000"
        })
      ]
    })
  );

  const judulRencanaAksi = formatJudulLaporan(data.rencanaAksi);

  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 360 },
      children: [
        new TextRun({
          text: judulRencanaAksi,
          bold: true,
          font: "Arial",
          size: 26, // 13pt
          color: "000000"
        })
      ]
    })
  );

  // A. PENDAHULUAN
  docChildren.push(createHeading1("A", "PENDAHULUAN"));
  
  // A.1 Umum
  docChildren.push(createHeading2("1", "Umum"));
  docChildren.push(createBodyParagraph(data.pendahuluan.umum, true));

  // A.2 Maksud dan Tujuan
  docChildren.push(createHeading2("2", "Maksud dan Tujuan"));
  docChildren.push(createBodyParagraph(data.pendahuluan.maksudDanTujuan, true));

  // A.3 Ruang Lingkup
  docChildren.push(createHeading2("3", "Ruang Lingkup"));
  docChildren.push(createBodyParagraph(data.pendahuluan.ruangLingkup, true));

  // A.4 Dasar
  docChildren.push(createHeading2("4", "Dasar"));
  docChildren.push(createBodyParagraph(data.pendahuluan.dasar, true));

  // B. KEGIATAN YANG DILAKSANAKAN
  docChildren.push(createHeading1("B", "KEGIATAN YANG DILAKSANAKAN"));
  docChildren.push(createBodyParagraph(data.kegiatanLaksana));

  // C. HASIL YANG DICAPAI
  docChildren.push(createHeading1("C", "HASIL YANG DICAPAI"));
  docChildren.push(createBodyParagraph(data.hasilDicapai));

  // D. SIMPULAN DAN SARAN
  docChildren.push(createHeading1("D", "SIMPULAN DAN SARAN"));

  // D.1 Kesimpulan
  docChildren.push(createHeading2("1", "Kesimpulan"));
  docChildren.push(createBodyParagraph(data.simpulanDanSaran.kesimpulan, true));

  // D.2 Saran
  docChildren.push(createHeading2("2", "Saran"));
  docChildren.push(createBodyParagraph(data.simpulanDanSaran.saran, true));

  // E. PENUTUP
  docChildren.push(createHeading1("E", "PENUTUP"));
  docChildren.push(createBodyParagraph(data.penutup));

  // Spacing before signature block
  docChildren.push(new Paragraph({ spacing: { before: 400 } }));

  // Signature Block Table (Table to align right side)
  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ text: "" })] // left side empty
            }),
            new TableCell({
              width: { size: 45, type: WidthType.PERCENTAGE },
              children: await (async () => {
                const cellChildren: any[] = [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 40 },
                    children: [new TextRun({ text: `${data.tempatPembuatan || "Jakarta"}, ${data.tanggalPembuatan || "15 Juni 2026"}`, font: "Arial", size: 22 })]
                  }),
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: { after: data.signatureData ? 80 : 1000 },
                    children: [new TextRun({ text: data.jabatan || "Pelapor", font: "Arial", size: 22, bold: true })]
                  })
                ];

                if (data.signatureData) {
                  try {
                    const sigBuffer = await base64ToArrayBuffer(data.signatureData);
                    cellChildren.push(
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 40, after: 40 },
                        children: [
                          new ImageRun({
                            data: sigBuffer,
                            transformation: {
                              width: 140,
                              height: 55,
                            },
                          } as any),
                        ],
                      })
                    );
                  } catch (err) {
                    console.error("Gagal menyisipkan ttd ke Word:", err);
                  }
                }

                cellChildren.push(
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 20 },
                    children: [new TextRun({ text: data.nama || "-", font: "Arial", size: 22, bold: true, underline: {} })]
                  }),
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [new TextRun({ text: `NIP. ${data.nip || "-"}`, font: "Arial", size: 22 })]
                  })
                );

                return cellChildren;
              })()
            })
          ]
        })
      ]
    })
  );

  // Page break for Photos section
  if (photos.length > 0) {
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    docChildren.push(createTitle("LAMPIRAN: DOKUMENTASI FOTO KEGIATAN"));

    // Loop and insert photos
    for (const photo of photos) {
      try {
        const imageBuffer = await base64ToArrayBuffer(photo.base64Data);

        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 100 },
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 480, // High-quality display scale
                  height: 320,
                },
              } as any),
            ],
          })
        );

        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
            children: [
              new TextRun({
                text: `Foto: ${photo.caption || photo.fileName}`,
                italics: true,
                font: "Arial",
                size: 20, // 10pt
                color: "555555"
              })
            ]
          })
        );
      } catch (err) {
        console.error("Failed to inject image into Docx:", err, photo.fileName);
        // Fallback placeholder if image parsing fails
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: `[Gagal memuat berkas gambar: ${photo.fileName}]`,
                italics: true,
                color: "AA0000"
              })
            ]
          })
        );
      }
    }
  }

  // Generate Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            }
          }
        },
        children: docChildren,
      },
    ],
  });

  // Pack & Download Browser-side
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const trigger = document.createElement("a");
  trigger.href = url;
  trigger.download = getReportFileName(data, "docx");
  document.body.appendChild(trigger);
  trigger.click();
  document.body.removeChild(trigger);
  URL.revokeObjectURL(url);
}
