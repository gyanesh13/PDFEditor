
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  GripVertical,
  ImagePlus,
  Loader2,
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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  imagesToPdf,
  type PageSize,
  type Orientation,
  type ImageFit,
} from "../../services/pdf/imageToPdf";

import "./ImageToPDF.css";

interface ImageItem {
  id: string;
  file: File;
  url: string;
}

function SortableImage({
  item,
  index,
  onRemove,
}: {
  item: ImageItem;
  index: number;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      className={`image-pdf-card ${isDragging ? "dragging" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="image-pdf-card-toolbar">
        <button
          type="button"
          className="image-pdf-drag-handle"
          aria-label={`Move image ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>

        <button
          type="button"
          aria-label={`Remove ${item.file.name}`}
          onClick={() => onRemove(item.id)}
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="image-pdf-card-preview">
        <img src={item.url} alt={item.file.name} />
      </div>

      <div className="image-pdf-card-footer">
        <span>Page {index + 1}</span>
        <small title={item.file.name}>{item.file.name}</small>
      </div>
    </div>
  );
}

export default function ImageToPDF() {
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImageItem[]>([]);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [orientation, setOrientation] =
    useState<Orientation>("portrait");
  const [fit, setFit] = useState<ImageFit>("contain");
  const [margin, setMargin] = useState(20);

  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((item) =>
        URL.revokeObjectURL(item.url)
      );
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addImages = (files: FileList | File[]) => {
    const selected = Array.from(files);

    const supported = selected.filter(
      (file) =>
        file.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name)
    );

    if (supported.length === 0) {
      setError("Please select supported image files.");
      return;
    }

    const items: ImageItem[] = supported.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));

    setImages((current) => [...current, ...items]);
    setError("");
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const removed = current.find((item) => item.id === id);

      if (removed) URL.revokeObjectURL(removed.url);

      return current.filter((item) => item.id !== id);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setImages((current) => {
      const oldIndex = current.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = current.findIndex(
        (item) => item.id === over.id
      );

      if (oldIndex < 0 || newIndex < 0) return current;

      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const handleConvert = async () => {
    if (images.length === 0 || processing) return;

    setProcessing(true);
    setError("");

    try {
      const blob = await imagesToPdf(
        images.map((item) => item.file),
        { pageSize, orientation, fit, margin }
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "PDFEditor-images.pdf";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to convert images to PDF."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="image-pdf-page">
      <main className="image-pdf-container">
        <Link to="/" className="image-pdf-back">
          <ArrowLeft size={16} />
          All PDF Tools
        </Link>

        <div className="image-pdf-heading">
          <div className="image-pdf-heading-icon">
            <ImagePlus size={28} />
          </div>

          <h1>JPG & PNG to PDF</h1>

          <p>
            Convert multiple images into one PDF.
            Arrange images, choose page settings,
            and download instantly.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) {
              addImages(event.target.files);
            }
            event.target.value = "";
          }}
        />

        {images.length === 0 && (
          <div
            className={`image-pdf-dropzone ${
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
              addImages(event.dataTransfer.files);
            }}
          >
            <UploadCloud size={44} />

            <h2>Upload your images</h2>

            <p>
              Drag JPG, PNG or other supported images here
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              Select Images
            </button>
          </div>
        )}

        {images.length > 0 && (
          <>
            <div className="image-pdf-toolbar">
              <div>
                <h2>Selected Images</h2>
                <p>
                  {images.length} images · Drag to reorder
                </p>
              </div>

              <button
                type="button"
                disabled={processing}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus size={17} />
                Add More
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((item) => item.id)}
                strategy={rectSortingStrategy}
              >
                <div className="image-pdf-grid">
                  {images.map((item, index) => (
                    <SortableImage
                      key={item.id}
                      item={item}
                      index={index}
                      onRemove={removeImage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <section className="image-pdf-settings">
              <h2>PDF Settings</h2>

              <div className="image-pdf-settings-grid">
                <label>
                  Page Size
                  <select
                    value={pageSize}
                    onChange={(event) =>
                      setPageSize(event.target.value as PageSize)
                    }
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">US Letter</option>
                    <option value="Fit">Fit to Image</option>
                  </select>
                </label>

                <label>
                  Orientation
                  <select
                    value={orientation}
                    disabled={pageSize === "Fit"}
                    onChange={(event) =>
                      setOrientation(
                        event.target.value as Orientation
                      )
                    }
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </label>

                <label>
                  Image Fit
                  <select
                    value={fit}
                    onChange={(event) =>
                      setFit(event.target.value as ImageFit)
                    }
                  >
                    <option value="contain">
                      Fit Entire Image
                    </option>
                    <option value="cover">
                      Fill Page (Crop)
                    </option>
                  </select>
                </label>

                <label>
                  Margin
                  <select
                    value={margin}
                    disabled={pageSize === "Fit"}
                    onChange={(event) =>
                      setMargin(Number(event.target.value))
                    }
                  >
                    <option value={0}>No Margin</option>
                    <option value={20}>Small</option>
                    <option value={40}>Medium</option>
                    <option value={60}>Large</option>
                  </select>
                </label>
              </div>
            </section>

            <div className="image-pdf-bottom">
              <p>
                Images are processed locally in your browser.
              </p>

              <button
                type="button"
                disabled={processing}
                onClick={() => void handleConvert()}
              >
                {processing ? (
                  <>
                    <Loader2
                      size={18}
                      className="image-pdf-spinner"
                    />
                    Converting...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Convert to PDF
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="image-pdf-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
