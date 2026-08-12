import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { Cpu, Database, Sliders, Palette, RotateCcw, KeyRound } from "lucide-react";

const LLM_MODELS = [
  "llama3",
  "llama3.1:8b",
  "llama3.1:70b",
  "mistral:7b",
  "qwen2.5:14b",
  "phi3:mini",
  "gemma2:9b",
];
const EMBED_MODELS = ["nomic-embed-text", "bge-large-en-v1.5", "mxbai-embed-large", "e5-mistral"];

function Section({ icon: Icon, title, desc, children }) {
  return (
    <div className="rounded-xl border border-border bg-[hsl(240_4%_9%)] p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-md bg-[hsl(240_4%_13%)] border border-border flex items-center justify-center">
          <Icon className="w-4 h-4 text-[hsl(35_100%_62%)]" />
        </div>
        <div>
          <h3 className="text-base font-medium text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-500">{desc}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, hint, children, testid }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start sm:items-center"
      data-testid={testid}
    >
      <div className="sm:col-span-1">
        <div className="text-sm text-zinc-200">{label}</div>
        {hint && <div className="text-[11px] text-zinc-500 mt-0.5">{hint}</div>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const setSetting = useAppStore((s) => s.setSetting);
  const resetSettings = useAppStore((s) => s.resetSettings);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <div className="h-full overflow-y-auto thin-scroll" data-testid="settings-page">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">
              Configuration
            </div>
            <h1 className="text-3xl tracking-tighter font-medium">Settings</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Tune retrieval, models, and appearance. Stored locally in your browser.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              resetSettings();
              toast.success("Settings reset");
            }}
            className="bg-[hsl(240_4%_12%)] border border-border hover:bg-[hsl(240_4%_16%)]"
            data-testid="reset-settings-btn"
          >
            <RotateCcw className="w-4 h-4" /> Reset defaults
          </Button>
        </header>

        <Section icon={Cpu} title="Language model" desc="Used for generation and reasoning.">
          <Row label="LLM model" hint="Local via Ollama (placeholder).">
            <Select
              value={settings.llmModel}
              onValueChange={(v) => setSetting("llmModel", v)}
            >
              <SelectTrigger
                className="bg-[hsl(240_4%_12%)] border-border"
                data-testid="settings-llm-model"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LLM_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Temperature" hint={`Creativity · ${settings.temperature.toFixed(2)}`}>
            <Slider
              value={[settings.temperature]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(v) => setSetting("temperature", v[0])}
              data-testid="settings-temperature"
            />
          </Row>
          <Row label="Streaming responses" hint="Token-by-token rendering">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.streaming}
                onCheckedChange={(v) => setSetting("streaming", v)}
                data-testid="settings-streaming"
              />
              <span className="text-xs text-zinc-400">{settings.streaming ? "On" : "Off"}</span>
            </div>
          </Row>
        </Section>

        <Section icon={Database} title="Embeddings" desc="Used to index PDFs into the vector store.">
          <Row label="Embedding model">
            <Select
              value={settings.embeddingModel}
              onValueChange={(v) => setSetting("embeddingModel", v)}
            >
              <SelectTrigger
                className="bg-[hsl(240_4%_12%)] border-border"
                data-testid="settings-embedding-model"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMBED_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        </Section>

        <Section icon={Sliders} title="Chunking & retrieval" desc="Controls how documents are split and how many chunks are retrieved.">
          <Row label="Chunk size" hint={`${settings.chunkSize} tokens`}>
            <Slider
              value={[settings.chunkSize]}
              min={128}
              max={2048}
              step={64}
              onValueChange={(v) => setSetting("chunkSize", v[0])}
              data-testid="settings-chunk-size"
            />
          </Row>
          <Row label="Chunk overlap" hint={`${settings.chunkOverlap} tokens`}>
            <Slider
              value={[settings.chunkOverlap]}
              min={0}
              max={512}
              step={16}
              onValueChange={(v) => setSetting("chunkOverlap", v[0])}
              data-testid="settings-chunk-overlap"
            />
          </Row>
          <Row label="Top-K retrieval" hint={`Return ${settings.topK} chunks per query`}>
            <Slider
              value={[settings.topK]}
              min={1}
              max={20}
              step={1}
              onValueChange={(v) => setSetting("topK", v[0])}
              data-testid="settings-top-k"
            />
          </Row>
        </Section>

        <Section icon={Palette} title="Appearance" desc="Switch between dark and light.">
          <Row label="Theme">
            <div className="flex gap-2">
              {["dark", "light"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-3 py-1.5 rounded-md text-sm border capitalize transition-colors ${
                    theme === t
                      ? "bg-white text-black border-white"
                      : "bg-[hsl(240_4%_12%)] border-border text-zinc-300 hover:bg-[hsl(240_4%_15%)]"
                  }`}
                  data-testid={`settings-theme-${t}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section icon={KeyRound} title="API configuration" desc="Override the backend endpoint (advanced).">
          <Row label="API endpoint" hint="Defaults to REACT_APP_BACKEND_URL">
            <Input
              value={settings.apiEndpoint}
              onChange={(e) => setSetting("apiEndpoint", e.target.value)}
              placeholder="https://my-backend.example.com"
              className="bg-[hsl(240_4%_12%)] border-border"
              data-testid="settings-api-endpoint"
            />
          </Row>
        </Section>
      </div>
    </div>
  );
}
