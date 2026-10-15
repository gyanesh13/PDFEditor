
import { PDFDocument } from "pdf-lib";

export async function deletePdfPages(
  file: File,
  pagesToDelete: number[]
): Promise<Blob> {
  const sourceBytes = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(sourceBytes);

  const totalPages = sourcePdf.getPageCount();

  if (pagesToDelete.length === 0) {
    throw new Error("Please select pages to delete.");
  }

  const uniquePages = new Set(pagesToDelete);

  if (
    uniquePages.size !== pagesToDelete.length ||
    pagesToDelete.some(
      (page) =>
        !Number.isInteger(page) ||
        page < 1 ||
        page > totalPages
    )
  ) {
    throw new Error("Invalid page selection.");
  }

  if (uniquePages.size >= totalPages) {
    throw new Error(
      "You cannot delete all pages. Keep at least one page."
    );
  }

  const pagesToKeep = Array.from(
    { length: totalPages },
    (_, index) => index
  ).filter((index) => !uniquePages.has(index + 1));

  const outputPdf = await PDFDocument.create();

  const copiedPages = await outputPdf.copyPages(
    sourcePdf,
    pagesToKeep
  );

  copiedPages.forEach((page) => outputPdf.addPage(page));

  const outputBytes = await outputPdf.save();

  return new Blob([new Uint8Array(outputBytes)], {
    type: "application/pdf",
  });
}
