import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import LeftSidebar from "@/components/sidebar/LeftSidebar";
import RightSidebar from "@/components/sidebar/RightSidebar";
import TopNavbar from "@/components/navbar/TopNavbar";
import PdfPreviewModal from "@/components/preview/PdfPreviewModal";
import { useAppStore } from "@/store/useAppStore";

export default function AppLayout() {
  const theme = useAppStore((s) => s.theme);
  const mobileMenuOpen = useAppStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useAppStore((s) => s.setMobileMenuOpen);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "light") {
      html.classList.add("light");
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
      html.classList.remove("light");
    }
  }, [theme]);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground"
      data-testid="app-shell"
    >
      <TopNavbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop left sidebar */}
        <div className="hidden md:flex">
          <LeftSidebar />
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="mobile-menu-backdrop"
            />
            <div className="relative z-50">
              <LeftSidebar />
            </div>
          </div>
        )}

        <main className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col overflow-hidden">
            <Outlet />
          </div>
          <div className="hidden lg:flex">
            <RightSidebar />
          </div>
        </main>
      </div>
      <PdfPreviewModal />
    </div>
  );
}
