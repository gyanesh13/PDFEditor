
import { PDFDocument } from "pdf-lib";

export async function organizePdf(
  file: File,
  pageOrder: number[]
): Promise<Blob> {
  if (pageOrder.length === 0) {
    throw new Error("Please keep at least one page.");
  }

  const sourceBytes = await file.arrayBuffer();
  const source = await PDFDocument.load(sourceBytes);

  const totalPages = source.getPageCount();

  if (
    new Set(pageOrder).size !== pageOrder.length ||
    pageOrder.some(
      (page) =>
        !Number.isInteger(page) ||
        page < 1 ||
        page > totalPages
    )
  ) {
    throw new Error("Invalid page selection or order.");
  }

  const output = await PDFDocument.create();

  const copiedPages = await output.copyPages(
    source,
    pageOrder.map((page) => page - 1)
  );

  copiedPages.forEach((page) => output.addPage(page));

  const bytes = await output.save();

  return new Blob([new Uint8Array(bytes)], {
    type: "application/pdf",
  });
}
