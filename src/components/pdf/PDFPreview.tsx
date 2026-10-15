import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdf } from "../../services/pdf/pdfRenderer";
import PDFThumbnail from "./PDFThumbnail";
import "./PDFPreview.css";

interface Props {
  file: File;
  selectedPages: number[];
  onSelectionChange: (pages: number[]) => void;
}

export default function PDFPreview({
  file,
  selectedPages,
  onSelectionChange,
}: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loadedPdf: PDFDocumentProxy | null = null;

    setPdf(null);
    setLoading(true);
    setError("");

    async function initialize() {
      try {
        const document = await loadPdf(file);
        loadedPdf = document;

        if (cancelled) {
          await document.destroy();
          return;
        }

        setPdf(document);
      } catch {
        if (!cancelled) {
          setError("Unable to preview this PDF.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      if (loadedPdf) {
        void loadedPdf.destroy();
      }
    };
  }, [file]);

  const togglePage = (page: number) => {
    if (selectedPages.includes(page)) {
      onSelectionChange(
        selectedPages.filter((item) => item !== page)
      );
    } else {
      onSelectionChange(
        [...selectedPages, page].sort((a, b) => a - b)
      );
    }
  };

  if (loading) {
    return <div className="pdf-preview-status">Loading PDF preview...</div>;
  }

  if (error || !pdf) {
    return (
      <div className="pdf-preview-status" role="alert">
        {error || "Preview unavailable."}
      </div>
    );
  }

  return (
    <section className="pdf-preview">
      <div className="pdf-preview-header">
        <div>
          <h3>Document Preview</h3>
          <p>
            {pdf.numPages} pages · {selectedPages.length} selected
          </p>
        </div>

        <div className="pdf-preview-actions">
          <button
            type="button"
            onClick={() =>
              onSelectionChange(
                Array.from(
                  { length: pdf.numPages },
                  (_, index) => index + 1
                )
              )
            }
          >
            Select All
          </button>

          <button
            type="button"
            onClick={() => onSelectionChange([])}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="pdf-preview-grid">
        {Array.from(
          { length: pdf.numPages },
          (_, index) => (
            <PDFThumbnail
              key={index + 1}
              pdf={pdf}
              pageNumber={index + 1}
              selected={selectedPages.includes(index + 1)}
              onSelect={togglePage}
            />
          )
        )}
      </div>
    </section>
  );
}