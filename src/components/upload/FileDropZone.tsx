import {
  FileText,
  Upload,
} from "lucide-react";

import { useRef, useState } from "react";

import "./FileDropZone.css";

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}

export default function FileDropzone({
  accept = ".pdf",
  multiple = true,
  onFiles,
}: FileDropzoneProps) {

  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] =
    useState(false);

  const processFiles = (
    fileList: FileList | null,
  ) => {

    if (!fileList) return;

    const files = Array.from(fileList);

    onFiles(files);
  };

  return (
    <div
      className={`file-dropzone ${
        dragging ? "dragging" : ""
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => {
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();

        setDragging(false);

        processFiles(
          event.dataTransfer.files,
        );
      }}
      onClick={() =>
        inputRef.current?.click()
      }
    >

      <div className="drop-icon">
        <Upload size={30} />
      </div>

      <h3>
        Drag & Drop your PDF files here
      </h3>

      <span>or</span>

      <button
        className="browse-button"
        onClick={(event) => {
          event.stopPropagation();

          inputRef.current?.click();
        }}
      >
        <FileText size={17} />
        Select Files
      </button>

      <p>
        Supports PDF files up to 100 MB
      </p>

      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple}
        accept={accept}
        onChange={(event) =>
          processFiles(event.target.files)
        }
      />

    </div>
  );
}