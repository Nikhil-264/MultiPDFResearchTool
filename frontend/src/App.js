import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "@/layouts/AppLayout";
import ChatPage from "@/pages/ChatPage";
import DocumentsPage from "@/pages/DocumentsPage";
import SearchPage from "@/pages/SearchPage";
import SettingsPage from "@/pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/c/:sessionId" element={<ChatPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#18181B",
            color: "#FAFAFA",
            border: "1px solid #27272A",
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
