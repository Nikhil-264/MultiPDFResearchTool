import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Upload, Sun, Moon, Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { uploadDocument } from "@/lib/api";
import { toast } from "sonner";

export default function TopNavbar() {
  const navigate = useNavigate();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setMobileMenuOpen = useAppStore((s) => s.setMobileMenuOpen);
  const mobileMenuOpen = useAppStore((s) => s.mobileMenuOpen);
  const fileRef = useRef(null);
  const [searchQ, setSearchQ] = useState("");
  const [uploading, setUploading] = useState(false);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const onUploadClick = () => fileRef.current?.click();

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const f of files) {
      try {
        await uploadDocument(f);
        toast.success(`Uploaded ${f.name}`);
      } catch (_) {
        toast.error(`Failed: ${f.name}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <header
      className="h-14 shrink-0 border-b border-border bg-[hsl(240_5%_5%)]/85 backdrop-blur-xl flex items-center gap-2 px-3 sm:px-4"
      data-testid="top-navbar"
    >
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 rounded-md hover:bg-[hsl(240_4%_12%)] text-zinc-300"
        data-testid="mobile-menu-toggle"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="md:hidden flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-bold text-xs">
          P
        </div>
        <span className="text-sm font-semibold">Paperloop</span>
      </div>

      <form onSubmit={onSearchSubmit} className="flex-1 max-w-xl ml-2 hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search across your library… (semantic)"
            className="w-full h-9 bg-[hsl(240_4%_10%)] border border-border rounded-md pl-9 pr-3 text-sm placeholder:text-zinc-600 text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
            data-testid="global-search-input"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-600 border border-border px-1.5 py-0.5 rounded">
            ⏎
          </kbd>
        </div>
      </form>

      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-1.5 ml-auto">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={onFiles}
          data-testid="navbar-upload-input"
        />
        <Button
          onClick={onUploadClick}
          variant="secondary"
          className="bg-[hsl(240_4%_12%)] border border-border hover:bg-[hsl(240_4%_16%)] text-zinc-200 h-9"
          data-testid="upload-pdf-btn"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Upload PDF</span>
        </Button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-[hsl(240_4%_12%)] text-zinc-300 transition-colors"
          data-testid="theme-toggle-btn"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div
          className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-500 text-black flex items-center justify-center text-xs font-bold ml-1"
          data-testid="user-avatar"
          title="You"
        >
          R
        </div>
      </div>
    </header>
  );
}
