import type { DbSchema, Effort, LlmOptions, ProviderStatus } from "@sibilla/shared";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import type { Attachment } from "./attachments";
import { Composer } from "./Composer";
import { ModePicker } from "./ModePicker";
import { Orb } from "./Orb";
import { suggestions } from "./suggestions";
import { useCounts } from "./useCounts";

/** What to describe depends on how it gets built: the whole app, or where it starts. */
const PLACEHOLDER = {
  classic: "Descrivi l'app completa che ti serve…",
  procedural: "Descrivi la prima schermata…",
} as const;
/** Tables named in the data line before the rest is summed up as "e altre N". */
const TABLES_SHOWN = 4;

const greeting = (hour = new Date().getHours()) => (hour < 5 || hour >= 18 ? "Buonasera" : hour < 13 ? "Buongiorno" : "Buon pomeriggio");

/**
 * Start of a new conversation. One question ("what do you need?") answered by the composer, which comes first;
 * under it, the two things that help answer it: ways to begin, and the data there is to build on.
 */
export function Home({ mode, onMode, schema, loading, llm, providers, onLlmChange, onProvidersChange, onSend }: {
  mode: "classic" | "procedural";
  onMode: (m: "classic" | "procedural") => void;
  schema: DbSchema | null;
  loading: boolean;
  llm: LlmOptions;
  providers: ProviderStatus[];
  onLlmChange: (patch: Partial<LlmOptions>) => void;
  onProvidersChange: (p: ProviderStatus[]) => void;
  onSend: (prompt: string, attachments?: Attachment[], effort?: Effort) => void;
}) {
  const tables = schema?.tables.map((t) => t.name) ?? [];
  const shown = tables.slice(0, TABLES_SHOWN);
  const counts = useCounts(shown);

  return (
    <div className="flex min-h-full flex-col justify-center px-4 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center gap-4">
          <Orb className="size-12" />
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{greeting()}, cosa costruiamo?</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Descrivi una schermata o una mini app: la costruisco sui tuoi dati.</p>
          </div>
        </header>

        <div className="flex flex-col gap-3">
          <Composer size="hero" autoFocus loading={loading} llm={llm} providers={providers} placeholder={PLACEHOLDER[mode]}
            onLlmChange={onLlmChange} onProvidersChange={onProvidersChange} onSend={onSend} />
          {/* Ways to start, as chips under the box: shortcuts for what you would otherwise type. */}
          <ul aria-label="Da dove partire" className="flex flex-wrap gap-2">
            {suggestions(schema).map((s) => (
              <li key={s.prompt} className="min-w-0 max-w-full">
                <button type="button" disabled={loading} onClick={() => onSend(s.prompt)} title={s.prompt}
                  className="flex max-w-full items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:border-foreground/25 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50">
                  <span className="shrink-0 font-medium">{s.title}</span>
                  <span className="min-w-0 truncate text-muted-foreground">{s.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* How to build belongs with the request it applies to, so it follows the composer and its shortcuts. */}
        <ModePicker mode={mode} onMode={onMode} />

        {/* The data is one quiet line: it is in the sidebar too, here it only says what Sibilla builds on. */}
        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 px-1 text-xs text-muted-foreground">
          {tables.length === 0 ? "Nessun dato collegato: l'archivio che serve alla tua app lo creo io." : (
            <>
              <span>Sui tuoi dati:</span>
              {shown.map((t, i) => (
                <span key={t} className="inline-flex items-baseline gap-1.5">
                  {i > 0 && <span aria-hidden>·</span>}
                  <button type="button" disabled={loading} title={`Una vista su ${t}`}
                    onClick={() => onSend(`Una vista su ${t}: i numeri principali e l'elenco con ricerca e filtri`)}
                    className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50">
                    {t}
                  </button>
                  {/* A count that could not be read is left out, never shown as zero. */}
                  {t in counts && <AnimatedCounter value={counts[t]} separator="." aria-label={`${counts[t]} record`} className="tabular-nums opacity-70" />}
                </span>
              ))}
              {tables.length > shown.length && <span>· e altre {tables.length - shown.length}</span>}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
