import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import MergePdf from "../pages/MergePDF/MergePDF";
import SplitPDF from "../pages/SplitPDF/SplitPDF";
import OrganizePDF from "../pages/OrganizePDF/OrganizePDF";
import RotatePDF from "../pages/RotatePDF/RotatePDF";
import DeletePDF from "../pages/DeletePDF/DeletePDF";
import CompressPDF from "../pages/CompressPDF/CompressPDF";
import ImageToPDF from "../pages/ImageToPDF/ImageToPDF";
import PDFToImage from "../pages/PDFToImage/PDFToImage";
import PDFToWord from "../pages/PDFToWord/PDFToWord";
import PDFToExcel from "../pages/PDFToExcel/PDFToExcel";
import Auth from "../pages/Auth/Auth";
import PassportPhoto from "../pages/PassportPhoto/PassportPhoto";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
<Route path="/signup" element={<Auth />} />
      <Route path="/" element={<Home />} />

      <Route
        path="/merge-pdf"
        element={<MergePdf />}
      />
      <Route path="/split-pdf" element={<SplitPDF />} />
      <Route path="/organize-pdf" element={<OrganizePDF />} />
      <Route path="/rotate-pdf" element={<RotatePDF />} />
      <Route path="/delete-pdf" element={<DeletePDF />} />
      <Route path="/compress-pdf" element={<CompressPDF />} />
      <Route path="/jpg-to-pdf" element={<ImageToPDF />} />
      <Route path="/png-to-pdf" element={<ImageToPDF />} />
      <Route path="/image-to-pdf" element={<ImageToPDF />} />
      <Route path="/pdf-to-jpg" element={<PDFToImage />} />
      <Route path="/pdf-to-png" element={<PDFToImage />} />
      <Route path="/pdf-to-image" element={<PDFToImage />} />
      <Route path="/pdf-to-word" element={<PDFToWord />} />
      <Route path="/pdf-to-excel" element={<PDFToExcel />} />
      {/* // <Route path="/pdf-to-ppt" element={<PDFToPPT />} />  */}
      <Route
  path="/passport-photo"
  element={<PassportPhoto />}
/>
    </Routes>
  );
}