import { PDFDocument } from "pdf-lib";

export async function mergePdfFiles(files: File[]): Promise<Blob> {
  if (files.length < 2) {
    throw new Error("Please select at least 2 PDF files.");
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();

    const sourcePdf = await PDFDocument.load(bytes);

    const pages = await mergedPdf.copyPages(
      sourcePdf,
      sourcePdf.getPageIndices()
    );

    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();

  return new Blob([new Uint8Array(mergedBytes)], {
    type: "application/pdf",
  });
}