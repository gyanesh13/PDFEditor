import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export type SplitMode = "extract" | "every-page";

export interface SplitResult {
  blob: Blob;
  filename: string;
}

export async function getPdfPageCount(
  file: File
): Promise<number> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);

  return pdf.getPageCount();
}

export function parsePageRanges(
  input: string,
  totalPages: number
): number[] {
  if (!input.trim()) {
    throw new Error("Please enter page numbers.");
  }

  const pages = new Set<number>();
  const segments = input.split(",");

  for (const rawSegment of segments) {
    const segment = rawSegment.trim();

    if (/^\d+$/.test(segment)) {
      const page = Number(segment);

      if (page < 1 || page > totalPages) {
        throw new Error(
          `Page ${page} is outside the valid range (1-${totalPages}).`
        );
      }

      pages.add(page - 1);
      continue;
    }

    const match = segment.match(/^(\d+)\s*-\s*(\d+)$/);

    if (!match) {
      throw new Error(`Invalid page range: "${segment}".`);
    }

    const start = Number(match[1]);
    const end = Number(match[2]);

    if (
      start < 1 ||
      end > totalPages ||
      start > end
    ) {
      throw new Error(
        `Invalid range ${segment}. Valid pages: 1-${totalPages}.`
      );
    }

    for (let page = start; page <= end; page++) {
      pages.add(page - 1);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

function createPdfBlob(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes)], {
    type: "application/pdf",
  });
}

export async function extractPdfPages(
  file: File,
  range: string
): Promise<SplitResult> {
  const sourceBytes = await file.arrayBuffer();
  const source = await PDFDocument.load(sourceBytes);

  const selectedPages = parsePageRanges(
    range,
    source.getPageCount()
  );

  const result = await PDFDocument.create();

  const copiedPages = await result.copyPages(
    source,
    selectedPages
  );

  copiedPages.forEach((page) => result.addPage(page));

  const output = await result.save();

  return {
    blob: createPdfBlob(output),
    filename: "PDFEditor-extracted.pdf",
  };
}

export async function splitEveryPage(
  file: File
): Promise<SplitResult> {
  const bytes = await file.arrayBuffer();
  const source = await PDFDocument.load(bytes);
  const totalPages = source.getPageCount();

  const zip = new JSZip();

  for (let index = 0; index < totalPages; index++) {
    const result = await PDFDocument.create();

    const [page] = await result.copyPages(source, [index]);

    result.addPage(page);

    const output = await result.save();

    zip.file(
      `page-${String(index + 1).padStart(3, "0")}.pdf`,
      output
    );
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
  });

  return {
    blob,
    filename: "PDFEditor-split-pages.zip",
  };
}