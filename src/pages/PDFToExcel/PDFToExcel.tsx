
import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  convertPdfToExcel,
  type ExcelConversionResult,
} from "../../services/pdf/pdfToExcel";

import "./PDFToExcel.css";

export default function PDFToExcel() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] =
    useState<ExcelConversionResult | null>(null);

  const [activeSheet, setActiveSheet] = useState(0);

  const handleFile = (selected?: File) => {
    if (!selected || processing) return;

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please upload a PDF file.");
      return;
    }

    setFile(selected);
    setResult(null);
    setActiveSheet(0);
    setError("");
  };

  const handleConvert = async () => {
    if (!file || processing) return;

    setProcessing(true);
    setError("");
    setResult(null);

    try {
      const converted = await convertPdfToExcel(file);
      setResult(converted);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "PDF to Excel conversion failed."
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

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const clearFile = () => {
    if (processing) return;

    setFile(null);
    setResult(null);
    setError("");
  };

  const preview = result?.sheets[activeSheet];

  return (
    <div className="pdf-excel-page">
      <main className="pdf-excel-container">
        <Link to="/" className="pdf-excel-back">
          <ArrowLeft size={16} />
          All PDF Tools
        </Link>

        <div className="pdf-excel-heading">
          <div className="pdf-excel-heading-icon">
            <FileSpreadsheet size={30} />
          </div>

          <h1>PDF to Excel Converter</h1>

          <p>
            Extract tables and text from PDFs into
            editable Excel spreadsheets.
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
            className={`pdf-excel-dropzone ${
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
            <div className="pdf-excel-file">
              <div className="pdf-excel-file-icon">
                <FileText size={28} />
              </div>

              <div className="pdf-excel-file-details">
                <strong>{file.name}</strong>
                <span>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <button
                type="button"
                aria-label="Remove file"
                disabled={processing}
                onClick={clearFile}
              >
                <X size={19} />
              </button>
            </div>

            {!result && (
              <div className="pdf-excel-actions">
                <div>
                  <h3>Extract PDF Data</h3>
                  <p>
                    Convert selectable text into spreadsheet
                    rows and columns. Each PDF page becomes
                    an Excel worksheet.
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
                        className="pdf-excel-spinner"
                      />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={19} />
                      Convert to Excel
                    </>
                  )}
                </button>
              </div>
            )}

            {result && (
              <>
                <div className="pdf-excel-success">
                  <CheckCircle2 size={43} />

                  <h2>Excel File Ready!</h2>

                  <p>
                    {result.sheets.length} worksheets ·{" "}
                    {result.totalRows} extracted rows
                  </p>

                  <button
                    type="button"
                    onClick={handleDownload}
                  >
                    <Download size={19} />
                    Download Excel
                  </button>
                </div>

                <section className="pdf-excel-preview">
                  <h2>Spreadsheet Preview</h2>

                  <div className="pdf-excel-tabs">
                    {result.sheets.map((sheet, index) => (
                      <button
                        key={sheet.name}
                        type="button"
                        className={
                          activeSheet === index
                            ? "active"
                            : ""
                        }
                        onClick={() => setActiveSheet(index)}
                      >
                        {sheet.name}
                      </button>
                    ))}
                  </div>

                  {preview && (
                    <div className="pdf-excel-table-scroll">
                      <table>
                        <tbody>
                          {preview.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              <th>{rowIndex + 1}</th>

                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <p className="pdf-excel-preview-note">
                    Showing up to 10 rows per worksheet.
                  </p>
                </section>
              </>
            )}
          </>
        )}

        {error && (
          <div className="pdf-excel-error" role="alert">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
