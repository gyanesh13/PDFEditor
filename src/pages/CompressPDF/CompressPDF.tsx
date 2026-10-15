
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  compressPdf,
  type CompressionResult,
} from "../../services/pdf/compressPdf";

import "./CompressPDF.css";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function CompressPDF() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] =
    useState<CompressionResult | null>(null);

  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (selected?: File) => {
    if (!selected || processing) return;

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please upload a valid PDF file.");
      return;
    }

    setFile(selected);
    setResult(null);
    setError("");
  };

  const clearFile = () => {
    if (processing) return;

    setFile(null);
    setResult(null);
    setError("");
  };

  const handleCompress = async () => {
    if (!file || processing) return;

    setProcessing(true);
    setError("");
    setResult(null);

    try {
      const output = await compressPdf(file);
      setResult(output);
    } catch (err) {
      console.error("Compression error:", err);

      setError(
        "Unable to optimize this PDF. It may be encrypted, damaged, or unsupported."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const url = URL.createObjectURL(result.blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "PDFEditor-compressed.pdf";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="compress-page">
      <main className="compress-container">
        <Link to="/" className="compress-back">
          <ArrowLeft size={16} />
          All PDF Tools
        </Link>

        {/* Heading */}
        <div className="compress-heading">
          <div className="compress-heading-icon">
            <Zap size={28} />
          </div>

          <h1>Compress PDF</h1>

          <p>
            Optimize PDF file size without intentionally
            reducing image quality.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {/* Upload */}
        {!file && (
          <div
            className={`compress-dropzone ${
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
              handleFile(event.dataTransfer.files[0]);
            }}
          >
            <UploadCloud size={46} />

            <h2>Select a PDF file</h2>

            <p>
              Drag and drop your PDF here or browse
              from your device.
            </p>

            <button
              type="button"
              className="compress-select-btn"
              onClick={() => inputRef.current?.click()}
            >
              Select PDF File
            </button>
          </div>
        )}

        {/* Uploaded File */}
        {file && (
          <>
            <div className="compress-file-card">
              <div className="compress-file-icon">
                <FileText size={27} />
              </div>

              <div className="compress-file-info">
                <strong>{file.name}</strong>
                <span>{formatSize(file.size)}</span>
              </div>

              <button
                type="button"
                className="compress-remove-btn"
                aria-label="Remove PDF"
                onClick={clearFile}
                disabled={processing}
              >
                <X size={19} />
              </button>
            </div>

            {!result && (
              <section className="compress-options">
                <h2>PDF Optimization</h2>

                <div className="compress-option-card">
                  <div className="compress-option-icon">
                    <ShieldCheck size={24} />
                  </div>

                  <div>
                    <strong>Lossless Optimization</strong>

                    <p>
                      Reorganize the PDF structure and
                      compress eligible object streams
                      without intentionally reducing
                      document quality.
                    </p>
                  </div>

                  <CheckCircle2
                    size={22}
                    className="compress-option-check"
                  />
                </div>

                <p className="compress-note">
                  Results depend on how the original PDF
                  was created. Already optimized or
                  image-heavy files may not become smaller.
                </p>
              </section>
            )}

            {/* Result */}
            {result && (
              <section className="compress-result">
                <div className="compress-result-heading">
                  <CheckCircle2 size={30} />
                  <h2>Optimization Complete</h2>

                  <p>
                    {result.optimized
                      ? "Your PDF file size has been reduced."
                      : "No smaller version was found. Your original PDF is preserved."}
                  </p>
                </div>

                <div className="compress-stats">
                  <div>
                    <span>Original Size</span>
                    <strong>
                      {formatSize(result.originalSize)}
                    </strong>
                  </div>

                  <ArrowRight
                    size={22}
                    className="compress-stats-arrow"
                  />

                  <div>
                    <span>Final Size</span>
                    <strong>
                      {formatSize(result.compressedSize)}
                    </strong>
                  </div>
                </div>

                <div className="compress-savings">
                  <strong>
                    {result.savedPercentage.toFixed(1)}%
                  </strong>
                  <span>Space Saved</span>

                  <p>
                    {formatSize(result.savedBytes)} saved
                  </p>
                </div>

                <button
                  type="button"
                  className="compress-download-btn"
                  onClick={handleDownload}
                >
                  <Download size={19} />
                  Download PDF
                </button>

                <button
                  type="button"
                  className="compress-again-btn"
                  onClick={clearFile}
                >
                  Compress Another PDF
                </button>
              </section>
            )}

            {/* Compress Button */}
            {!result && (
              <div className="compress-bottom">
                <p>
                  Your PDF is processed locally in
                  your browser.
                </p>

                <button
                  type="button"
                  className="compress-action-btn"
                  disabled={processing}
                  onClick={() => void handleCompress()}
                >
                  {processing ? (
                    <>
                      <Loader2
                        size={18}
                        className="compress-spinner"
                      />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Compress PDF
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="compress-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
