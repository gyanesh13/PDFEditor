
import * as XLSX from "xlsx";
import { loadPdf } from "./pdfRenderer";

interface TextCell {
  text: string;
  x: number;
  y: number;
  width: number;
}

export interface ExcelSheetPreview {
  name: string;
  rows: string[][];
}

export interface ExcelConversionResult {
  blob: Blob;
  filename: string;
  sheets: ExcelSheetPreview[];
  totalRows: number;
}

function groupIntoRows(
  items: TextCell[],
  tolerance = 4
): TextCell[][] {
  const sorted = [...items].sort(
    (a, b) => b.y - a.y || a.x - b.x
  );

  const rows: TextCell[][] = [];

  for (const item of sorted) {
    const row = rows.find(
      (existing) =>
        Math.abs(existing[0].y - item.y) <= tolerance
    );

    if (row) {
      row.push(item);
    } else {
      rows.push([item]);
    }
  }

  rows.sort((a, b) => b[0].y - a[0].y);

  rows.forEach((row) => {
    row.sort((a, b) => a.x - b.x);
  });

  return rows;
}

function detectColumns(
  rows: TextCell[][],
  tolerance = 18
): number[] {
  const positions = rows
    .flat()
    .map((item) => item.x)
    .sort((a, b) => a - b);

  const clusters: number[][] = [];

  for (const x of positions) {
    const cluster = clusters.find(
      (group) =>
        Math.abs(
          group.reduce((a, b) => a + b, 0) /
            group.length -
            x
        ) <= tolerance
    );

    if (cluster) {
      cluster.push(x);
    } else {
      clusters.push([x]);
    }
  }

  return clusters
    .map(
      (group) =>
        group.reduce((a, b) => a + b, 0) /
        group.length
    )
    .sort((a, b) => a - b);
}

function rowsToGrid(rows: TextCell[][]): string[][] {
  if (rows.length === 0) return [];

  const columns = detectColumns(rows);

  return rows.map((row) => {
    const cells = Array(columns.length).fill("") as string[];

    for (const item of row) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      columns.forEach((columnX, index) => {
        const distance = Math.abs(item.x - columnX);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      cells[nearestIndex] = cells[nearestIndex]
        ? `${cells[nearestIndex]} ${item.text}`
        : item.text;
    }

    return cells;
  });
}

export async function convertPdfToExcel(
  file: File
): Promise<ExcelConversionResult> {
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Please select a PDF file.");
  }

  const pdf = await loadPdf(file);
  const workbook = XLSX.utils.book_new();

  const sheets: ExcelSheetPreview[] = [];
  let totalRows = 0;

  try {
    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      const items: TextCell[] = [];

      for (const item of content.items) {
        if (!("str" in item)) continue;
        if (!item.str.trim()) continue;

        items.push({
          text: item.str.trim(),
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
        });
      }

      const groupedRows = groupIntoRows(items);
      const grid = rowsToGrid(groupedRows);

      const sheetName = `Page ${pageNumber}`;

      const worksheet = XLSX.utils.aoa_to_sheet(
        grid.length > 0 ? grid : [[""]]
      );

      const columnCount = Math.max(
        1,
        ...grid.map((row) => row.length)
      );

      worksheet["!cols"] = Array.from(
        { length: columnCount },
        (_, index) => {
          const maxLength = Math.max(
            10,
            ...grid.map(
              (row) => (row[index] || "").length
            )
          );

          return {
            wch: Math.min(maxLength + 3, 45),
          };
        }
      );

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sheetName
      );

      sheets.push({
        name: sheetName,
        rows: grid.slice(0, 10),
      });

      totalRows += grid.length;
      page.cleanup();
    }

    if (totalRows === 0) {
      throw new Error(
        "No selectable text found. Scanned PDFs require OCR."
      );
    }

    const bytes = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return {
      blob,
      filename:
        file.name.replace(/\.pdf$/i, "") + ".xlsx",
      sheets,
      totalRows,
    };
  } finally {
    await pdf.cleanup();
  }
}
