
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileImage,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import PDFPreview from "../../components/pdf/PDFPreview";

import { getPdfPageCount } from "../../services/pdf/splitPdf";
import {
  pdfToImages,
  type ImageFormat,
} from "../../services/pdf/pdfToImage";

import "./PDFToImage.css";

export default function PDFToImage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(0.9);

  const [reading, setReading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (selected?: File) => {
    if (!selected || processing) return;

    const currentRequest = ++requestId.current;

    setFile(null);
    setTotalPages(0);
    setSelectedPages([]);
    setError("");
    setReading(true);

    try {
      if (
        selected.type !== "application/pdf" &&
        !selected.name.toLowerCase().endsWith(".pdf")
      ) {
        throw new Error("Please upload a valid PDF file.");
      }

      const count = await getPdfPageCount(selected);

      if (currentRequest !== requestId.current) return;

      if (count === 0) {
        throw new Error("This PDF has no pages.");
      }

      setFile(selected);
      setTotalPages(count);

      // Select every page by default.
      setSelectedPages(
        Array.from({ length: count }, (_, index) => index + 1)
      );
    } catch (err) {
      if (currentRequest !== requestId.current) return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to read this PDF."
      );
    } finally {
      if (currentRequest === requestId.current) {
        setReading(false);
      }
    }
  };

  const clearFile = () => {
    if (processing) return;

    ++requestId.current;

    setFile(null);
    setTotalPages(0);
    setSelectedPages([]);
    setReading(false);
    setError("");
  };

  const handleConvert = async () => {
    if (!file || processing || selectedPages.length === 0) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const result = await pdfToImages(file, {
        format,
        scale,
        quality,
        pages: selectedPages,
      });

      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = result.filename;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to convert PDF pages."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pdf-image-page">
  
      <main className="pdf-image-container">
        <Link to="/" className="pdf-image-back">
          <ArrowLeft size={16} />
          All PDF Tools
        </Link>

        <div className="pdf-image-heading">
          <div className="pdf-image-heading-icon">
            <FileImage size={28} />
          </div>

          <h1>PDF to JPG / PNG</h1>

          <p>
            Convert PDF pages into high-quality images.
            Choose pages, resolution, and format.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {!file && (
          <div
            className={`pdf-image-dropzone ${
              dragging ? "dragging" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void handleFile(event.dataTransfer.files[0]);
            }}
          >
            <UploadCloud size={44} />

            <h2>Upload a PDF</h2>
            <p>Drag and drop your PDF here.</p>

            <button
              type="button"
              disabled={reading}
              onClick={() => inputRef.current?.click()}
            >
              {reading ? "Reading PDF..." : "Select PDF File"}
            </button>
          </div>
        )}

        {file && (
          <>
            <div className="pdf-image-file">
              <div className="pdf-image-file-icon">
                <FileText size={25} />
              </div>

              <div className="pdf-image-file-info">
                <strong>{file.name}</strong>
                <span>
                  {totalPages} pages ·{" "}
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <button
                type="button"
                aria-label="Remove PDF"
                onClick={clearFile}
                disabled={processing}
              >
                <X size={18} />
              </button>
            </div>

            <section className="pdf-image-settings">
              <h2>Export Settings</h2>

              <div className="pdf-image-settings-grid">
                <label>
                  Image Format
                  <select
                    value={format}
                    onChange={(event) =>
                      setFormat(
                        event.target.value as ImageFormat
                      )
                    }
                  >
                    <option value="jpeg">JPG</option>
                    <option value="png">PNG</option>
                  </select>
                </label>

                <label>
                  Resolution
                  <select
                    value={scale}
                    onChange={(event) =>
                      setScale(Number(event.target.value))
                    }
                  >
                    <option value={1}>Standard (1x)</option>
                    <option value={1.5}>Medium (1.5x)</option>
                    <option value={2}>High (2x)</option>
                    <option value={3}>Very High (3x)</option>
                  </select>
                </label>

                <label>
                  JPG Quality
                  <select
                    value={quality}
                    disabled={format === "png"}
                    onChange={(event) =>
                      setQuality(Number(event.target.value))
                    }
                  >
                    <option value={0.7}>70% - Smaller</option>
                    <option value={0.85}>85% - Balanced</option>
                    <option value={0.9}>90% - High</option>
                    <option value={1}>100% - Maximum</option>
                  </select>
                </label>
              </div>
            </section>

            <PDFPreview
              file={file}
              selectedPages={selectedPages}
              onSelectionChange={(pages) => {
                if (!processing) {
                  setSelectedPages(pages);
                  setError("");
                }
              }}
            />

            <div className="pdf-image-bottom">
              <div>
                <strong>
                  {selectedPages.length} of {totalPages} pages selected
                </strong>
                <p>
                  Selected pages will be exported as images
                  inside a ZIP file.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  processing || selectedPages.length === 0
                }
                onClick={() => void handleConvert()}
              >
                {processing ? (
                  <>
                    <Loader2
                      size={18}
                      className="pdf-image-spinner"
                    />
                    Converting...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Convert & Download
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="pdf-image-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
