
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  GripVertical,
  RotateCcw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PDFDocumentProxy } from "pdfjs-dist";

import Header from "../../components/layout/Header";
import PDFThumbnail from "../../components/pdf/PDFThumbnail";
import { loadPdf } from "../../services/pdf/pdfRenderer";
import { organizePdf } from "../../services/pdf/OrganizePDF";

import "./OrganizePDF.css";

interface SortablePageProps {
  page: number;
  pdf: PDFDocumentProxy;
  onRemove: (page: number) => void;
}

function SortablePage({
  page,
  pdf,
  onRemove,
}: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page });

  return (
    <div
      ref={setNodeRef}
      className={`organize-page-card ${
        isDragging ? "dragging" : ""
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="organize-page-toolbar">
        <button
          type="button"
          className="organize-drag-handle"
          aria-label={`Drag page ${page}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>

        <button
          type="button"
          aria-label={`Delete page ${page}`}
          onClick={() => onRemove(page)}
        >
          <Trash2 size={17} />
        </button>
      </div>

      <PDFThumbnail
        pdf={pdf}
        pageNumber={page}
        selected={false}
        onSelect={() => {}}
      />
    </div>
  );
}

export default function OrganizePDF() {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        setPages(
          Array.from(
            { length: document.numPages },
            (_, index) => index + 1
          )
        );
      } catch {
        if (!cancelled) {
          setError("Unable to read this PDF.");
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
      setError("Please upload a PDF file.");
      return;
    }

    requestRef.current += 1;
    setPages([]);
    setFile(selected);
    setError("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPages((current) => {
      const oldIndex = current.indexOf(Number(active.id));
      const newIndex = current.indexOf(Number(over.id));

      if (oldIndex === -1 || newIndex === -1) return current;

      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const removePage = (page: number) => {
    setPages((current) =>
      current.filter((item) => item !== page)
    );
  };

  const resetPages = () => {
    if (!pdf) return;

    setPages(
      Array.from(
        { length: pdf.numPages },
        (_, index) => index + 1
      )
    );
  };

  const download = async () => {
    if (!file || processing || pages.length === 0) return;

    setProcessing(true);
    setError("");

    try {
      const blob = await organizePdf(file, pages);
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "PDFEditor-organized.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to organize PDF."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="organize-page">
      <Header />

      <main className="organize-container">
        <Link to="/" className="organize-back">
          <ArrowLeft size={16} />
          All PDF Tools
        </Link>

        <div className="organize-heading">
          <h1>Organize PDF Pages</h1>
          <p>
            Drag pages to rearrange them, remove unwanted
            pages, and download your updated PDF.
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
          <div className="organize-upload">
            <UploadCloud size={42} />
            <h2>Select your PDF file</h2>
            <p>Upload a document to organize its pages.</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              Select PDF
            </button>
          </div>
        )}

        {loading && <p>Loading PDF pages...</p>}

        {pdf && !loading && (
          <>
            <div className="organize-controls">
              <div>
                <strong>{file?.name}</strong>
                <p>{pages.length} pages remaining</p>
              </div>

              <div className="organize-actions">
                <button type="button" onClick={resetPages}>
                  <RotateCcw size={16} />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  Change PDF
                </button>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pages}
                strategy={rectSortingStrategy}
              >
                <div className="organize-grid">
                  {pages.map((page) => (
                    <SortablePage
                      key={page}
                      page={page}
                      pdf={pdf}
                      onRemove={removePage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="organize-bottom">
              <p>
                Pages will be saved in the displayed order.
              </p>

              <button
                type="button"
                onClick={() => void download()}
                disabled={processing || pages.length === 0}
              >
                <Download size={18} />
                {processing
                  ? "Processing..."
                  : "Download PDF"}
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="organize-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
