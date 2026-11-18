import { expect, test } from "vitest";
import type { Spec } from "@sibilla/shared";
import { openDb } from "../src/db";
import { introspect } from "../src/schema";
import { runQuery } from "../src/query";
import { store } from "./fake-npm";
import {
  GenerateError, TOOLS, buildSystemPrompt, buildUserContent, generate, responseText, specProblems,
  type Block, type GenerateInput, type LlmStep,
} from "../src/generate";

const db = openDb(":memory:");
const schema = introspect(db);
const libs = store().store;
const deps = (step: LlmStep) => ({ schema, step, libraries: libs, query: (q: Parameters<typeof runQuery>[2]) => runQuery(db, schema, q, {}).rows });

const spec = (field = "stato"): Spec => ({
  title: "Ordini",
  variables: [],
  nodes: [
    { id: "root", parentId: null, type: "stack", direction: "column" },
    {
      id: "t", parentId: "root", type: "table", title: null, rowClick: null,
      query: { table: "ordini", select: ["id", field], join: [], where: [], groupBy: [], aggregates: [], orderBy: [], limit: 20 },
      columns: [{ field: "id", label: "N.", format: "number" }],
    },
  ],
});

let n = 0;
const show = (s: unknown, messaggio = "Fatto"): Block => ({ type: "tool_use", id: `t${++n}`, name: "mostra_interfaccia", input: { messaggio, spec: s } });
const ask = (query: unknown): Block => ({ type: "tool_use", id: `t${++n}`, name: "esegui_query", input: { query } });
const text = (t: string): Block => ({ type: "text", text: t });

/** Scripted model: each entry is one assistant turn. Records what it was sent. */
function fake(...turns: { content: Block[]; stopReason?: string }[]) {
  const calls: Parameters<LlmStep>[0][] = [];
  const step: LlmStep = async (args) => {
    calls.push(structuredClone(args));
    const t = turns[calls.length - 1];
    return { content: t.content, stopReason: t.stopReason ?? (t.content.some((b) => b.type === "tool_use") ? "tool_use" : "end_turn") };
  };
  return { step, calls };
}
const input = (over: Partial<GenerateInput> = {}): GenerateInput => ({ prompt: "ordini recenti", currentSpec: null, history: [], attachments: [], ...over });

test("a valid interface ends the run with spec and message", async () => {
  const { step, calls } = fake({ content: [show(spec(), "Ecco gli ordini")] });
  expect(await generate(input(), deps(step))).toEqual({ spec: spec(), message: "Ecco gli ordini" });
  expect(calls).toHaveLength(1);
});

test("a text-only answer returns no spec", async () => {
  const { step } = fake({ content: [text("Ci sono 300 ordini.")] });
  expect(await generate(input({ prompt: "quanti ordini ci sono?" }), deps(step))).toEqual({ spec: null, message: "Ci sono 300 ordini." });
});

test("data exploration results are fed back to the model", async () => {
  const q = { table: "ordini", select: ["stato"], join: [], where: [], groupBy: ["stato"], aggregates: [], orderBy: [], limit: null };
  const { step, calls } = fake({ content: [ask(q)] }, { content: [show(spec())] });
  await generate(input(), deps(step));
  const result = JSON.stringify(calls[1].messages.at(-1)!.content);
  expect(result).toContain("spedito");
});

test("an invalid interface goes back as a tool error and can be fixed", async () => {
  const { step, calls } = fake({ content: [show(spec("inesistente"))] }, { content: [show(spec())] });
  expect((await generate(input(), deps(step))).spec).toEqual(spec());
  const back = calls[1].messages.at(-1)!.content as { is_error?: boolean; content: string }[];
  expect(back[0].is_error).toBe(true);
  expect(JSON.stringify(back)).toContain("inesistente");
});

test("a bad query goes back as a tool error", async () => {
  const { step, calls } = fake({ content: [ask({ table: "sib_versions" })] }, { content: [text("ok")] });
  await generate(input(), deps(step));
  expect(JSON.stringify(calls[1].messages.at(-1)!.content)).toContain("is_error");
});

test("the assistant turn is echoed back unchanged", async () => {
  const turn: Block[] = [{ type: "thinking", thinking: "", signature: "sig" }, ask({ table: "clienti", select: ["id"], join: [], where: [], groupBy: [], aggregates: [], orderBy: [], limit: 1 })];
  const { step, calls } = fake({ content: turn }, { content: [text("ok")] });
  await generate(input(), deps(step));
  expect(calls[1].messages.at(-2)).toEqual({ role: "assistant", content: turn });
});

