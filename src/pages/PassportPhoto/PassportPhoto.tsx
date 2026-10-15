
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { PDFDocument } from "pdf-lib";
import {
  Camera,
  Download,
  FileImage,
  ImagePlus,
  Printer,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import "./PassportPhoto.css";

type PhotoSize = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
};

type Layout = {
  rotated: boolean;
  columns: number;
  rows: number;
  capacity: number;
  cellWidthMm: number;
  cellHeightMm: number;
  startXmm: number;
  startYmm: number;
};

const DPI = 300;
const MARGIN_MM = 2;
const GAP_MM = 2;
const MAX_FILE_MB = 15;


type PaperSize = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
};

const PAPER_SIZES: PaperSize[] = [
  {
    id: "4x6",
    label: "4 × 6 inch",
    widthMm: 101.6,
    heightMm: 152.4,
  },
  {
    id: "5x7",
    label: "5 × 7 inch",
    widthMm: 127,
    heightMm: 177.8,
  },
  {
    id: "a4",
    label: "A4",
    widthMm: 210,
    heightMm: 297,
  },
  {
    id: "a5",
    label: "A5",
    widthMm: 148,
    heightMm: 210,
  },
  {
    id: "letter",
    label: "US Letter",
    widthMm: 215.9,
    heightMm: 279.4,
  },
];

const PHOTO_SIZES: PhotoSize[] = [
  {
    id: "35x45",
    label: "35 × 45 mm",
    widthMm: 35,
    heightMm: 45,
  },
  {
    id: "2x2",
    label: "2 × 2 inch",
    widthMm: 50.8,
    heightMm: 50.8,
  },
  {
    id: "30x40",
    label: "30 × 40 mm",
    widthMm: 30,
    heightMm: 40,
  },
  {
    id: "25x35",
    label: "25 × 35 mm",
    widthMm: 25,
    heightMm: 35,
  },
  {
    id: "20x30",
    label: "20 × 30 mm (Mini)",
    widthMm: 20,
    heightMm: 30,
  },
];

const mmToPixels = (mm: number) =>
  Math.round((mm / 25.4) * DPI);


function getLayout(
  size: PhotoSize,
  paper: PaperSize
): Layout {
  const options = [false, true].map((rotated) => {
    const cellWidthMm = rotated
      ? size.heightMm
      : size.widthMm;

    const cellHeightMm = rotated
      ? size.widthMm
      : size.heightMm;

    const usableWidth =
      paper.widthMm - MARGIN_MM * 2;

    const usableHeight =
      paper.heightMm - MARGIN_MM * 2;

    const columns = Math.max(
      0,
      Math.floor(
        (usableWidth + GAP_MM + 0.00001) /
          (cellWidthMm + GAP_MM)
      )
    );

    const rows = Math.max(
      0,
      Math.floor(
        (usableHeight + GAP_MM + 0.00001) /
          (cellHeightMm + GAP_MM)
      )
    );

    const gridWidth =
      columns * cellWidthMm +
      Math.max(0, columns - 1) * GAP_MM;

    const gridHeight =
      rows * cellHeightMm +
      Math.max(0, rows - 1) * GAP_MM;

    return {
      rotated,
      columns,
      rows,
      capacity: columns * rows,
      cellWidthMm,
      cellHeightMm,
      startXmm: (paper.widthMm - gridWidth) / 2,
      startYmm: (paper.heightMm - gridHeight) / 2,
    };
  });

  return options[1].capacity > options[0].capacity
    ? options[1]
    : options[0];
}


function createPassportCanvas(
  image: HTMLImageElement,
  size: PhotoSize,
  zoom: number,
  panX: number,
  panY: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  canvas.width = mmToPixels(size.widthMm);
  canvas.height = mmToPixels(size.heightMm);

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const aspectRatio =
    size.widthMm / size.heightMm;

  const baseCropHeight = Math.min(
    image.naturalHeight,
    image.naturalWidth / aspectRatio
  );

  const baseCropWidth =
    baseCropHeight * aspectRatio;

  const cropWidth = baseCropWidth / zoom;
  const cropHeight = baseCropHeight / zoom;

  const sourceX =
    (image.naturalWidth - cropWidth) *
    (panX / 100);

  const sourceY =
    (image.naturalHeight - cropHeight) *
    (panY / 100);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas;
}

