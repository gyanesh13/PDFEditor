import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface Props {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  selected: boolean;
  onSelect: (page: number) => void;
}

export default function PDFThumbnail({
  pdf,
  pageNumber,
  selected,
  onSelect,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let renderTask: ReturnType<
      Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]
    > | null = null;

    async function renderPage() {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;
      } catch (err) {
        if (!cancelled) {
          console.error("Page render failed:", err);
          setError(true);
        }
      }
    }

    void renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber]);

  return (
    <button
      type="button"
      className={`pdf-thumbnail ${selected ? "selected" : ""}`}
      onClick={() => onSelect(pageNumber)}
      aria-pressed={selected}
      aria-label={`Select page ${pageNumber}`}
    >
      <div className="pdf-thumbnail-canvas">
        {error ? (
          <span>Preview unavailable</span>
        ) : (
          <canvas ref={canvasRef} />
        )}
      </div>

      <div className="pdf-thumbnail-footer">
        <span>Page {pageNumber}</span>
        <span className="pdf-thumbnail-check">
          {selected ? "✓" : ""}
        </span>
      </div>
    </button>
  );
}