test("the run stops after too many steps", async () => {
  const loop = Array.from({ length: 20 }, () => ({ content: [show(spec("inesistente"))] }));
  const { step } = fake(...loop);
  await expect(generate(input(), deps(step))).rejects.toBeInstanceOf(GenerateError);
});

test("refusal fails", async () => {
  const { step } = fake({ content: [], stopReason: "refusal" });
  await expect(generate(input(), deps(step))).rejects.toThrow("rifiutata");
});

test("history and current spec are sent", async () => {
  const { step, calls } = fake({ content: [text("ok")] });
  await generate(input({ currentSpec: spec(), history: [{ role: "user", content: "prima" }, { role: "assistant", content: "ok" }] }), deps(step));
  expect(calls[0].messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  expect(JSON.stringify(calls[0].messages.at(-1)!.content)).toContain(JSON.stringify(JSON.stringify(spec())).slice(1, -1));
});

test("attachments become image, document and text blocks before the prompt", () => {
  const blocks = buildUserContent(input({ attachments: [
    { name: "a.png", mediaType: "image/png", data: "AAAA" },
    { name: "b.pdf", mediaType: "application/pdf", data: "BBBB" },
    { name: "c.csv", mediaType: "text/csv", data: "x,y\n1,2" },
  ] }));
  expect(blocks.map((b) => b.type)).toEqual(["image", "document", "text", "text"]);
  expect(JSON.stringify(blocks[2])).toContain("c.csv");
  expect(JSON.stringify(blocks.at(-1))).toContain("ordini recenti");
});

test("unsupported attachments are refused", () => {
  expect(() => buildUserContent(input({ attachments: [{ name: "x.exe", mediaType: "application/x-msdownload", data: "" }] })))
    .toThrow(GenerateError);
});

test("tools are query, library, database changes and interface", () => {
  expect(TOOLS.map((t) => t.name)).toEqual(["esegui_query", "prepara_libreria", "crea_tabella", "inserisci_righe", "mostra_interfaccia", "modifica_interfaccia"]);
  expect(JSON.stringify(TOOLS.at(-2)!.input_schema)).toContain('"nodes"');
});

test("system prompt lists demo tables and hides internal ones", () => {
  const s = buildSystemPrompt(schema);
  expect(s).toContain("righe_ordine");
  expect(s).not.toContain("sib_");
});

test("columns not produced by the query are problems", () => {
  const s = spec();
  (s.nodes[1] as Extract<Spec["nodes"][number], { type: "table" }>).columns.push({ field: "totale", label: "Tot", format: "currency" });
  expect(specProblems(s, schema).join(" ")).toContain("totale");
});

test("form on unknown column is a problem", () => {
  const s: Spec = { ...spec(), nodes: [...spec().nodes, {
    id: "f", parentId: "root", type: "form", table: "clienti", mode: "create", recordIdVariable: null, submitLabel: "Salva",
    fields: [{ column: "boh", label: "Boh", input: "text", optionsQuery: null, optionValue: null, optionLabel: null }],
  }] };
  expect(specProblems(s, schema).join(" ")).toContain("boh");
});

test("create form missing a required column is a problem", () => {
  const s: Spec = { ...spec(), nodes: [...spec().nodes, {
    id: "f", parentId: "root", type: "form", table: "clienti", mode: "create", recordIdVariable: null, submitLabel: "Salva",
    fields: [{ column: "nome", label: "Nome", input: "text", optionsQuery: null, optionValue: null, optionLabel: null }],
  }] };
  const p = specProblems(s, schema).join(" ");
  expect(p).toContain("email");
  expect(p).toContain("segmento");
});

test("responseText keeps only the text after the last fallback block", () => {
  expect(responseText([{ type: "text", text: "a" }, { type: "fallback" }, { type: "text", text: "b" }])).toBe("b");
  expect(responseText([{ type: "thinking" }, { type: "text", text: "a" }, { type: "text", text: "b" }])).toBe("ab");
});

test("a chart grouped by more than its x axis is a problem (duplicate categories)", () => {
  const chart = (groupBy: string[]): Spec => ({ title: "t", variables: [], nodes: [
    { id: "c", parentId: null, type: "chart", title: null, kind: "area", x: "mese", y: ["tot"],
      query: { table: "ordini", select: groupBy, join: [], where: [], groupBy, aggregates: [{ fn: "sum", field: "totale", as: "tot" }], orderBy: [], limit: null } },
  ] });
  expect(specProblems(chart(["mese", "stato"]), schema).join(" ")).toContain("stato");
  expect(specProblems(chart(["mese"]), schema)).toEqual([]);
});

test("a custom view that does not compile goes back to the model", async () => {
  const bad: Spec = { title: "t", variables: [], nodes: [{ id: "c", parentId: null, type: "custom", source: "export default () => <div>", libraries: [], stylesheets: [], height: null }] };
  const good: Spec = { ...bad, nodes: [{ ...bad.nodes[0], source: "export default () => <div/>" } as Spec["nodes"][number]] };
  const { step, calls } = fake({ content: [show(bad)] }, { content: [show(good)] });
  expect((await generate(input(), deps(step))).spec).toEqual(good);
  expect(JSON.stringify(calls[1].messages.at(-1)!.content)).toContain("riga");
});

test("prepara_libreria installs and describes a package", async () => {
  const lib: Block = { type: "tool_use", id: "lib1", name: "prepara_libreria", input: { pacchetto: "@acme/design" } };
  const { step, calls } = fake({ content: [lib] }, { content: [text("ok")] });
  await generate(input(), deps(step));
  const res = JSON.stringify(calls[1].messages.at(-1)!.content);
  expect(res).toContain("4.0.0");
  expect(res).toContain("@acme/design/button");
  expect(res).toContain("styles.css");
});

test("prepara_libreria reports unknown packages as tool errors", async () => {
  const lib: Block = { type: "tool_use", id: "lib2", name: "prepara_libreria", input: { pacchetto: "nonesiste" } };
  const { step, calls } = fake({ content: [lib] }, { content: [text("ok")] });
  await generate(input(), deps(step));
  expect(JSON.stringify(calls[1].messages.at(-1)!.content)).toContain("is_error");
});

test("model, effort and reasoning visibility reach the model; reasoning comes back only when asked", async () => {
  const thought: Block = { type: "thinking", thinking: "Conto gli ordini.", signature: "s" };
  const llm = { model: "claude-sonnet-5-5", effort: "low", thinking: true } as const;
  const on = fake({ content: [thought, text("300.")] });
  expect(await generate(input({ llm }), deps(on.step))).toEqual({ spec: null, message: "300.", thinking: "Conto gli ordini." });
  expect(on.calls[0].llm).toEqual(llm);

  const off = fake({ content: [{ ...thought, thinking: "" }, text("300.")] });
  expect(await generate(input(), deps(off.step))).toEqual({ spec: null, message: "300." });
  expect(off.calls[0].llm).toEqual({ model: "claude-opus-5-5", effort: "medium", thinking: false });
});

test("procedural: the first screen is marked, and a followed link generates only its destination screen", async () => {
  const root = { id: "root", parentId: null, type: "stack", direction: "column" };
  const list = {
    id: "t", parentId: "root", type: "table", title: null, rowClick: null, columns: [{ field: "nome", label: "Nome", format: "text" }],
    query: { table: "clienti", select: ["id", "nome"], join: [], where: [], groupBy: [], aggregates: [], orderBy: [], limit: 20 },
    rowLink: { to: "/clienti/:id", params: [{ name: "id", field: "id" }], intent: "scheda del cliente con i suoi ordini" },
  };
  const home = { title: "Clienti", variables: [], nodes: [root, list] };
  const first = fake({ content: [show(home)] });
  const made = await generate(input({ prompt: "un crm", mode: "procedural" }), deps(first.step));
  expect(made.spec).toMatchObject({ procedural: true });
  expect(JSON.stringify(first.calls[0].messages)).toMatch(/Modalità procedurale/);

  // A row link whose field the query doesn't produce is caught.
  const broken = { ...home, nodes: [root, { ...list, rowLink: { ...list.rowLink, params: [{ name: "id", field: "boh" }] } }] };
  expect(specProblems(broken as Spec, schema).join()).toMatch(/campo boh non è prodotto/);

  const orders = (variables: unknown[]) => ({ title: "Scheda cliente", variables, nodes: [root, {
    id: "o", parentId: "root", type: "table", title: "Ordini", rowClick: null, columns: [{ field: "data", label: "Data", format: "date" }],
    query: { table: "ordini", select: ["id", "data"], join: [], where: [{ field: "cliente_id", op: "eq", value: variables.length ? "{{id}}" : 7 }], groupBy: [], aggregates: [], orderBy: [], limit: 20 },
  }] });
  const navigate = { from: "/", to: "/clienti/:id", label: "Rossi Srl", intent: "scheda del cliente con i suoi ordini", params: { id: 7 }, routes: [{ path: "/", title: "Clienti" }] };
  // First attempt hardcodes the client: refused, because the screen must work for every client.
  const second = fake({ content: [show(orders([]))] }, { content: [show(orders([{ name: "id", type: "number", default: null }]), "Ecco la scheda.")] });
  const screen = await generate(input({ prompt: "Rossi Srl", currentSpec: made.spec, navigate }), deps(second.step));
  expect(second.calls).toHaveLength(2);
  expect(JSON.stringify(second.calls[1].messages)).toContain("manca la variabile");
  expect(screen).toMatchObject({ message: "Ecco la scheda.", spec: { title: "Scheda cliente", procedural: true } });
  const asked = JSON.stringify(second.calls[0].messages);
  expect(asked).toMatch(/rotta \/clienti\/:id/);
  expect(asked).toMatch(/scheda del cliente con i suoi ordini/);
  expect(asked).toMatch(/SOLO la schermata di destinazione/);
});

const patch = (input: object): Block => ({ type: "tool_use", id: `t${++n}`, name: "modifica_interfaccia", input });

test("a small change is applied as a patch to the current interface", async () => {
  const { step } = fake({ content: [patch({
    messaggio: "Aggiunto lo stato", titolo: "Ordini e stati",
    nodi: [{ ...spec().nodes[1], columns: [{ field: "id", label: "N.", format: "number" }, { field: "stato", label: "Stato", format: "badge" }] }],
  })] });
  const res = await generate(input({ prompt: "aggiungi lo stato", currentSpec: spec() }), deps(step));
  expect(res.message).toBe("Aggiunto lo stato");
  expect(res.spec).toMatchObject({ title: "Ordini e stati", nodes: [{ id: "root" }, { id: "t", columns: [{ field: "id" }, { field: "stato" }] }] });
});

test("a patch that breaks the interface goes back as an error and nothing is applied", async () => {
  const bad = { ...spec().nodes[1], columns: [{ field: "inesistente", label: "?", format: "text" }] };
  const { step, calls } = fake(
    { content: [patch({ messaggio: "x", nodi: [bad] })] },
    { content: [patch({ messaggio: "x", rimuovi: ["nessuno"] })] },
    { content: [text("Non riesco.")] },
  );
  expect(await generate(input({ currentSpec: spec() }), deps(step))).toEqual({ spec: null, message: "Non riesco." });
  const errors = [1, 2].map((i) => (calls[i].messages.at(-1)!.content as { is_error?: boolean; content: string }[])[0]);
  expect(errors[0]).toMatchObject({ is_error: true, content: expect.stringContaining("inesistente") });
  expect(errors[1]).toMatchObject({ is_error: true, content: expect.stringContaining("nessun nodo con id nessuno") });
});

test("a patch needs an interface to change", async () => {
  const { step, calls } = fake({ content: [patch({ messaggio: "x", titolo: "Nuovo" })] }, { content: [show(spec())] });
  expect((await generate(input(), deps(step))).spec).toEqual(spec());
  expect(JSON.stringify(calls[1].messages.at(-1)!.content)).toContain("mostra_interfaccia");
});

test("a busy provider is tried again before the error reaches the user", async () => {
  const waits: number[] = [];
  let attempts = 0;
  const step: LlmStep = async () => {
    if (++attempts < 3) throw Object.assign(new Error("Overloaded"), { status: 529 });
    return { content: [text("Eccomi.")], stopReason: "end_turn" };
  };
  const seen: string[] = [];
  const res = await generate(input(), { ...deps(step), wait: async (ms) => { waits.push(ms); } }, (p) => { if (p.type === "status") seen.push(p.text); });
  expect(res.message).toBe("Eccomi.");
  expect(waits).toEqual([1000, 4000]);
  expect(seen).toContain("Il modello è occupato, riprovo…");
});

test("retries stop after two, and never happen for errors that would not pass", async () => {
  let attempts = 0;
  const busy: LlmStep = async () => { attempts++; throw Object.assign(new Error("Overloaded"), { error: { error: { type: "overloaded_error" } } }); };
  await expect(generate(input(), { ...deps(busy), wait: async () => {} })).rejects.toThrow("Overloaded");
  expect(attempts).toBe(3);
  attempts = 0;
  const wrongKey: LlmStep = async () => { attempts++; throw Object.assign(new Error("Unauthorized"), { status: 401 }); };
  await expect(generate(input(), { ...deps(wrongKey), wait: async () => {} })).rejects.toThrow("Unauthorized");
  expect(attempts).toBe(1);
});
