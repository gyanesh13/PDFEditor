import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function loadPdf(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());

  const loadingTask = pdfjs.getDocument({ data: bytes });
  return loadingTask.promise;
}