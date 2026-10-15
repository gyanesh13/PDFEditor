import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  Cloud,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  FolderOpen,
  Image,
  Lock,
  MousePointer2,
  PenLine,
  Presentation,
  RotateCw,
  Shield,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
type Tool = {
  label: string;
  icon: React.ReactNode;
  path?: string;
};
type ToolCategory = {
  title: string;
  description: string;
  icon: React.ReactNode;
  theme: string;
  tools: Tool[];
};
const toolCategories: ToolCategory[] = [
  {
    title: "Convert PDF",
    description: "Change your PDF to or from other formats.",
    icon: <ArrowRight size={22} />,
    theme: "blue",
    tools: [
      {
        label: "PDF to Word",
        icon: <FileText size={20} />,
        path: "/pdf-to-word",
      },
      {
        label: "PDF to Excel",
        icon: <FileSpreadsheet size={20} />,
        path: "/pdf-to-excel",
      },
      {
        label: "PDF to PPT",
        icon: <Presentation size={20} />,
        path: "/pdf-to-ppt",
      },
      {
        label: "PDF to JPG",
        icon: <Image size={20} />,
        path: "/pdf-to-jpg",
      },
      {
        label: "JPG to PDF",
        icon: <FileImage size={20} />,
        path: "/jpg-to-pdf",
      },
      {
        label: "More Formats",
        icon: <ArrowRight size={20} />,
        path: "/convert",
      },
    ],
  },
  {
    title: "Organize PDF",
    description: "Merge, split, rotate and manage pages.",
    icon: <MousePointer2 size={22} />,
    theme: "green",
    tools: [
      {
        label: "Merge PDF",
        icon: <FileText size={20} />,
        path: "/merge-pdf",
      },
      {
        label: "Split PDF",
        icon: <FileType size={20} />,
        path: "/split-pdf",
      },
      {
        label: "Compress PDF",
        icon: <ArrowRight size={20} />,
        path: "/compress-pdf",
      },
      {
        label: "Rotate PDF",
        icon: <RotateCw size={20} />,
        path: "/rotate-pdf",
      },
      {
        label: "Delete Pages",
        icon: <FileText size={20} />,
        path: "/delete-pages",
      },
      {
        label: "Rearrange Pages",
        icon: <MousePointer2 size={20} />,
        path: "/rearrange-pdf",
      },
    ],
  },
  {
    title: "Edit PDF",
    description: "Modify your PDF content with ease.",
    icon: <PenLine size={22} />,
    theme: "purple",
    tools: [
      {
        label: "Edit PDF",
        icon: <PenLine size={20} />,
        path: "/edit-pdf",
      },
      {
        label: "Add Text",
        icon: <FileText size={20} />,
        path: "/edit-pdf",
      },
      {
        label: "Add Image",
        icon: <Image size={20} />,
        path: "/edit-pdf",
      },
      {
        label: "Highlight",
        icon: <PenLine size={20} />,
        path: "/edit-pdf",
      },
      {
        label: "Draw",
        icon: <PenLine size={20} />,
        path: "/edit-pdf",
      },
      {
        label: "More Tools",
        icon: <ArrowRight size={20} />,
        path: "/edit-pdf",
      },
    ],
  },
  {
    title: "Security",
    description: "Protect and secure your documents.",
    icon: <Shield size={22} />,
    theme: "orange",
    tools: [
      {
        label: "Password Protect",
        icon: <Lock size={20} />,
        path: "/protect-pdf",
      },
      {
        label: "Unlock PDF",
        icon: <Lock size={20} />,
        path: "/unlock-pdf",
      },
      {
        label: "Encrypt PDF",
        icon: <Shield size={20} />,
        path: "/encrypt-pdf",
      },
      {
        label: "Remove Password",
        icon: <Lock size={20} />,
        path: "/unlock-pdf",
      },
      {
        label: "Sign PDF",
        icon: <PenLine size={20} />,
        path: "/sign-pdf",
      },
      {
        label: "Watermark",
        icon: <Cloud size={20} />,
        path: "/watermark-pdf",
      },
    ],
  },
  {
    title: "AI Tools",
    description: "Smarter tools powered by AI.",
    icon: <Sparkles size={22} />,
    theme: "violet",
    tools: [
      {
        label: "OCR (Scanned PDF)",
        icon: <Sparkles size={20} />,
        path: "/ocr-pdf",
      },
      {
        label: "Summarize PDF",
        icon: <FileText size={20} />,
        path: "/summarize-pdf",
      },
      {
        label: "Chat with PDF",
        icon: <Sparkles size={20} />,
        path: "/chat-with-pdf",
      },
      {
        label: "Extract Tables",
        icon: <FileSpreadsheet size={20} />,
        path: "/extract-tables",
      },
      {
        label: "Extract Images",
        icon: <Image size={20} />,
        path: "/extract-images",
      },
      {
        label: "Translate PDF",
        icon: <FileType size={20} />,
        path: "/translate-pdf",
      },
    ],
  },
  {
    title: "Images to PDF",
    description: "Create PDFs from your images.",
    icon: <Image size={22} />,
    theme: "cyan",
    tools: [
      {
        label: "JPG to PDF",
        icon: <Image size={20} />,
        path: "/jpg-to-pdf",
      },
      {
        label: "PNG to PDF",
        icon: <Image size={20} />,
        path: "/png-to-pdf",
      },
      {
        label: "GIF to PDF",
        icon: <Image size={20} />,
        path: "/gif-to-pdf",
      },
      {
        label: "BMP to PDF",
        icon: <Image size={20} />,
        path: "/bmp-to-pdf",
      },
      {
        label: "TIF to PDF",
        icon: <Image size={20} />,
        path: "/tif-to-pdf",
      },
      {
        label: "More",
        icon: <ArrowRight size={20} />,
        path: "/image-to-pdf",
      },
    ],
  },
  {
    title: "More Tools",
    description: "Additional useful PDF utilities.",
    icon: <MousePointer2 size={22} />,
    theme: "pink",
    tools: [
      {
        label: "Fill Forms",
        icon: <FileText size={20} />,
        path: "/fill-pdf",
      },
      {
        label: "Compare PDFs",
        icon: <FileText size={20} />,
        path: "/compare-pdf",
      },
      {
        label: "Extract Pages",
        icon: <FileText size={20} />,
        path: "/extract-pages",
      },
      {
        label: "Crop PDF",
        icon: <MousePointer2 size={20} />,
        path: "/crop-pdf",
      },
      {
        label: "Rotate Left",
        icon: <RotateCw size={20} />,
        path: "/rotate-pdf",
      },
      {
        label: "Rotate Right",
        icon: <RotateCw size={20} />,
        path: "/rotate-pdf",
      },
    ],
  },
  {
  title: "Photo Tools",
  description: "Create print-ready passport photos from a picture.",
  icon: <Camera size={22} />,
  theme: "cyan",
  tools: [
    {
      label: "Passport Size Photo Maker",
      icon: <Camera size={20} />,
      path: "/passport-photo",
    },
  ],
},
];
export default function Home() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);
  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    console.log(
      "Selected files:",
      selectedFiles,
    );
    /*
     * Later:
     * - Detect file type
     * - Navigate to appropriate tool
     * - Upload file
     * - Store files in Zustand
     */
  };
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  return (
    <div className="app">
    <main>
        {/* =====================================
            HERO
        ====================================== */}
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-content">
              <div className="eyebrow">
                <Sparkles size={15} />
                All-in-One PDF Solution
              </div>
              <h1>
                Edit, Convert, Organize &
                <span>
                  Manage Your PDFs
                </span>
              </h1>
              <p className="hero-description">
                Powerful and easy-to-use PDF
                tools to help you work smarter.
                <br />
                All your PDF needs in one place.
              </p>
              {/* Upload */}
              <div
                className="upload-box"
                onClick={openFilePicker}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.add(
                    "dragging",
                  );
                }}
                onDragLeave={(event) => {
                  event.currentTarget.classList.remove(
                    "dragging",
                  );
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.remove(
                    "dragging",
                  );
                  handleFiles(
                    event.dataTransfer.files,
                  );
                }}
              >
                <div className="upload-icon">
                  <Upload size={32} />
                </div>
                <h3>
                  Drag & Drop your PDF files here
                </h3>
                <span className="or">
                  or
                </span>
                <button
                  className="select-files"
                  onClick={(event) => {
                    event.stopPropagation();
                    openFilePicker();
                  }}
                >
                  <FolderOpen size={18} />
                  Select Files
                </button>
                <p>
                  Supports PDF, DOC, DOCX, XLS,
                  XLSX, PPT, PPTX, JPG, PNG and
                  more...
                </p>
                <input
                  ref={fileInputRef}
                  id="pdf-file-input"
                  type="file"
                  hidden
                  multiple
                  accept="
                    .pdf,
                    .doc,
                    .docx,
                    .xls,
                    .xlsx,
                    .ppt,
                    .pptx,
                    .jpg,
                    .jpeg,
                    .png
                  "
                  onChange={(event) =>
                    handleFiles(
                      event.target.files,
                    )
                  }
                />
              </div>
            </div>
            {/* =====================================
                HERO ILLUSTRATION
            ====================================== */}
            <div className="hero-visual">
              <div className="floating-file file-word">
                <FileText size={24} />
              </div>
              <div className="floating-file file-excel">
                <FileSpreadsheet size={24} />
              </div>
              <div className="floating-file file-ppt">
                <Presentation size={24} />
              </div>
              <div className="floating-file file-image">
                <Image size={24} />
              </div>
              <div className="pdf-stack">
                <div className="pdf-page back" />
                <div className="pdf-page front">
                  <div className="pdf-logo">
                    <FileText size={52} />
                    <strong>
                      PDF
                    </strong>
                  </div>
                </div>
              </div>
              <div className="hero-note">
                Convert, edit and
                <br />
                do more with your PDFs
                <br />
                — all in one place!
              </div>
            </div>
          </div>
        </section>
        {/* =====================================
            TOOL CATEGORIES
        ====================================== */}
        <section className="tools-section">
          <div className="container">
            <div className="tools-grid">
              {toolCategories.map(
                (category) => (
                  <ToolCard
                    key={category.title}
                    category={category}
                  />
                ),
              )}
            </div>
          </div>
        </section>
        {/* =====================================
            BENEFITS
        ====================================== */}
        <section className="benefits">
          <div className="container benefits-grid">
            <Benefit
              icon={<Shield size={24} />}
              title="100% Secure"
              description="Your files are safe with us."
            />
            <Benefit
              icon={<Zap size={24} />}
              title="Fast & Reliable"
              description="Get your work done in seconds."
            />
            <Benefit
              icon={<Cloud size={24} />}
              title="No Installation"
              description="Works directly in your browser."
            />
            <Benefit
              icon={<Check size={24} />}
              title="Easy to Use"
              description="Simple, clean and intuitive interface."
            />
          </div>
        </section>
      </main>
      {/* =====================================
          FOOTER
      ====================================== */}
      <footer className="footer">
        <div className="container footer-content">
          <span>
            © {new Date().getFullYear()} PDFEditor
          </span>
          <div>
            <Link to="/privacy">
              Privacy
            </Link>
            <Link to="/terms">
              Terms
            </Link>
            <Link to="/contact">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
/* ============================================
   TOOL CARD
\============================================ */
function ToolCard({
  category,
}: {
  category: ToolCategory;
}) {
  return (
    <div
      className={`tool-card ${category.theme}`}
    >
      <div className="tool-card-header">
        <div className="tool-title-row">
          <div className="category-icon">
            {category.icon}
          </div>
          <div>
            <h2>
              {category.title}
            </h2>
            <p>
              {category.description}
            </p>
          </div>
        </div>
        <Link
          to={
            category.tools[0]?.path ||
            "/"
          }
          className="category-arrow"
          aria-label={`View ${category.title}`}
        >
          <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="tool-items">
        {category.tools.map(
          (tool) => (
            <Link
              className="tool-item"
              key={tool.label}
              to={tool.path || "#"}
            >
              <span className="tool-icon">
                {tool.icon}
              </span>
              <span>
                {tool.label}
              </span>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
/* ============================================
   BENEFIT
\============================================ */
function Benefit({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="benefit">
      <div className="benefit-icon">
        {icon}
      </div>
      <div>
        <h3>
          {title}
        </h3>
        <p>
          {description}
        </p>
      </div>
    </div>
  );
}
