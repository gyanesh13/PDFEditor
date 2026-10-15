
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Scissors,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";
import PDFPreview from "../../components/pdf/PDFPreview";

import {
  extractPdfPages,
  getPdfPageCount,
  parsePageRanges,
  splitEveryPage,
  type SplitMode,
} from "../../services/pdf/splitPdf";

import "./SplitPDF.css";

export default function SplitPDF() {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const [mode, setMode] = useState<SplitMode>("extract");
  const [range, setRange] = useState("");

  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  // Convert page selection into a range string
  const updateSelectedPages = (pages: number[]) => {
    const sorted = [...new Set(pages)].sort((a, b) => a - b);

    setSelectedPages(sorted);
    setRange(sorted.join(","));
    setError("");
  };

  // Handle manually entered page ranges
  const handleRangeChange = (value: string) => {
    setRange(value);
    setError("");

    try {
      const pages = parsePageRanges(value, totalPages);
      setSelectedPages(pages.map((page) => page + 1));
    } catch {
      // Allow incomplete input while user is typing
      setSelectedPages([]);
    }
  };

  // Handle uploaded PDF
  const handleFile = async (selected?: File) => {
    if (!selected) return;

    const currentRequest = ++requestId.current;

    setFile(null);
    setTotalPages(0);
    setSelectedPages([]);
    setRange("");
    setError("");

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setReading(false);
      setError("Please select a valid PDF file.");
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

      const pages = Array.from(
        { length: count },
        (_, index) => index + 1
      );

      setSelectedPages(pages);
      setRange(`1-${count}`);
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

  // Remove current PDF
  const clearFile = () => {
    ++requestId.current;

    setFile(null);
    setTotalPages(0);
    setSelectedPages([]);
    setRange("");
    setError("");
    setReading(false);
  };

  // Download generated file
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

  // Split or extract PDF
  const handleSplit = async () => {
    if (!file || loading) return;

    setError("");

    if (mode === "extract") {
      try {
        parsePageRanges(range, totalPages);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Invalid page selection."
        );
        return;
      }
    }

    setLoading(true);

    try {
      const result =
        mode === "extract"
          ? await extractPdfPages(file, range)
          : await splitEveryPage(file);

      downloadBlob(result.blob, result.filename);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process the PDF."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-page">
      <main className="split-container">
        {/* Back Navigation */}
        <Link to="/" className="split-back">
          <ArrowLeft size={16} />
          All PDF Tools
        </Link>

        {/* Page Heading */}
        <div className="split-heading">
          <div className="split-heading-icon">
            <Scissors size={28} />
          </div>

          <h1>Split PDF Files</h1>

          <p>
            Extract selected pages or split your PDF
            into individual documents.
          </p>
        </div>

        {/* Hidden File Input */}
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
            className={`split-dropzone ${
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

            <h2>Upload a PDF to Split</h2>

            <p>Drag and drop your PDF file here</p>

            <button
              type="button"
              className="split-select-btn"
              disabled={reading}
              onClick={() => inputRef.current?.click()}
            >
              {reading ? "Reading PDF..." : "Select PDF File"}
            </button>
          </div>
        )}

        {/* Uploaded File */}
        {file && (
          <>
            <div className="split-file-card">
              <div className="split-file-icon">
                <FileText size={26} />
              </div>

              <div className="split-file-info">
                <strong>{file.name}</strong>

                <span>
                  {totalPages} pages ·{" "}
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <button
                type="button"
                className="split-remove-btn"
                aria-label="Remove PDF"
                disabled={loading}
                onClick={clearFile}
              >
                <Trash2 size={19} />
              </button>
            </div>

            {/* Split Options */}
            <section className="split-options">
              <h2>Choose Split Method</h2>

              <div className="split-mode-grid">
                <button
                  type="button"
                  className={`split-mode-card ${
                    mode === "extract" ? "active" : ""
                  }`}
                  onClick={() => setMode("extract")}
                  disabled={loading}
                >
                  <FileText size={25} />

                  <strong>Extract Pages</strong>

                  <span>
                    Select specific pages or ranges
                  </span>
                </button>

                <button
                  type="button"
                  className={`split-mode-card ${
                    mode === "every-page" ? "active" : ""
                  }`}
                  onClick={() => setMode("every-page")}
                  disabled={loading}
                >
                  <Scissors size={25} />

                  <strong>Split Every Page</strong>

                  <span>
                    Create a separate PDF for each page
                  </span>
                </button>
              </div>

              {/* Page Range Input */}
              {mode === "extract" && (
                <div className="split-range-section">
                  <label htmlFor="page-range">
                    Pages to extract
                  </label>

                  <input
                    id="page-range"
                    type="text"
                    value={range}
                    disabled={loading}
                    onChange={(event) =>
                      handleRangeChange(event.target.value)
                    }
                    placeholder="Example: 1-3,5,8-10"
                  />

                  <p>
                    Enter page numbers separated by commas,
                    or use a hyphen for ranges.
                    Available pages: 1-{totalPages}.
                  </p>
                </div>
              )}

              {/* Split Every Page Info */}
              {mode === "every-page" && (
                <div className="split-info">
                  Your {totalPages}-page document will
                  generate {totalPages} separate PDF files
                  in a ZIP archive.
                </div>
              )}
            </section>

            {/* PDF Preview With Thumbnails */}
            {mode === "extract" && (
              <PDFPreview
                file={file}
                selectedPages={selectedPages}
                onSelectionChange={updateSelectedPages}
              />
            )}
          </>
        )}

        {/* Error Message */}
        {error && (
          <p className="split-error" role="alert">
            {error}
          </p>
        )}

        {/* Bottom Action */}
        {file && (
          <div className="split-bottom">
            <p>
              Your PDF is processed locally in your browser.
            </p>

            <button
              type="button"
              className="split-action-btn"
              disabled={
                loading ||
                (mode === "extract" && !range.trim())
              }
              onClick={handleSplit}
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="split-spinner"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <Download size={18} />
                  {mode === "extract"
                    ? "Extract Pages"
                    : "Split PDF"}
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
