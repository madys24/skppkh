import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  HeadingLevel, 
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
    const kementerian = data.kopTipe === "kemensos" 
      ? "KEMENTERIAN SOSIAL REPUBLIK INDONESIA" 
      : (data.kopKementerian || "").toUpperCase();
    
    const eselon1 = data.kopTipe === "kemensos"
      ? "DIREKTORAT JENDERAL PERLINDUNGAN DAN JAMINAN SOSIAL"
      : (data.kopEselon1 || "").toUpperCase();
    
    const eselon2 = data.kopTipe === "kemensos"
      ? "DIREKTORAT PERLINDUNGAN SOSIAL NON KEBENCANAAN"
      : (data.kopEselon2 || "").toUpperCase();

    const alamat = data.kopTipe === "kemensos"
      ? "Jl. Salemba Raya No. 28 Jakarta Pusat 10430 Telp. (021) 3103591 http://www.kemsos.go.id"
      : [data.kopAlamat, data.kopTelepon ? `Telp. ${data.kopTelepon}` : "", data.kopWebsite].filter(Boolean).join(" ");

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
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
    );

    if (eselon1) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
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
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
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

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: alamat,
            font: "Arial",
            size: 16, // 8pt
            color: "333333"
          })
        ]
      })
    );

    // Thick Divider Line (Kop double line equivalent in Word docx)
    docChildren.push(
      new Paragraph({
        border: {
          bottom: { color: "000000", space: 4, style: BorderStyle.DOUBLE, size: 24 } // DOUBLE thick line
        },
        spacing: { after: 360 }
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