function createPrintSheet(
  passportCanvas: HTMLCanvasElement,
  layout: Layout,
  photoCount: number,
  paper: PaperSize
): HTMLCanvasElement {
  const sheet = document.createElement("canvas");

  sheet.width = mmToPixels(paper.widthMm);
  sheet.height = mmToPixels(paper.heightMm);

  const ctx = sheet.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const width = mmToPixels(layout.cellWidthMm);
  const height = mmToPixels(layout.cellHeightMm);

  for (let index = 0; index < photoCount; index++) {
    const column = index % layout.columns;
    const row = Math.floor(
      index / layout.columns
    );

    const x = mmToPixels(
      layout.startXmm +
        column *
          (layout.cellWidthMm + GAP_MM)
    );

    const y = mmToPixels(
      layout.startYmm +
        row *
          (layout.cellHeightMm + GAP_MM)
    );

    if (layout.rotated) {
      ctx.save();

      ctx.translate(x + width, y);
      ctx.rotate(Math.PI / 2);

      ctx.drawImage(
        passportCanvas,
        0,
        0,
        height,
        width
      );

      ctx.restore();
    } else {
      ctx.drawImage(
        passportCanvas,
        x,
        y,
        width,
        height
      );
    }
  }

  return sheet;
}

function downloadBlob(
  blob: Blob,
  fileName: string
) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 3000);
}

function canvasToBlob(
  canvas: HTMLCanvasElement
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(
            new Error("Could not generate image")
          );
        }
      },
      "image/jpeg",
      0.95
    );
  });
}

