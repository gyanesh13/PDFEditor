import { create } from "zustand";

export interface PdfFile {
  id: string;
  file: File;
}

interface PdfState {
  files: PdfFile[];

  addFiles: (files: File[]) => void;

  removeFile: (id: string) => void;

  clearFiles: () => void;

  reorderFiles: (
    from: number,
    to: number,
  ) => void;
}

export const usePdfStore =
  create<PdfState>((set) => ({
    files: [],

    addFiles: (files) =>
      set((state) => ({
        files: [
          ...state.files,
          ...files.map((file) => ({
            id: crypto.randomUUID(),
            file,
          })),
        ],
      })),

    removeFile: (id) =>
      set((state) => ({
        files: state.files.filter(
          (file) => file.id !== id,
        ),
      })),

    clearFiles: () =>
      set({
        files: [],
      }),

    reorderFiles: (from, to) =>
      set((state) => {
        const files = [...state.files];

        const [removed] =
          files.splice(from, 1);

        files.splice(to, 0, removed);

        return { files };
      }),
  }));