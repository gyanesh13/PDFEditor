
import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";
import "./PDFToWord.css"

import {
  convertPdfToWord,
  type WordConversionResult,
} from "../../services/pdf/pdfToWord";

export default function PDFToWord() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] =
    useState<WordConversionResult | null>(null);

  const handleFile = (selected?: File) => {
    if (!selected || processing) return;

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file.");
      return;
    }

    setFile(selected);
    setResult(null);
    setError("");
  };

  const handleConvert = async () => {
    if (!file || processing) return;

    setProcessing(true);
    setError("");
    setResult(null);

    try {
      const converted = await convertPdfToWord(file);
      setResult(converted);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "PDF to Word conversion failed."
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
    anchor.download = result.filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const clearFile = () => {
    if (processing) return;

    setFile(null);
    setResult(null);
    setError("");
  };

  return (
    <div className="pdf-word-page">
      <main className="pdf-word-container">
        <Link to="/" className="pdf-word-back">
          <ArrowLeft size={16} />
          All PDF Tools
        </Link>

        <div className="pdf-word-heading">
          <div className="pdf-word-heading-icon">
            <FileText size={30} />
          </div>

          <h1>PDF to Word Converter</h1>

          <p>
            Convert PDF documents into editable Word files
            quickly and securely in your browser.
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

        {!file && (
          <div
            className={`pdf-word-dropzone ${
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
            <UploadCloud size={48} />

            <h2>Select PDF File</h2>

            <p>
              Drag and drop your PDF here or browse files
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              Select PDF
            </button>
          </div>
        )}

        {file && (
          <>
            <div className="pdf-word-file-card">
              <div className="pdf-word-file-icon">
                <FileText size={28} />
              </div>

              <div className="pdf-word-file-details">
                <strong>{file.name}</strong>

                <span>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <button
                type="button"
                onClick={clearFile}
                disabled={processing}
                aria-label="Remove file"
              >
                <X size={19} />
              </button>
            </div>

            {!result && (
              <div className="pdf-word-actions">
                <div className="pdf-word-info">
                  <h3>Editable Word Document</h3>

                  <p>
                    Extract selectable PDF text and convert
                    it into a DOCX file. Complex layouts
                    may need manual adjustments.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => void handleConvert()}
                >
                  {processing ? (
                    <>
                      <Loader2
                        size={19}
                        className="pdf-word-spinner"
                      />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileText size={19} />
                      Convert to Word
                    </>
                  )}
                </button>
              </div>
            )}

            {result && (
              <div className="pdf-word-success">
                <CheckCircle2 size={46} />

                <h2>Conversion Complete!</h2>

                <p>
                  Your editable Word document is ready.
                </p>

                <div className="pdf-word-stats">
                  <span>{result.pages} PDF pages</span>
                  <span>
                    {result.characters.toLocaleString()} characters
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                >
                  <Download size={19} />
                  Download Word File
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="pdf-word-error" role="alert">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
