import { useState } from "react";
import { ChevronRightIcon, LogOutIcon, PanelLeftCloseIcon, PlusIcon, SearchIcon } from "lucide-react";
import type { ConversationKind, InterfaceSummary } from "@sibilla/shared";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { BounceSidebar, type BounceSidebarItem } from "@/components/ui/bounce-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeSelector, type ThemeOption } from "@/components/ui/theme-selector";
import { useAccount } from "./Access";
import { Orb } from "./Orb";
import { useTheme, type Theme } from "./theme";

// Conversations grouped by what they produced, the most substantial first.
const KINDS: { kind: ConversationKind; label: string }[] = [
  { kind: "app", label: "Mini app" }, { kind: "view", label: "Viste" }, { kind: "chat", label: "Domande" },
];
/** Above this many conversations a search box is worth its space. */
const SEARCH_FROM = 6;

/** The dot that bounces to the open conversation: Sibilla's amber, a shade deeper so it reads on the light sidebar. */
const DOT = "#e7a600";

/** Miniatures of the app for the theme choice, in Sibilla's neutrals. "Dispositivo" shows both: light rail, dark page. */
const THEMES: ThemeOption[] = [
  { value: "light", label: "Chiaro", colors: { sidebar: "#f7f7f7", panel: "#ffffff", border: "rgba(0, 0, 0, 0.06)", strong: "#d4d4d4", muted: "#ebebeb", tile: "#f2f2f2" } },
  { value: "dark", label: "Scuro", colors: { sidebar: "#171717", panel: "#0a0a0a", border: "transparent", strong: "#404040", muted: "#262626", tile: "#1f1f1f" } },
  { value: "system", label: "Dispositivo", colors: { sidebar: "#f7f7f7", panel: "#0a0a0a", border: "rgba(0, 0, 0, 0.06)", strong: "#a3a3a3", muted: "#d4d4d4", tile: "#262626" } },
];

