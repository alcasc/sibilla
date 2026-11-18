import { useRef, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

export type BuildMode = "classic" | "procedural";

const MODES: { id: BuildMode; label: string; lead: string; tradeoff: string }[] = [
  { id: "classic", label: "Tutta insieme", lead: "Costruisco l'app completa in una volta.", tradeoff: "Più attesa all'inizio, poi è tutta pronta." },
  { id: "procedural", label: "Passo per passo", lead: "Parto dalla prima schermata; le altre le genero quando ci entri.", tradeoff: "Parti subito, e ogni schermata resta." },
];

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * Three screens of the app as miniatures. "classic": all three are built and land together.
 * "procedural": the first is built, the others are outlines with a "+" that fill in when you enter them.
 * Replays when the card is picked, so the choice shows what it means.
 */
function Screens({ mode, active }: { mode: BuildMode; active: boolean }) {
  const reduced = !!useReducedMotion();
  const ink = active ? "bg-primary" : "bg-muted-foreground/35";
  return (
    <div aria-hidden className="flex items-center gap-1.5">
      {[0, 1, 2].map((n) => {
        const built = mode === "classic" || n === 0;
        return (
          <div key={n} className="flex items-center gap-1.5">
            {n > 0 && <span className={`h-px w-2.5 ${built ? ink : "bg-border"} transition-colors`} />}
            <motion.div
              // a new key replays the entrance each time the card becomes the chosen one
              key={`${n}-${active}`}
              initial={reduced || !active ? false : { opacity: 0, y: 4, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              // together for "classic"; one after another for "procedural"
              transition={{ duration: 0.45, ease: EASE, delay: mode === "classic" ? 0 : n * 0.28 }}
              className={`grid h-9 w-12 shrink-0 rounded-md p-1.5 transition-colors ${built
                ? active ? "border border-primary/50 bg-primary/12" : "border bg-muted"
                : "place-items-center border border-dashed border-muted-foreground/40"}`}
            >
              {built ? (
                <span className="flex flex-col gap-1">
                  <span className={`h-1 w-5 rounded-full ${ink} transition-colors`} />
                  <span className={`h-1 w-7 rounded-full ${ink} opacity-50 transition-colors`} />
                  <span className={`h-1 w-4 rounded-full ${ink} opacity-50 transition-colors`} />
                </span>
              ) : (
                <span className="text-xs leading-none text-muted-foreground">+</span>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

/** How Sibilla builds the app: two cards you can tell apart at a glance, each with a picture of what happens. */
export function ModePicker({ mode, onMode }: { mode: BuildMode; onMode: (m: BuildMode) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // A radio group: arrows move between the options and pick them; only the chosen one is in the tab order.
  function onKeyDown(e: KeyboardEvent, i: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + MODES.length) % MODES.length;
    refs.current[next]?.focus();
    onMode(MODES[next].id);
  }

  return (
    <div role="radiogroup" aria-label="Come costruire l'app" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {MODES.map((m, i) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-labelledby={`mode-${m.id}`}
            aria-describedby={`mode-${m.id}-desc`}
            tabIndex={active ? 0 : -1}
            onClick={() => onMode(m.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${active
              ? "border-primary/60 bg-primary/[0.06] shadow-[0_0_0_1px_var(--color-primary)]"
              : "hover:border-foreground/20 hover:bg-muted/50"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <Screens mode={m.id} active={active} />
              {/* the radio itself: a ring that fills when chosen */}
              <span aria-hidden className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                <span className={`size-1.5 rounded-full bg-primary-foreground transition-transform duration-200 ${active ? "scale-100" : "scale-0"}`} />
              </span>
            </div>
            <span className="flex flex-col gap-0.5">
              <span id={`mode-${m.id}`} className={`text-sm font-semibold ${active ? "text-foreground" : "text-foreground/80"}`}>{m.label}</span>
              <span id={`mode-${m.id}-desc`} className="flex flex-col gap-0.5">
                <span className="text-sm text-muted-foreground">{m.lead}</span>
                <span className="text-xs text-muted-foreground/80">{m.tradeoff}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
