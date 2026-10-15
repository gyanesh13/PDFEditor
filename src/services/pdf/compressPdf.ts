
import { PDFDocument } from "pdf-lib";

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercentage: number;
  optimized: boolean;
}

export async function compressPdf(
  file: File
): Promise<CompressionResult> {
  const originalBytes = await file.arrayBuffer();

  const pdf = await PDFDocument.load(originalBytes, {
    updateMetadata: false,
  });

  if (pdf.getPageCount() === 0) {
    throw new Error("This PDF contains no pages.");
  }

  // Rewrite PDF using compressed object streams.
  // This is lossless structural optimization, not
  // image recompression.
  const optimizedBytes = await pdf.save({
    useObjectStreams: true,
    objectsPerTick: 50,
    updateFieldAppearances: false,
  });

  const originalSize = file.size;
  const optimizedSize = optimizedBytes.byteLength;

  // Never return a larger PDF as a "compressed" file.
  const optimized = optimizedSize < originalSize;

  const blob = optimized
    ? new Blob([new Uint8Array(optimizedBytes)], {
        type: "application/pdf",
      })
    : new Blob([originalBytes], {
        type: "application/pdf",
      });

  const compressedSize = blob.size;
  const savedBytes = originalSize - compressedSize;

  const savedPercentage =
    originalSize > 0
      ? (savedBytes / originalSize) * 100
      : 0;

  return {
    blob,
    originalSize,
    compressedSize,
    savedBytes,
    savedPercentage,
    optimized,
  };
}
