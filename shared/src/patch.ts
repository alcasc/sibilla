import { z } from "zod";
import { CollectionSchema } from "./collections";
import { SpecSchema, StyleSchema, VariablesSchema } from "./spec";

/**
 * A change to an interface that already exists: only what differs, so a small request ("another column",
 * "dark theme") doesn't cost rewriting the whole spec. Nodes stay unparsed here: the patched spec is validated whole.
 */
export const PatchSchema = z.object({
  titolo: z.string().nullable().optional(),
  /** Merged key by key into the current style. */
  stile: StyleSchema.nullable().optional(),
  /** Added, or replacing the variable / collection of the same name. */
  variabili: VariablesSchema.nullable().optional(),
  collections: z.array(CollectionSchema).nullable().optional(),
  /** Each replaces the node with the same id; a new id is a new node, last among its siblings. */
  nodi: z.array(z.unknown()).nullable().optional(),
  /** Ids of nodes to take away, with everything inside them. */
  rimuovi: z.array(z.string()).nullable().optional(),
  /** Reorder: put node `id` right after its sibling `dopo` (null = first among its siblings). */
  sposta: z.array(z.object({ id: z.string(), dopo: z.string().nullable() })).nullable().optional(),
});
export type Patch = z.infer<typeof PatchSchema>;

type Loose = { id?: unknown; parentId?: unknown };
const idOf = (n: unknown) => (n && typeof n === "object" && typeof (n as Loose).id === "string" ? (n as Loose).id as string : null);
const parentOf = (n: unknown) => (n && typeof n === "object" ? (n as Loose).parentId ?? null : null);

/** JSON schema of a patch for the model: nodes and style exactly as in a spec. */
export function patchJsonSchema(spec: Record<string, unknown>): Record<string, unknown> {
  const p = spec.properties as Record<string, Record<string, unknown>>;
  return {
    type: "object",
    properties: {
      titolo: { type: "string" },
      stile: p.style,
      variabili: p.variables,
      collections: p.collections,
      nodi: p.nodes,
      rimuovi: { type: "array", items: { type: "string" } },
      sposta: { type: "array", items: { type: "object", properties: { id: { type: "string" }, dopo: { type: ["string", "null"] } }, required: ["id", "dopo"] } },
    },
  };
}

/**
 * The spec with the patch applied, still to be validated (`spec` as unknown), and what in the patch
 * pointed at nothing. Order of operations: remove, replace/add, move.
 */
export function applyPatch(current: z.infer<typeof SpecSchema>, patch: Patch): { spec: unknown; problems: string[] } {
  const problems: string[] = [];
  let nodes: unknown[] = [...current.nodes];

  if (patch.rimuovi?.length) {
    const gone = new Set<string>();
    for (const id of patch.rimuovi) {
      if (!nodes.some((n) => idOf(n) === id)) problems.push(`rimuovi: nessun nodo con id ${id}`);
      else gone.add(id);
    }
    // children follow their parents out, however deep
    for (let grew = true; grew;) {
      grew = false;
      for (const n of nodes) {
        const id = idOf(n), parent = parentOf(n);
        if (id !== null && !gone.has(id) && typeof parent === "string" && gone.has(parent)) { gone.add(id); grew = true; }
      }
    }
    nodes = nodes.filter((n) => !gone.has(idOf(n) ?? ""));
  }

  for (const n of patch.nodi ?? []) {
    const id = idOf(n);
    const at = id === null ? -1 : nodes.findIndex((x) => idOf(x) === id);
    if (at >= 0) nodes[at] = n; else nodes.push(n);
  }

  for (const { id, dopo } of patch.sposta ?? []) {
    const from = nodes.findIndex((n) => idOf(n) === id);
    if (from < 0) { problems.push(`sposta: nessun nodo con id ${id}`); continue; }
    const [node] = nodes.splice(from, 1);
    // Siblings keep the order they have in the list, whatever sits between them.
    const to = dopo === null
      ? nodes.findIndex((n) => parentOf(n) === parentOf(node))
      : nodes.findIndex((n) => idOf(n) === dopo) + 1;
    if (dopo !== null && to === 0) { problems.push(`sposta: nessun nodo con id ${dopo}`); nodes.splice(from, 0, node); continue; }
    nodes.splice(to < 0 ? from : to, 0, node);
  }

  // A replacement keeps the place of what it replaces; new names go last.
  const byName = <T extends { name: string }>(old: T[], next: T[] | null | undefined) => !next?.length ? old : [
    ...old.map((o) => next.findLast((n) => n.name === o.name) ?? o),
    ...next.filter((n, i) => !old.some((o) => o.name === n.name) && next.findLastIndex((x) => x.name === n.name) === i),
  ];
  const style = patch.stile ? { ...(current.style ?? {}), ...patch.stile } : current.style;
  const collections = byName(current.collections ?? [], patch.collections);

  return {
    problems,
    spec: {
      ...current,
      title: patch.titolo ?? current.title,
      ...(style ? { style } : {}),
      ...(collections.length ? { collections } : {}),
      variables: byName(current.variables, patch.variabili),
      nodes,
    },
  };
}
