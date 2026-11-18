import { useEffect, useRef, useState } from "react";
import { PanelRightCloseIcon } from "lucide-react";
import type { Effort, GenerateUsage, LlmOptions, ProviderStatus, Spec } from "@sibilla/shared";
import { AiStatus, type AiStatusState } from "@/components/ui/ai-status";
import { Button } from "@/components/ui/button";
import { StreamingResponse } from "@/components/ui/streaming-response";
import type { Attachment } from "./attachments";
import { Composer } from "./Composer";
import { Markdown } from "./Markdown";
import { Orb } from "./Orb";

/** `thinking`: the model's reasoning for this answer, shown on request. `usage`: what producing it consumed. */
export type ChatMessage = { role: "user" | "assistant"; content: string; attachments?: string[]; thinking?: string; usage?: GenerateUsage };

/** Live state of the running generation: what Sibilla is doing, its reasoning so far, and the interface as built so far. */
export type Progress = { status: string; thinking: string; preview: Spec | null };

const tokens = new Intl.NumberFormat("it-IT", { notation: "compact", maximumFractionDigits: 1 });
const dollars = new Intl.NumberFormat("it-IT", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 3 });
/** "12,4 mila token, circa 0,08 $": the cost is an estimate at list price. */
const usageLine = (u: GenerateUsage) =>
  `${tokens.format(u.inputTokens + u.outputTokens)} token${u.cost === null ? "" : `, circa ${dollars.format(u.cost)}`}`;

/** What the server says it is doing, as one of the status states (the label itself stays the server's). */
function statusState(text: string | undefined): AiStatusState {
  if (!text) return "thinking";
  if (/^(Esploro|Leggo)/.test(text)) return "researching";
  if (/^Verifico/.test(text)) return "analyzing";
  if (/^(Costruisco|Modifico|Creo|Inserisco|Preparo)/.test(text)) return "writing";
  return "thinking";
}

/**
 * An answer from Sibilla. One that arrives while the chat is open develops into focus word by word;
 * one already in the history (a reopened conversation) shows at once.
 */
function Reply({ text, fresh }: { text: string; fresh: boolean }) {
  // Mounting as "streaming" starts from nothing; switching to "done" right away lets it play out to the end.
  const [status, setStatus] = useState<"streaming" | "done">(fresh ? "streaming" : "done");
  useEffect(() => { setStatus("done"); }, []);
  return <StreamingResponse text={text} status={status} className="text-sm leading-relaxed [&_[data-slot=streaming-response-actions]]:text-muted-foreground" />;
}

export function Chat({ history, loading, progress, llm, providers = [], onLlmChange, onProvidersChange = () => {}, onSend, onStop, onClose, variant = "panel" }: {
  history: ChatMessage[];
  loading: boolean;
  progress?: Progress | null;
  llm: LlmOptions;
  onLlmChange: (patch: Partial<LlmOptions>) => void;
  providers?: ProviderStatus[];
  onProvidersChange?: (p: ProviderStatus[]) => void;
  onSend: (prompt: string, attachments: Attachment[], effort: Effort) => void;
  onStop?: () => void;
  onClose?: () => void;
  /** "panel": beside the interface it builds. "page": the whole screen, while the conversation has no interface yet. */
  variant?: "panel" | "page";
}) {
  const end = useRef<HTMLDivElement>(null);
  // Replies from this index on arrived during a run seen here, so they play in; earlier ones are history.
  const [freshFrom, setFreshFrom] = useState(Infinity);
  const [wasLoading, setWasLoading] = useState(loading);
  if (loading !== wasLoading) {
    setWasLoading(loading);
    if (loading) setFreshFrom(history.length);
  }
  useEffect(() => { end.current?.scrollIntoView?.({ behavior: "smooth" }); }, [history.length, loading, progress?.status, progress?.thinking]);
  const page = variant === "page";
  const column = page ? "mx-auto w-full max-w-3xl" : "";

  return (
    <aside aria-label="Chat con Sibilla" className={`flex h-full min-h-0 w-full flex-col ${page ? "" : "border-l bg-muted/30"}`}>
      {!page && (
        <div className="flex items-start gap-2 border-b px-4 py-3">
          <div className="flex-1">
            <h2 className="font-heading text-sm font-semibold">Chiedi a Sibilla</h2>
            <p className="text-xs text-muted-foreground">Chiedi una modifica, un'altra schermata o un dato.</p>
          </div>
          {onClose && <Button variant="ghost" size="icon-sm" aria-label="Chiudi chat" onClick={onClose}><PanelRightCloseIcon /></Button>}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className={`space-y-3 p-4 ${column} ${page ? "py-8" : ""}`}>
          {history.map((m, i) => (
            <div
              key={i}
              className={m.role === "user"
                ? `rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground ${page ? "ml-auto w-fit max-w-[80%]" : "ml-8"}`
                : `text-sm ${page ? "" : "mr-4"}`}
            >
              {m.thinking && (
                <details className="mb-2 rounded-lg border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium select-none">Ragionamento</summary>
                  <div className="mt-2"><Markdown text={m.thinking} /></div>
                </details>
              )}
              {m.role === "assistant" ? <Reply text={m.content} fresh={i >= freshFrom} /> : <p className="whitespace-pre-wrap">{m.content}</p>}
              {!!m.attachments?.length && (
                <p className="mt-1 text-xs opacity-80">{m.attachments.join(", ")}</p>
              )}
              {m.usage && <p className="mt-1 text-xs text-muted-foreground tabular-nums">{usageLine(m.usage)}</p>}
            </div>
          ))}
          {loading && (
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {progress?.thinking.trim() && (
                <div className="rounded-lg border bg-background/60 px-3 py-2 text-xs">
                  <p className="mb-1 font-medium">Ragionamento</p>
                  <Markdown text={progress.thinking} />
                </div>
              )}
              <AiStatus state={statusState(progress?.status)} label={progress?.status || "Sibilla sta lavorando…"}
                icon={<Orb className="size-5" state="thinking" />} className="text-sm" />
            </div>
          )}
          <div ref={end} />
        </div>
      </div>

      <div className={`p-3 ${page ? `${column} pb-6` : "border-t"}`}>
        <Composer loading={loading} llm={llm} providers={providers} onLlmChange={onLlmChange} onProvidersChange={onProvidersChange} onSend={onSend} onStop={onStop} autoFocus={page} />
      </div>
    </aside>
  );
}
