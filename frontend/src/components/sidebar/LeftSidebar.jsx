import { NavLink, useNavigate } from "react-router-dom";
import { Plus, FileText, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSession } from "@/lib/api";
import { toast } from "sonner";
import SessionList from "./SessionList";
import DocumentList from "./DocumentList";

const navItems = [
  { to: "/documents", icon: FileText, label: "Documents", testid: "nav-documents" },
  { to: "/search", icon: Search, label: "Semantic Search", testid: "nav-search" },
  { to: "/settings", icon: Settings, label: "Settings", testid: "nav-settings" },
];

export default function LeftSidebar() {
  const navigate = useNavigate();

  const handleNewChat = async () => {
    try {
      const s = await createSession("New Chat");
      navigate(`/c/${s.id}`);
    } catch (err) {
      console.error("Create chat failed:", err);
      toast.error("Could not create new chat");
    }
  };

  return (
    <aside
      className="w-[260px] h-full border-r border-border bg-[hsl(240_5%_7%)] flex flex-col shrink-0"
      data-testid="left-sidebar"
    >
      <Brand />

      <div className="px-3 pb-3">
        <Button
          onClick={handleNewChat}
          variant="secondary"
          className="w-full justify-start gap-2 bg-[hsl(240_4%_12%)] border border-border hover:bg-[hsl(240_4%_16%)]"
          data-testid="new-chat-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New chat</span>
          <span className="ml-auto text-[10px] font-mono text-zinc-500">⌘K</span>
        </Button>
      </div>

      <SessionList />
      <DocumentList />

      <nav className="border-t border-border p-2">
        {navItems.map((n) => {
          const Icon = n.icon;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={n.testid}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-[hsl(240_4%_14%)] text-white"
                    : "text-zinc-400 hover:bg-[hsl(240_4%_11%)] hover:text-white"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

function Brand() {
  return (
    <div className="px-4 pt-5 pb-3 flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center font-bold tracking-tight">
        P
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Paperloop</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Research · v0.1
        </div>
      </div>
    </div>
  );
}
