
import JSZip from "jszip";
import { loadPdf } from "./pdfRenderer";

export type ImageFormat = "jpeg" | "png";

export interface PdfToImageOptions {
  format: ImageFormat;
  scale: number;
  quality: number;
  pages: number[];
}

export interface PdfToImageResult {
  blob: Blob;
  filename: string;
  count: number;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image export failed."));
      },
      type,
      quality
    );
  });
}

export async function pdfToImages(
  file: File,
  options: PdfToImageOptions
): Promise<PdfToImageResult> {
  if (options.pages.length === 0) {
    throw new Error("Select at least one page.");
  }

  if (
    !Number.isFinite(options.scale) ||
    options.scale <= 0 ||
    options.scale > 4
  ) {
    throw new Error("Invalid image resolution.");
  }

  const pdf = await loadPdf(file);

  try {
    const selectedPages = [...new Set(options.pages)].sort(
      (a, b) => a - b
    );

    if (
      selectedPages.some(
        (page) =>
          !Number.isInteger(page) ||
          page < 1 ||
          page > pdf.numPages
      )
    ) {
      throw new Error("Invalid page selection.");
    }

    const zip = new JSZip();

    const extension =
      options.format === "jpeg" ? "jpg" : "png";

    const mimeType =
      options.format === "jpeg"
        ? "image/jpeg"
        : "image/png";

    for (const pageNumber of selectedPages) {
      const page = await pdf.getPage(pageNumber);

      const viewport = page.getViewport({
        scale: options.scale,
      });

      const canvas = document.createElement("canvas");

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas is not supported.");
      }

      // White background for consistent JPG exports.
      context.fillStyle = "#ffffff";
      context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      try {
        await page.render({
          canvas,
          canvasContext: context,
          viewport,
          background: "#ffffff",
        }).promise;

        const imageBlob = await canvasToBlob(
          canvas,
          mimeType,
          options.quality
        );

        zip.file(
          `page-${String(pageNumber).padStart(3, "0")}.${extension}`,
          imageBlob
        );
      } finally {
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }
    }

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
    });

    return {
      blob,
      filename: `PDFEditor-${extension}-images.zip`,
      count: selectedPages.length,
    };
  } finally {
    await pdf.cleanup();
  }
}
