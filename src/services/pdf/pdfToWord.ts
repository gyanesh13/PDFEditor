
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
} from "docx";

import { loadPdf } from "./pdfRenderer";

interface PdfTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WordConversionResult {
  blob: Blob;
  filename: string;
  pages: number;
  characters: number;
}

function extractLines(items: PdfTextItem[]): string[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    const yDiff = b.y - a.y;

    if (Math.abs(yDiff) > 3) {
      return yDiff;
    }

    return a.x - b.x;
  });

  const lines: PdfTextItem[][] = [];

  for (const item of sorted) {
    const existingLine = lines.find(
      (line) => Math.abs(line[0].y - item.y) <= 3
    );

    if (existingLine) {
      existingLine.push(item);
    } else {
      lines.push([item]);
    }
  }

  lines.sort((a, b) => b[0].y - a[0].y);

  return lines.map((line) => {
    line.sort((a, b) => a.x - b.x);

    let result = "";
    let previousEnd = 0;

    line.forEach((item, index) => {
      const gap = item.x - previousEnd;

      if (index > 0 && gap > 2) {
        result += " ";
      }

      result += item.text;
      previousEnd = Math.max(
        previousEnd,
        item.x + item.width
      );
    });

    return result.trim();
  });
}

export async function convertPdfToWord(
  file: File
): Promise<WordConversionResult> {
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Please upload a valid PDF file.");
  }

  const pdf = await loadPdf(file);

  try {
    const paragraphs: Paragraph[] = [];
    let totalCharacters = 0;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      const textItems: PdfTextItem[] = [];

      for (const item of content.items) {
        if (!("str" in item)) continue;

        if (!item.str.trim()) continue;

        textItems.push({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
        });
      }

      const lines = extractLines(textItems);

      for (const line of lines) {
        totalCharacters += line.length;

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 22,
              }),
            ],
            spacing: {
              after: 100,
            },
          })
        );
      }

      if (pageNumber < pdf.numPages) {
        paragraphs.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }

      page.cleanup();
    }

    if (totalCharacters === 0) {
      throw new Error(
        "No selectable text found. This may be a scanned PDF. OCR is required."
      );
    }

    const document = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(document);

    const filename =
      file.name.replace(/\.pdf$/i, "") + ".docx";

    return {
      blob,
      filename,
      pages: pdf.numPages,
      characters: totalCharacters,
    };
  } finally {
    await pdf.cleanup();
  }
}
