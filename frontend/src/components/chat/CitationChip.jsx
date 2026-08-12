import { useAppStore } from "@/store/useAppStore";

export default function CitationChip({ index, citation }) {
  const setPreview = useAppStore((s) => s.setPreview);
  const setFocusedCitationId = useAppStore((s) => s.setFocusedCitationId);

  return (
    <button
      onClick={() => {
        setFocusedCitationId(citation.id);
        setPreview(citation);
      }}
      title={`${citation.filename} · p.${citation.page}`}
      data-testid={`citation-chip-${citation.id}`}
      className="inline-flex items-center justify-center min-w-[22px] h-5 rounded-sm bg-[hsl(35_100%_62%)]/15 text-[hsl(35_100%_62%)] text-[11px] font-mono border border-[hsl(35_100%_62%)]/30 hover:bg-[hsl(35_100%_62%)] hover:text-[#422006] transition-colors cursor-pointer px-1.5 mx-0.5 align-middle"
    >
      {index}
    </button>
  );
}
