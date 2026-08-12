export default function StreamingDots() {
  return (
    <div className="dot-blink inline-flex items-center gap-1 text-zinc-500" data-testid="streaming-dots">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
    </div>
  );
}
