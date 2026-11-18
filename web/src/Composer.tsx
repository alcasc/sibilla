import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { FileTextIcon, ImageIcon, MicIcon, PaperclipIcon, SquareIcon, XIcon } from "lucide-react";
import { EFFORTS, modelInfo, type Effort, type LlmOptions, type ProviderStatus } from "@sibilla/shared";
import { Button } from "@/components/ui/button";
import { PromptBox, type PromptEffort } from "@/components/ui/prompt-box";
import { toast } from "@/components/ui/toast";
import { ACCEPT, fileToAttachment, pastedTextAttachment, type Attachment } from "./attachments";
import { LlmSettings } from "./LlmSettings";
import { useDictation } from "./useDictation";

/**
 * How the send button fills while held, one shade per effort: the first level (a tap) stays neutral, then
 * Sibilla's amber deepens toward ink. Dark enough that the button's white icon stays readable on it.
 */
const EFFORT_COLORS: Partial<Record<Effort, string>> = { medium: "#e77500", high: "#c25e00", xhigh: "#7d3500", max: "#2b1401" };

/** The efforts this model accepts, in order: a tap sends at the first, holding climbs through the rest. */
function effortsFor(llm: LlmOptions): PromptEffort[] {
  return modelInfo(llm.model).efforts.map((id) => ({ id, label: EFFORTS.find((e) => e.id === id)!.label, color: EFFORT_COLORS[id] }));
}

/**
 * Where the user writes to Sibilla: text, dictation, attachments (picked, pasted or dropped) and the model.
 * Built on Rare UI's PromptBox: how long send is held sets how hard the model works on this message.
 */
export function Composer({ loading, llm, providers = [], onLlmChange, onProvidersChange = () => {}, onSend, onStop, size = "panel", autoFocus, placeholder }: {
  loading: boolean;
  llm: LlmOptions;
  providers?: ProviderStatus[];
  onLlmChange: (patch: Partial<LlmOptions>) => void;
  onProvidersChange?: (p: ProviderStatus[]) => void;
  /** `effort`: chosen for this message by holding send. */
  onSend: (prompt: string, attachments: Attachment[], effort: Effort) => void;
  /** While a generation runs, the send button becomes "stop" and calls this. */
  onStop?: () => void;
  /** "hero": the large composer of the start screen. */
  size?: "panel" | "hero";
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  const dictation = useDictation(
    (t) => setText((cur) => (cur.trim() ? `${cur.trimEnd()} ${t}` : t)),
    (msg) => toast.error(msg),
  );

  async function add(list: Iterable<File>) {
    for (const f of list) {
      try {
        const a = await fileToAttachment(f);
        setFiles((cur) => [...cur, a]);
      } catch (e) { toast.error((e as Error).message); }
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = [...e.clipboardData.files];
    if (pasted.length) { e.preventDefault(); add(pasted); return; }
    const long = pastedTextAttachment(e.clipboardData.getData("text/plain"));
    if (long) { e.preventDefault(); setFiles((cur) => [...cur, long]); }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    add(e.dataTransfer.files);
  }

  // PromptBox clears its own text once it has sent (with the words rising out of the box).
  const send = (prompt: string, effort: PromptEffort) => {
    if (loading) return;
    if (dictation.listening) dictation.toggle();
    onSend(prompt || "Usa gli allegati come riferimento.", files, effort.id as Effort);
    setFiles([]);
  };

  const hero = size === "hero";
  return (
    <div
      className="relative"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={onDrop}
    >
      {!!files.length && (
        <ul aria-label="Allegati" className="mb-2 flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex max-w-full items-center gap-1 rounded-full border bg-background py-0.5 pr-0.5 pl-2 text-xs">
              {f.mediaType.startsWith("image/") ? <ImageIcon className="size-3.5 shrink-0" /> : <FileTextIcon className="size-3.5 shrink-0" />}
              <span className="truncate">{f.name}</span>
              <Button variant="ghost" size="icon-xs" aria-label={`Rimuovi ${f.name}`} onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}>
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <PromptBox
        value={text}
        onValueChange={setText}
        onSubmit={send}
        status={loading && onStop ? "streaming" : "idle"}
        onStop={onStop}
        disabled={loading && !onStop}
        allowEmpty={files.length > 0}
        efforts={effortsFor(llm)}
        placeholder={dictation.listening ? "Ti ascolto…" : placeholder ?? (hero ? "Descrivi la schermata o la mini app che ti serve…" : "Cosa ti serve?")}
        inputProps={{ "aria-label": "Messaggio", autoFocus, onPaste, className: hero ? "md:text-base" : undefined }}
        className={`w-full ${hero ? "shadow-[0_8px_24px_-12px_rgb(0_0_0/0.12)] focus-within:border-ring" : "rounded-2xl focus-within:border-ring"}`}
        actions={
          <>
            <input ref={picker} type="file" multiple accept={ACCEPT} hidden
              onChange={(e) => { add(e.target.files ?? []); e.target.value = ""; }} />
            <Button variant="ghost" size="icon-sm" aria-label="Allega file" onClick={() => picker.current?.click()}><PaperclipIcon /></Button>
            {dictation.supported && (
              <Button
                variant={dictation.listening ? "destructive" : "ghost"} size="icon-sm"
                aria-label={dictation.listening ? "Ferma dettatura" : "Detta"} aria-pressed={dictation.listening}
                onClick={dictation.toggle}
              >
                {dictation.listening ? <SquareIcon /> : <MicIcon />}
              </Button>
            )}
            <LlmSettings llm={llm} providers={providers} onChange={onLlmChange} onProvidersChange={onProvidersChange} />
          </>
        }
      />
      {dragging && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-3xl border-2 border-dashed border-primary bg-background/90 text-sm font-medium">
          Rilascia per allegare
        </div>
      )}
    </div>
  );
}
