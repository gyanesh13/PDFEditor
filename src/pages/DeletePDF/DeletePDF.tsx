
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import PDFPreview from "../../components/pdf/PDFPreview";

import { getPdfPageCount } from "../../services/pdf/SplitPdf";
import { deletePdfPages } from "../../services/pdf/deletePdf";

import "./DeletePDF.css";

export default function DeletePDF() {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const [reading, setReading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const pagesRemaining = totalPages - selectedPages.length;

  // Upload and validate PDF
  const handleFile = async (selected?: File) => {
    if (!selected) return;

    const currentRequest = ++requestId.current;

    setFile(null);
    setTotalPages(0);
    setSelectedPages([]);
    setError("");

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setReading(false);
      setError("Please upload a valid PDF file.");
      return;
    }

    setReading(true);

    try {
      const count = await getPdfPageCount(selected);

      if (currentRequest !== requestId.current) return;

      if (count === 0) {
        throw new Error("This PDF contains no pages.");
      }

      setFile(selected);
      setTotalPages(count);
      setSelectedPages([]);
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

  // Clear uploaded PDF
  const clearFile = () => {
    ++requestId.current;

    setFile(null);
    setTotalPages(0);
    setSelectedPages([]);
    setReading(false);
    setError("");
  };

  // Download PDF
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Delete selected pages
  const handleDelete = async () => {
    if (!file || processing) return;

    setError("");

    if (selectedPages.length === 0) {
      setError("Please select at least one page to delete.");
      return;
    }

    if (selectedPages.length >= totalPages) {
      setError(
        "You cannot delete all pages. Keep at least one page."
      );
      return;
    }

    setProcessing(true);

    try {
      const blob = await deletePdfPages(file, selectedPages);

      downloadBlob(blob, "PDFEditor-pages-deleted.pdf");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete PDF pages."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="delete-page">

      <main className="delete-container">
        {/* Back Navigation */}
        <Link to="/" className="delete-back">
          <ArrowLeft size={16} />
          All PDF Tools
        </Link>

        {/* Heading */}
        <div className="delete-heading">
          <div className="delete-heading-icon">
            <Trash2 size={28} />
          </div>

          <h1>Delete PDF Pages</h1>

          <p>
            Remove unwanted pages from your PDF document.
            Select the pages you want to delete and
            download the updated PDF.
          </p>
        </div>

        {/* File Input */}
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

        {/* Upload Area */}
        {!file && (
          <div
            className={`delete-dropzone ${
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
            <UploadCloud size={42} />

            <h2>Upload a PDF to Edit</h2>

            <p>Drag and drop your PDF file here</p>

            <button
              type="button"
              className="delete-select-btn"
              disabled={reading}
              onClick={() => inputRef.current?.click()}
            >
              {reading ? (
                <>
                  <Loader2 size={18} className="delete-spinner" />
                  Reading PDF...
                </>
              ) : (
                "Select PDF File"
              )}
            </button>
          </div>
        )}

        {/* File Details */}
        {file && (
          <>
            <div className="delete-file-card">
              <div className="delete-file-icon">
                <FileText size={25} />
              </div>

              <div className="delete-file-info">
                <strong>{file.name}</strong>

                <span>
                  {totalPages} pages ·{" "}
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <button
                type="button"
                className="delete-remove-btn"
                aria-label="Remove uploaded PDF"
                disabled={processing}
                onClick={clearFile}
              >
                <X size={19} />
              </button>
            </div>

            {/* Selection Summary */}
            <div className="delete-summary">
              <div>
                <span className="delete-summary-label">
                  Selected for deletion
                </span>

                <strong>{selectedPages.length}</strong>
              </div>

              <div>
                <span className="delete-summary-label">
                  Pages remaining
                </span>

                <strong>{pagesRemaining}</strong>
              </div>

              <button
                type="button"
                className="delete-clear-btn"
                onClick={() => setSelectedPages([])}
                disabled={selectedPages.length === 0 || processing}
              >
                Clear Selection
              </button>
            </div>

            {/* PDF Thumbnails */}
            <PDFPreview
              file={file}
              selectedPages={selectedPages}
              onSelectionChange={(pages) => {
                setSelectedPages(pages);
                setError("");
              }}
            />

            {/* Bottom Actions */}
            <div className="delete-bottom">
              <div className="delete-bottom-info">
                <strong>
                  {selectedPages.length} page(s) selected
                </strong>

                <p>
                  Selected pages will be permanently removed
                  from the downloaded copy.
                  Your original file stays unchanged.
                </p>
              </div>

              <button
                type="button"
                className="delete-action-btn"
                disabled={
                  processing ||
                  selectedPages.length === 0 ||
                  pagesRemaining === 0
                }
                onClick={() => void handleDelete()}
              >
                {processing ? (
                  <>
                    <Loader2
                      size={18}
                      className="delete-spinner"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Delete & Download
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <p className="delete-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