const DAY = 86_400_000;
/** When a conversation was last touched, in a word: "oggi", "ieri", "3 g", "12 nov". */
function when(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.round((new Date(now).setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / DAY);
  if (days <= 0) return "oggi";
  if (days === 1) return "ieri";
  if (days < 7) return `${days} g`;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

// One row style for everything you can open from here; the open one is a neutral pill, never the brand colour.
const ROW = "flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none aria-[current=page]:bg-muted aria-[current=page]:font-medium";
const LABEL = "px-2 pt-4 pb-1 text-xs text-muted-foreground";

/**
 * The way around Sibilla: start a conversation, reopen one, or go to the database.
 * Conversations scroll; the database stays in reach at the bottom.
 */
export function InterfacesSidebar({ list, currentId, onOpen, onNew, onClose, tables = [], counts = {}, table = null, dbOpen = false, onOpenTable, onNewTable }: {
  list: InterfaceSummary[];
  currentId: number | null;
  onOpen: (id: number) => void;
  onNew: () => void;
  onClose: () => void;
  /** The database's tables, with how many records each holds. */
  tables?: string[];
  counts?: Record<string, number>;
  /** The table open in the database screen, when that screen is showing. */
  table?: string | null;
  dbOpen?: boolean;
  onOpenTable?: (name: string) => void;
  onNewTable?: () => void;
}) {
  const { user, logout } = useAccount();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const term = search.trim().toLowerCase();
  const found = term ? list.filter((i) => i.nome.toLowerCase().includes(term)) : list;
  const active = found.filter((i) => !i.archived);
  const archived = found.filter((i) => i.archived);

  /**
   * Groups of conversations as one Rare UI bounce list: a heading per group, then its rows. The dot arcs to the open
   * conversation; `ids[n]` is the conversation at item n (null for a heading).
   */
  const conversationList = (label: string, groups: [string, InterfaceSummary[]][]) => {
    const items: BounceSidebarItem[] = [];
    const ids: (number | null)[] = [];
    for (const [heading, rows] of groups) {
      if (!rows.length) continue;
      items.push({ label: heading, heading: true });
      ids.push(null);
      for (const i of rows) { items.push({ label: i.nome, trailing: when(i.updatedAt) }); ids.push(i.id); }
    }
    if (!items.length) return null;
    return (
      <BounceSidebar aria-label={label} items={items} dotColor={DOT} className="gap-0 pt-4"
        value={dbOpen || currentId === null ? -1 : ids.indexOf(currentId)}
        onChange={(n) => { const id = ids[n]; if (id !== null && id !== undefined) onOpen(id); }} />
    );
  };

  return (
    <nav aria-label="Interfacce salvate" className="flex h-full min-h-0 w-64 flex-col border-r bg-muted/30">
      <div className="flex items-center gap-2 px-4 pt-4 pb-4">
        <Orb className="size-7" />
        <span className="flex-1 font-heading text-xl font-semibold tracking-tight">Sibilla</span>
        <Button variant="ghost" size="icon-sm" aria-label="Nascondi conversazioni" onClick={onClose}><PanelLeftCloseIcon /></Button>
      </div>
      <div className="flex flex-col gap-2 px-3">
        <Button variant="outline" className="w-full justify-start" onClick={onNew}>
          <PlusIcon /> Nuova conversazione
        </Button>
        {list.length >= SEARCH_FROM && (
          <div className="relative">
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" aria-label="Cerca tra le conversazioni" placeholder="Cerca…" className="h-8 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {list.length === 0 && <p className="px-2 pt-4 text-sm text-muted-foreground">Qui trovi le tue conversazioni: si salvano da sole.</p>}
        {list.length > 0 && found.length === 0 && <p className="px-2 pt-4 text-sm text-muted-foreground">Nessuna conversazione con «{search.trim()}».</p>}
        {conversationList("Conversazioni", [
          ["Fissate", active.filter((i) => i.pinned)],
          ...KINDS.map(({ kind, label }): [string, InterfaceSummary[]] => [label, active.filter((i) => !i.pinned && (i.kind ?? "view") === kind)]),
        ])}
        {archived.length > 0 && (
          <div className="mt-3">
            {/* Searching looks in the archive too, so it opens by itself when there is a match. */}
            <button type="button" aria-expanded={showArchived || !!term} onClick={() => setShowArchived((v) => !v)} className={`${ROW} text-xs text-muted-foreground`}>
              <ChevronRightIcon aria-hidden className={`size-3.5 transition-transform ${showArchived || term ? "rotate-90" : ""}`} />
              Archiviate
            </button>
            {(showArchived || !!term) && conversationList("Conversazioni archiviate", [["Archivio", archived]])}
          </div>
        )}
      </div>

      {onOpenTable && (
        <section aria-labelledby="gruppo-database" className="flex max-h-[38%] min-h-0 shrink-0 flex-col border-t px-2 pb-2">
          <div className="flex items-center pr-1">
            <h2 id="gruppo-database" className={`${LABEL} flex-1 pt-3`}>Database</h2>
            <Button variant="ghost" size="icon-xs" className="mt-2" aria-label="Nuova tabella" title="Nuova tabella" onClick={onNewTable}><PlusIcon /></Button>
          </div>
          <ul className="min-h-0 overflow-y-auto">
            {tables.length === 0 && <li className="px-2 pb-1 text-sm text-muted-foreground">Nessuna tabella. Creane una con il +.</li>}
            {tables.map((t) => (
              <li key={t}>
                <button type="button" onClick={() => onOpenTable(t)} aria-current={dbOpen && table === t ? "page" : undefined} className={ROW}>
                  <span className="min-w-0 flex-1 truncate">{t}</span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
                    {t in counts ? <AnimatedCounter value={counts[t]} separator="." aria-label={`${counts[t]} record`} /> : "–"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
        {user && (
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate" title={user.email}>{user.email}</span>
            <Button variant="ghost" size="icon-xs" aria-label="Esci" title="Esci" onClick={logout}><LogOutIcon /></Button>
          </div>
        )}
        <div className="flex flex-col gap-2">
          Tema
          <ThemeSelector themes={THEMES} value={theme} onChange={(v) => setTheme(v as Theme)} className="gap-2.5" itemClassName="w-[4.25rem]" />
        </div>
      </div>
    </nav>
  );
}
