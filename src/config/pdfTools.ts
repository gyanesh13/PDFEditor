
export const pdfTools = {
  // =========================
  // ORGANIZE PDF
  // =========================

  merge: {
    slug: "merge-pdf",
    title: "Merge PDF Files",
    category: "Organize PDF",
    description:
      "Combine multiple PDF files into one document.",
    accept: [".pdf"],
    multiple: true,
  },

  split: {
    slug: "split-pdf",
    title: "Split PDF",
    category: "Organize PDF",
    description:
      "Extract pages or split a PDF into multiple files.",
    accept: [".pdf"],
    multiple: false,
  },

  organize: {
    slug: "organize-pdf",
    title: "Organize PDF",
    category: "Organize PDF",
    description:
      "Rearrange PDF pages using drag and drop.",
    accept: [".pdf"],
    multiple: false,
  },

  rotate: {
    slug: "rotate-pdf",
    title: "Rotate PDF",
    category: "Organize PDF",
    description:
      "Rotate individual pages or an entire PDF document.",
    accept: [".pdf"],
    multiple: false,
  },

  deletePages: {
    slug: "delete-pages",
    title: "Delete PDF Pages",
    category: "Organize PDF",
    description:
      "Remove unwanted pages from your PDF document.",
    accept: [".pdf"],
    multiple: false,
  },

  // =========================
  // OPTIMIZE PDF
  // =========================

  compress: {
    slug: "compress-pdf",
    title: "Compress PDF",
    category: "Optimize PDF",
    description:
      "Optimize PDF structure to reduce file size without intentional quality loss.",
    accept: [".pdf"],
    multiple: false,
  },

  // =========================
  // CONVERT PDF
  // =========================

  pdfToWord: {
    slug: "pdf-to-word",
    title: "PDF to Word",
    category: "Convert PDF",
    description:
      "Convert PDF documents into editable Word files.",
    accept: [".pdf"],
    multiple: false,
  },

  pdfToExcel: {
    slug: "pdf-to-excel",
    title: "PDF to Excel",
    category: "Convert PDF",
    description:
      "Extract tables from PDF files into Excel.",
    accept: [".pdf"],
    multiple: false,
  },

  // =========================
  // IMAGES TO PDF
  // =========================

  jpgToPdf: {
    slug: "jpg-to-pdf",
    title: "JPG to PDF",
    category: "Images to PDF",
    description:
      "Convert JPG images into a PDF document.",
    accept: [".jpg", ".jpeg"],
    multiple: true,
  },

  pngToPdf: {
    slug: "png-to-pdf",
    title: "PNG to PDF",
    category: "Images to PDF",
    description:
      "Convert PNG images into a PDF document.",
    accept: [".png"],
    multiple: true,
  },

  imageToPdf: {
    slug: "image-to-pdf",
    title: "Images to PDF",
    category: "Images to PDF",
    description:
      "Combine JPG, PNG and other supported images into one PDF.",
    accept: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"],
    multiple: true,
  },
  pdfToJpg: {
  slug: "pdf-to-jpg",
  title: "PDF to JPG",
  category: "Convert PDF",
  description: "Convert PDF pages into high-quality JPG images.",
  accept: [".pdf"],
  multiple: false,
},

pdfToPng: {
  slug: "pdf-to-png",
  title: "PDF to PNG",
  category: "Convert PDF",
  description: "Convert PDF pages into PNG images.",
  accept: [".pdf"],
  multiple: false,
},
pdfToPpt: {
  slug: "pdf-to-ppt",
  title: "PDF to PowerPoint",
  category: "Convert PDF",
  description:
    "Convert PDF pages into PowerPoint presentation slides.",
  accept: [".pdf"],
  multiple: false,
},
};

export type PdfToolKey = keyof typeof pdfTools;

export type PdfTool = (typeof pdfTools)[PdfToolKey];

export const pdfToolsList = Object.values(pdfTools);