export default function PassportPhoto() {
  const [image, setImage] =
    useState<HTMLImageElement | null>(null);

  const [fileName, setFileName] = useState("");

  const [sizeId, setSizeId] = useState("35x45");
  const [quantity, setQuantity] = useState(8);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(50);
  const [panY, setPanY] = useState(50);
  const [paperId, setPaperId] = useState("4x6");
  const [photoPreview, setPhotoPreview] =
    useState("");

  const [sheetPreview, setSheetPreview] =
    useState("");

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] = useState("");

  const uploadIdRef = useRef(0);

  const selectedSize =
    PHOTO_SIZES.find(
      (item) => item.id === sizeId
    ) ?? PHOTO_SIZES[0];

  const selectedPaper =
    PAPER_SIZES.find((paper) => paper.id === paperId) ??
    PAPER_SIZES[0];

  const layout = useMemo(
    () => getLayout(selectedSize, selectedPaper),
    [selectedSize, selectedPaper]
  );

  const totalSheets = layout.capacity
    ? Math.ceil(quantity / layout.capacity)
    : 0;

  useEffect(() => {
    return () => {
      uploadIdRef.current++;
    };
  }, []);

  useEffect(() => {
    if (!image) {
      setPhotoPreview("");
      setSheetPreview("");
      return;
    }

    try {
      const photo = createPassportCanvas(
        image,
        selectedSize,
        zoom,
        panX,
        panY
      );

      const sheet = createPrintSheet(
        photo,
        layout,
        Math.min(quantity, layout.capacity),
        selectedPaper
      );

      setPhotoPreview(
        photo.toDataURL("image/jpeg", 0.9)
      );

      setSheetPreview(
        sheet.toDataURL("image/jpeg", 0.85)
      );

      setError("");
    } catch {
      setError("Unable to generate preview.");
    }
  }, [
    image,
    selectedSize,
    quantity,
    zoom,
    panX,
    panY,
    layout,
    selectedPaper,
  ]);

  const handleUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const requestId = ++uploadIdRef.current;

    setError("");
    setImage(null);
    setPhotoPreview("");
    setSheetPreview("");

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setError(
        "Please upload a JPG, PNG or WebP image."
      );
      return;
    }

    if (
      file.size >
      MAX_FILE_MB * 1024 * 1024
    ) {
      setError(
        `Maximum image size is ${MAX_FILE_MB} MB.`
      );
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const picture = new Image();

    picture.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (requestId !== uploadIdRef.current) {
        return;
      }

      setImage(picture);
      setFileName(file.name);
      setZoom(1);
      setPanX(50);
      setPanY(50);
    };

    picture.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      if (requestId === uploadIdRef.current) {
        setError("Could not read this image.");
      }
    };

    picture.src = objectUrl;
  };

  const resetCrop = () => {
    setZoom(1);
    setPanX(50);
    setPanY(50);
  };

  const getPhotoCanvas = () => {
    if (!image) {
      throw new Error("Please upload a photo");
    }

    return createPassportCanvas(
      image,
      selectedSize,
      zoom,
      panX,
      panY
    );
  };

  const downloadSinglePhoto = async () => {
    try {
      setError("");
      setProcessing(true);

      const canvas = getPhotoCanvas();
      const blob = await canvasToBlob(canvas);

      downloadBlob(
        blob,
        `passport-photo-${sizeId}.jpg`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Download failed"
      );
    } finally {
      setProcessing(false);
    }
  };

  const downloadPrintPdf = async () => {
    if (!image || !layout.capacity) return;

    try {
      setError("");
      setProcessing(true);

      const passportCanvas = getPhotoCanvas();

      const pdf = await PDFDocument.create();

      for (
        let sheetIndex = 0;
        sheetIndex < totalSheets;
        sheetIndex++
      ) {
        const remaining =
          quantity - sheetIndex * layout.capacity;

        const copiesOnSheet = Math.min(
          remaining,
          layout.capacity
        );

        const sheetCanvas = createPrintSheet(
          passportCanvas,
          layout,
          copiesOnSheet,
          selectedPaper
        );

        const imageData = sheetCanvas.toDataURL(
          "image/jpeg",
          0.95
        );

        const embedded =
          await pdf.embedJpg(imageData);

        // Create PDF page with actual selected paper dimensions.
        const pageWidthPt = (selectedPaper.widthMm / 25.4) * 72;
        const pageHeightPt = (selectedPaper.heightMm / 25.4) * 72;
        const page = pdf.addPage([pageWidthPt, pageHeightPt]);

        page.drawImage(embedded, {
          x: 0,
          y: 0,
          width: pageWidthPt,
          height: pageHeightPt,
        });
      }

      const bytes = await pdf.save();

      const outputBuffer = new ArrayBuffer(
        bytes.byteLength
      );

      new Uint8Array(outputBuffer).set(bytes);

      const blob = new Blob(
        [outputBuffer],
        { type: "application/pdf" }
      );

      downloadBlob(
        blob,
        `passport-${quantity}-photos-${paperId}.pdf`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "PDF generation failed"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDirectPrint = () => {
    if (!image || !layout.capacity || processing) return;

    setError("");

    // Open immediately inside the click handler to avoid popup blockers.
    const printWindow = window.open("", "_blank", "width=900,height=750");

    if (!printWindow) {
      setError("Please allow pop-ups to print your photo sheets.");
      return;
    }

    setProcessing(true);

    try {
      const passportCanvas = getPhotoCanvas();
      const sheetImages: string[] = [];

      for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
        const remaining = quantity - sheetIndex * layout.capacity;
        const copiesOnSheet = Math.min(remaining, layout.capacity);
        const sheet = createPrintSheet(
          passportCanvas,
          layout,
          copiesOnSheet,
          selectedPaper
        );
        sheetImages.push(sheet.toDataURL("image/jpeg", 0.95));
      }

      // Paper dimensions and image URLs are derived only from fixed options
      // and locally generated canvases (no user-supplied HTML).
      const { widthMm, heightMm } = selectedPaper;
      const pageHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Print Passport Photos</title>
  <style>
    @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { background: #eef2f7; }
    .print-toolbar {
      padding: 15px; text-align: center; background: #fff;
      font: 14px Arial, sans-serif; color: #334155;
    }
    .print-toolbar button {
      border: 0; border-radius: 8px; padding: 10px 22px;
      background: #16a34a; color: white; font-size: 14px;
      font-weight: bold; cursor: pointer;
    }
    .print-toolbar p { margin: 10px 0 0; line-height: 1.5; }
    .print-sheet {
      width: ${widthMm}mm; height: ${heightMm}mm;
      margin: 15px auto; background: #fff;
      overflow: hidden; break-inside: avoid; page-break-inside: avoid;
    }
    .print-sheet:not(:last-child) {
      break-after: page; page-break-after: always;
    }
    .print-sheet img { display: block; width: 100%; height: 100%; }
    @media print {
      html, body { background: white; }
      .print-toolbar { display: none !important; }
      .print-sheet { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <button type="button" onclick="window.print()">Print Photos</button>
    <p>Choose ${selectedPaper.label}, Actual Size / 100% and disable Fit to Page.</p>
  </div>
  ${sheetImages
    .map((src) => `<div class="print-sheet"><img src="${src}" alt="Photo sheet" /></div>`)
    .join("\n")}
</body>
</html>`;

      printWindow.addEventListener(
        "load",
        () => {
          // Wait until the high-resolution sheet images have loaded.
          Promise.all(
            Array.from(printWindow.document.images).map((img) =>
              img.decode().catch(() => undefined)
            )
          ).then(() => {
            if (!printWindow.closed) {
              printWindow.focus();
              printWindow.print();
            }
          });
        },
        { once: true }
      );

      printWindow.document.open();
      printWindow.document.write(pageHtml);
      printWindow.document.close();
    } catch (err) {
      printWindow.close();
      setError(
        err instanceof Error ? err.message : "Could not prepare print sheets."
      );
    } finally {
      setProcessing(false);
    }
  };

  const isLowResolution = useMemo(() => {
    if (!image) return false;

    const aspectRatio =
      selectedSize.widthMm /
      selectedSize.heightMm;

    const baseHeight = Math.min(
      image.naturalHeight,
      image.naturalWidth / aspectRatio
    );

    const baseWidth =
      baseHeight * aspectRatio;

    return (
      baseWidth / zoom <
        mmToPixels(selectedSize.widthMm) ||
      baseHeight / zoom <
        mmToPixels(selectedSize.heightMm)
    );
  }, [image, selectedSize, zoom]);

  return (
    <main className="passport-page">
      <section className="passport-hero">
        <span className="passport-tag">
          <Sparkles size={15} />
          Free Photo Tool
        </span>

        <h1>Passport Size Photo Maker</h1>

        <p>
          Upload your picture, adjust the crop,
          and print passport photos on your choice
          of paper size in just a few clicks.
        </p>
      </section>

      <div className="passport-workspace">
        {/* LEFT PANEL */}
        <section className="passport-controls">
          <div className="passport-section">
            <h2>
              <ImagePlus size={20} />
              1. Upload your photo
            </h2>

            <label className="passport-upload">
              <Camera size={32} />

              <strong>
                {fileName || "Choose a photo"}
              </strong>

              <span>
                JPG, PNG or WebP · Max 15 MB
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUpload}
                disabled={processing}
              />
            </label>
          </div>

          <div className="passport-section">
            <h2>2. Choose photo size</h2>

            <div className="passport-size-grid">
              {PHOTO_SIZES.map((size) => (
                <button
                  type="button"
                  key={size.id}
                  className={`passport-size-option ${
                    sizeId === size.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSizeId(size.id)}
                  disabled={processing}
                >
                  {size.label}
                </button>
              ))}
            </div>

            <p className="passport-hint">
              Check the size specified by your
              passport, visa or application form.
            </p>
          </div>

          <div className="passport-section">
            <div className="passport-heading-row">
              <h2>3. Adjust the crop</h2>

              <button
                type="button"
                className="passport-reset"
                onClick={resetCrop}
                disabled={!image || processing}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>

            {photoPreview ? (
              <div className="passport-crop-box">
                <img
                  src={photoPreview}
                  alt="Passport photo crop preview"
                />
              </div>
            ) : (
              <div className="passport-empty-crop">
                <Camera size={34} />
                <span>Photo preview</span>
              </div>
            )}

            <div className="passport-slider">
              <label htmlFor="passport-zoom">
                Zoom
              </label>

              <input
                id="passport-zoom"
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(event) =>
                  setZoom(Number(event.target.value))
                }
                disabled={!image || processing}
              />
            </div>

            <div className="passport-slider">
              <label htmlFor="passport-horizontal">
                Horizontal position
              </label>

              <input
                id="passport-horizontal"
                type="range"
                min="0"
                max="100"
                value={panX}
                onChange={(event) =>
                  setPanX(Number(event.target.value))
                }
                disabled={!image || processing}
              />
            </div>

            <div className="passport-slider">
              <label htmlFor="passport-vertical">
                Vertical position
              </label>

              <input
                id="passport-vertical"
                type="range"
                min="0"
                max="100"
                value={panY}
                onChange={(event) =>
                  setPanY(Number(event.target.value))
                }
                disabled={!image || processing}
              />
            </div>

            {isLowResolution && (
              <p className="passport-warning">
                Your image may look soft when printed
                at 300 DPI. A higher-resolution photo
                will give better results.
              </p>
            )}
          </div>

          <div className="passport-section">
            <h2>
              <Printer size={20} />
              4. Print settings
            </h2>

            <label className="passport-field-label">
              Select paper size
            </label>
            <div className="passport-size-grid" style={{ marginBottom: 20 }}>
              {PAPER_SIZES.map((paper) => (
                <button
                  type="button"
                  key={paper.id}
                  className={`passport-size-option ${
                    paperId === paper.id ? "selected" : ""
                  }`}
                  onClick={() => setPaperId(paper.id)}
                  disabled={processing}
                  aria-pressed={paperId === paper.id}
                >
                  {paper.label}
                </button>
              ))}
            </div>

            <label
              className="passport-field-label"
              htmlFor="passport-quantity"
            >
              Number of photos
            </label>

            <div className="passport-quantity-options">
              {[4, 8, 12, 16, 24, 32].map(
                (count) => (
                  <button
                    type="button"
                    key={count}
                    className={
                      quantity === count
                        ? "selected"
                        : ""
                    }
                    disabled={processing}
                    onClick={() =>
                      setQuantity(count)
                    }
                  >
                    {count}
                  </button>
                )
              )}
            </div>

            <input
              id="passport-quantity"
              className="passport-quantity-input"
              type="number"
              min={1}
              max={120}
              value={quantity}
              disabled={processing}
              onChange={(event) =>
                setQuantity(
                  Math.min(
                    120,
                    Math.max(
                      1,
                      Number(event.target.value) || 1
                    )
                  )
                )
              }
            />

            <div className="passport-print-summary">
              <div>
                <span>Paper</span>
                <strong>{selectedPaper.label}</strong>
              </div>

              <div>
                <span>Resolution</span>
                <strong>300 DPI</strong>
              </div>

              <div>
                <span>Photos per sheet</span>
                <strong>{layout.capacity}</strong>
              </div>

              <div>
                <span>Total sheets</span>
                <strong>{totalSheets}</strong>
              </div>

              <div>
                <span>Layout</span>
                <strong>
                  {layout.rotated
                    ? "Auto rotated"
                    : "Portrait"}
                </strong>
              </div>
            </div>
          </div>

          {error && (
            <p
              className="passport-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            className="passport-download-primary"
            disabled={!image || processing}
            onClick={() => void downloadPrintPdf()}
          >
            <Download size={19} />

            {processing
              ? "Generating..."
              : `Download ${totalSheets} Print Sheet${
                  totalSheets === 1 ? "" : "s"
                } (PDF)`}
          </button>

          <button
            type="button"
            className="passport-download-primary"
            style={{ marginTop: 11, background: "#16a34a", borderColor: "#16a34a" }}
            disabled={!image || processing}
            onClick={handleDirectPrint}
          >
            <Printer size={19} />
            Print Directly
          </button>

          <button
            type="button"
            className="passport-download-secondary"
            disabled={!image || processing}
            onClick={() =>
              void downloadSinglePhoto()
            }
          >
            <FileImage size={18} />
            Download Single Photo (JPG)
          </button>
        </section>

        {/* RIGHT PANEL */}
        <section className="passport-preview-panel">
          <div className="passport-preview-header">
            <h2>Live Print Preview</h2>

            <span>{selectedPaper.label}</span>
          </div>

          <div className="passport-sheet-stage">
            {sheetPreview ? (
              <img
                className="passport-sheet-image"
                src={sheetPreview}
                alt={`${selectedPaper.label} print sheet preview`}
                style={{
                  aspectRatio: `${selectedPaper.widthMm} / ${selectedPaper.heightMm}`,
                  maxWidth: selectedPaper.widthMm > 180 ? 330 : 295,
                }}
              />
            ) : (
              <div
                className="passport-sheet-placeholder"
                style={{
                  aspectRatio: `${selectedPaper.widthMm} / ${selectedPaper.heightMm}`,
                }}
              >
                <Camera size={40} />
                <p>
                  Your printable sheet will
                  appear here
                </p>
              </div>
            )}
          </div>

          <div className="passport-preview-info">
            <div>
              <span>Selected photo size</span>
              <strong>{selectedSize.label}</strong>
            </div>

            <div>
              <span>Sheet layout</span>
              <strong>
                {layout.columns} columns ×{" "}
                {layout.rows} rows
              </strong>
            </div>

            <div>
              <span>Requested quantity</span>
              <strong>{quantity} photos</strong>
            </div>

            <div>
              <span>Print sheets</span>
              <strong>{totalSheets} pages</strong>
            </div>
          </div>

          <p className="passport-print-tip">
            Print at <strong>Actual Size / 100%</strong>
            {" "}on {selectedPaper.label} paper. Disable
            "Fit to Page" to preserve dimensions.
            The preview shows the first sheet;
            the PDF contains all sheets.
          </p>
        </section>
      </div>
    </main>
  );
}
