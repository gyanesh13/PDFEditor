
import { degrees, PDFDocument } from "pdf-lib";

export interface PageRotation {
  pageNumber: number;
  rotation: number;
}

export async function rotatePdf(
  file: File,
  rotations: PageRotation[]
): Promise<Blob> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);

  const totalPages = pdf.getPageCount();

  for (const { pageNumber, rotation } of rotations) {
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > totalPages ||
      !Number.isInteger(rotation) ||
      rotation % 90 !== 0
    ) {
      throw new Error("Invalid page rotation.");
    }

    const page = pdf.getPage(pageNumber - 1);
    const original = page.getRotation().angle;

    const finalAngle =
      ((original + rotation) % 360 + 360) % 360;

    page.setRotation(degrees(finalAngle));
  }

  const output = await pdf.save();

  return new Blob([new Uint8Array(output)], {
    type: "application/pdf",
  });
}
