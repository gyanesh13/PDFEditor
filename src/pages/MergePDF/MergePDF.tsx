import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Download,
  FilePlus2,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";
import { mergePdfFiles } from "../../services/pdf/mergePdf";

import "./MergePDF.css";

interface PdfFile {
  id: string;
  file: File;
}

export default function MergePDF() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (validFiles.length !== selectedFiles.length) {
      setError("Only PDF files are supported.");
    } else {
      setError("");
    }

    setFiles((current) => [
      ...current,
      ...validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
      })),
    ]);
  };

  const removeFile = (id: string) => {
    setFiles((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const moveFile = (index: number, direction: number) => {
    setFiles((current) => {
      const next = [...current];
      const target = index + direction;

      if (target < 0 || target >= next.length) return current;

      [next[index], next[target]] = [next[target], next[index]];

      return next;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2 || loading) return;

    setLoading(true);
    setError("");

    try {
      const blob = await mergePdfFiles(
        files.map((item) => item.file)
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "PDFEditor-merged.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to merge PDF files."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="merge-page">
      <main className="merge-container">
        <Link to="/" className="merge-back">
          <ArrowLeft size={16} />
          All PDF Tools
        </Link>

        <div className="merge-heading">
          <div className="merge-heading-icon">
            <FilePlus2 size={27} />
          </div>

          <h1>Merge PDF Files</h1>

          <p>
            Combine multiple PDF documents into one file.
            Arrange them in your preferred order.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          hidden
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />

        <div
          className={`merge-dropzone ${dragging ? "dragging" : ""}`}
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
            addFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <UploadCloud size={42} />

          <h2>Drag & Drop PDF files here</h2>

          <p>Or choose files from your device</p>

          <button
            type="button"
            className="merge-select-btn"
            onClick={() => inputRef.current?.click()}
          >
            Select PDF Files
          </button>
        </div>

        {files.length > 0 && (
          <section className="merge-files-section">
            <div className="merge-files-heading">
              <h2>Selected Files ({files.length})</h2>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="merge-add-btn"
              >
                <FilePlus2 size={17} />
                Add More
              </button>
            </div>

            <div className="merge-file-list">
              {files.map((item, index) => (
                <div className="merge-file-card" key={item.id}>
                  <div className="merge-file-icon">
                    <FileText size={24} />
                  </div>

                  <div className="merge-file-info">
                    <strong>{item.file.name}</strong>
                    <span>
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  <div className="merge-file-actions">
                    <button
                      type="button"
                      aria-label={`Move ${item.file.name} up`}
                      disabled={index === 0}
                      onClick={() => moveFile(index, -1)}
                    >
                      <ArrowUp size={18} />
                    </button>

                    <button
                      type="button"
                      aria-label={`Move ${item.file.name} down`}
                      disabled={index === files.length - 1}
                      onClick={() => moveFile(index, 1)}
                    >
                      <ArrowRight
                        size={18}
                        style={{ transform: "rotate(90deg)" }}
                      />
                    </button>

                    <button
                      type="button"
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => removeFile(item.id)}
                      className="remove-btn"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {error && (
          <p className="merge-error" role="alert">
            {error}
          </p>
        )}

        <div className="merge-bottom">
          <p>
            Files are processed locally in your browser.
          </p>

          <button
            type="button"
            className="merge-action-btn"
            disabled={files.length < 2 || loading}
            onClick={handleMerge}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="merge-spinner" />
                Merging...
              </>
            ) : (
              <>
                <Download size={18} />
                Merge PDF
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}