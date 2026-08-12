import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set, get) => ({
      // theme
      theme: "dark",
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),

      // ui
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      mobileMenuOpen: false,
      setLeftSidebarOpen: (v) => set({ leftSidebarOpen: v }),
      setRightSidebarOpen: (v) => set({ rightSidebarOpen: v }),
      setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),

      // pdf preview
      preview: null, // { filename, page, snippet, document_id }
      setPreview: (p) => set({ preview: p }),

      // settings
      settings: {
        llmModel: "llama3",
        embeddingModel: "nomic-embed-text",
        chunkSize: 512,
        chunkOverlap: 64,
        topK: 5,
        temperature: 0.2,
        streaming: true,
        apiEndpoint: "",
      },
      setSetting: (key, value) =>
        set((s) => ({ settings: { ...s.settings, [key]: value } })),
      resetSettings: () =>
        set({
          settings: {
            llmModel: "llama3",
            embeddingModel: "nomic-embed-text",
            chunkSize: 512,
            chunkOverlap: 64,
            topK: 5,
            temperature: 0.2,
            streaming: true,
            apiEndpoint: "",
          },
        }),

      // active citations (right panel)
      activeCitations: [],
      setActiveCitations: (cs) => set({ activeCitations: cs || [] }),
      focusedCitationId: null,
      setFocusedCitationId: (id) => set({ focusedCitationId: id }),
    }),
    {
      name: "pdf-rag-app",
      partialize: (s) => ({ theme: s.theme, settings: s.settings }),
    }
  )
);
