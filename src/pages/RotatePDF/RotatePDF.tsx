
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  RotateCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { PDFDocumentProxy } from "pdfjs-dist";
import PDFThumbnail from "../../components/pdf/PDFThumbnail";
import { loadPdf } from "../../services/pdf/pdfRenderer";
import {
  rotatePdf,
  type PageRotation,
} from "../../services/pdf/rotatePdf";

import "./RotatePDF.css";

export default function RotatePDF() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPdf(null);
      return;
    }

    let cancelled = false;
    let loadedPdf: PDFDocumentProxy | null = null;

    async function initialize() {
      setLoading(true);
      setError("");
      setPdf(null);

      try {
        const document = await loadPdf(file!);
        loadedPdf = document;

        if (cancelled) {
          await document.cleanup();
          return;
        }

        setPdf(document);
      } catch {
        if (!cancelled) {
          setError(
            "Unable to read this PDF. It may be encrypted or damaged."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      if (loadedPdf) void loadedPdf.cleanup();
    };
  }, [file]);

  const handleUpload = (selected?: File) => {
    if (!selected) return;

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please upload a valid PDF file.");
      return;
    }

    setRotations({});
    setError("");
    setFile(selected);
  };

  const rotatePage = (pageNumber: number, angle: number) => {
    setRotations((current) => ({
      ...current,
      [pageNumber]:
        ((current[pageNumber] ?? 0) + angle + 360) % 360,
    }));
  };

  const rotateAll = (angle: number) => {
    if (!pdf) return;

    setRotations((current) => {
      const next = { ...current };

      for (let page = 1; page <= pdf.numPages; page++) {
        next[page] =
          ((next[page] ?? 0) + angle + 360) % 360;
      }

      return next;
    });
  };

  const resetRotations = () => setRotations({});

  const handleDownload = async () => {
    if (!file || !pdf || processing) return;

    setProcessing(true);
    setError("");

    try {
      const pageRotations: PageRotation[] = Object.entries(rotations)
        .filter(([, angle]) => angle !== 0)
        .map(([page, rotation]) => ({
          pageNumber: Number(page),
          rotation,
        }));

      const blob = await rotatePdf(file, pageRotations);

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "PDFEditor-rotated.pdf";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to rotate this PDF."
      );
    } finally {
      setProcessing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPdf(null);
    setRotations({});
    setError("");
  };

  return (
    <div className="rotate-page">
      <main className="rotate-container">
        <Link to="/" className="rotate-back">
          <ArrowLeft size={16} />
          All PDF Tools
        </Link>

        <div className="rotate-heading">
          <div className="rotate-heading-icon">
            <RotateCw size={28} />
          </div>

          <h1>Rotate PDF Pages</h1>

          <p>
            Rotate individual PDF pages or rotate the
            entire document in just a few clicks.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={(event) => {
            handleUpload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {!file && (
          <div
            className={`rotate-dropzone ${
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
              handleUpload(event.dataTransfer.files[0]);
            }}
          >
            <UploadCloud size={42} />

            <h2>Upload a PDF to Rotate</h2>
            <p>Drag and drop your PDF file here</p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rotate-select-btn"
            >
              Select PDF File
            </button>
          </div>
        )}

        {loading && (
          <div className="rotate-status">
            <Loader2 size={20} className="rotate-spinner" />
            Loading PDF pages...
          </div>
        )}

        {pdf && !loading && (
          <>
            <div className="rotate-file-card">
              <div className="rotate-file-icon">
                <FileText size={25} />
              </div>

              <div className="rotate-file-info">
                <strong>{file?.name}</strong>
                <span>{pdf.numPages} pages</span>
              </div>

              <button
                type="button"
                onClick={clearFile}
                disabled={processing}
                aria-label="Remove PDF"
                className="rotate-remove-btn"
              >
                <Trash2 size={19} />
              </button>
            </div>

            <div className="rotate-toolbar">
              <div>
                <h2>Page Rotation</h2>
                <p>Use the controls to rotate pages.</p>
              </div>

              <div className="rotate-toolbar-actions">
                <button
                  type="button"
                  onClick={() => rotateAll(-90)}
                >
                  <RotateCcw size={17} />
                  Rotate All Left
                </button>

                <button
                  type="button"
                  onClick={() => rotateAll(90)}
                >
                  <RotateCw size={17} />
                  Rotate All Right
                </button>

                <button
                  type="button"
                  onClick={resetRotations}
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="rotate-grid">
              {Array.from(
                { length: pdf.numPages },
                (_, index) => {
                  const pageNumber = index + 1;
                  const angle = rotations[pageNumber] ?? 0;

                  return (
                    <div
                      key={pageNumber}
                      className="rotate-page-card"
                    >
                      <div
                        className="rotate-preview"
                        style={{
                          transform: `rotate(${angle}deg)`,
                        }}
                      >
                        <PDFThumbnail
                          pdf={pdf}
                          pageNumber={pageNumber}
                          selected={false}
                          onSelect={() => {}}
                        />
                      </div>

                      <div className="rotate-page-footer">
                        <span>Page {pageNumber}</span>
                        <span>{angle}°</span>
                      </div>

                      <div className="rotate-page-actions">
                        <button
                          type="button"
                          onClick={() =>
                            rotatePage(pageNumber, -90)
                          }
                          aria-label={`Rotate page ${pageNumber} left`}
                        >
                          <RotateCcw size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            rotatePage(pageNumber, 90)
                          }
                          aria-label={`Rotate page ${pageNumber} right`}
                        >
                          <RotateCw size={18} />
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="rotate-bottom">
              <p>
                Your document is processed locally
                in your browser.
              </p>

              <button
                type="button"
                className="rotate-download-btn"
                onClick={() => void handleDownload()}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2
                      size={18}
                      className="rotate-spinner"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download Rotated PDF
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="rotate-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
