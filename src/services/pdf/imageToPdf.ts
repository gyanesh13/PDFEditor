
import { PDFDocument, PageSizes } from "pdf-lib";

export type PageSize = "A4" | "Letter" | "Fit";
export type Orientation = "portrait" | "landscape";
export type ImageFit = "contain" | "cover";

export interface ImagePdfOptions {
  pageSize: PageSize;
  orientation: Orientation;
  fit: ImageFit;
  margin: number;
}

async function prepareImage(file: File): Promise<{
  bytes: ArrayBuffer;
  width: number;
  height: number;
}> {
  const url = URL.createObjectURL(file);

  try {
    const img = new Image();
    img.src = url;

    await img.decode();

    if (!img.naturalWidth || !img.naturalHeight) {
      throw new Error(`Cannot read ${file.name}`);
    }

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not available.");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Image conversion failed."));
        },
        "image/jpeg",
        0.92
      );
    });

    return {
      bytes: await blob.arrayBuffer(),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function imagesToPdf(
  files: File[],
  options: ImagePdfOptions
): Promise<Blob> {
  if (files.length === 0) {
    throw new Error("Please upload at least one image.");
  }

  const pdf = await PDFDocument.create();

  for (const file of files) {
    const imageData = await prepareImage(file);
    const image = await pdf.embedJpg(imageData.bytes);

    let pageWidth: number;
    let pageHeight: number;

    if (options.pageSize === "Fit") {
      pageWidth = imageData.width * 0.75;
      pageHeight = imageData.height * 0.75;
    } else {
      const dimensions =
        options.pageSize === "A4"
          ? PageSizes.A4
          : PageSizes.Letter;

      const [width, height] = dimensions;

      const landscape = options.orientation === "landscape";

      pageWidth = landscape
        ? Math.max(width, height)
        : Math.min(width, height);

      pageHeight = landscape
        ? Math.min(width, height)
        : Math.max(width, height);
    }

    const margin =
      options.pageSize === "Fit"
        ? 0
        : options.margin;

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    if (availableWidth <= 0 || availableHeight <= 0) {
      throw new Error("Margins are too large.");
    }

    const page = pdf.addPage([pageWidth, pageHeight]);

    const scaleX = availableWidth / image.width;
    const scaleY = availableHeight / image.height;

    const scale =
      options.fit === "cover"
        ? Math.max(scaleX, scaleY)
        : Math.min(scaleX, scaleY);

    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    if (options.fit === "cover") {
      // Clip overflowing image to the page bounds.
      // pdf-lib does not provide a high-level clip option,
      // so use PDF graphics operators.
      const { pushGraphicsState, popGraphicsState,
        rectangle, clip, endPath } = await import("pdf-lib");

      page.pushOperators(
        pushGraphicsState(),
        rectangle(
          margin,
          margin,
          availableWidth,
          availableHeight
        ),
        clip(),
        endPath()
      );

      page.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });

      page.pushOperators(popGraphicsState());
    } else {
      page.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }
  }

  const bytes = await pdf.save();

  return new Blob([new Uint8Array(bytes)], {
    type: "application/pdf",
  });
}
