import { expect, test } from "vitest";
import { SpecSchema, applyPatch, matchRoute, routeUrl, screenSpec, validateSpecTree, withScreen, type Spec } from "../src/index";

const base: Spec = {
  title: "Ordini",
  style: { colorScheme: "light", radius: "small" },
  variables: [{ name: "stato", type: "string", default: null }],
  nodes: [
    { id: "root", parentId: null, type: "stack", direction: "column" },
    { id: "h", parentId: "root", type: "heading", text: "Ordini", level: 1 },
    { id: "box", parentId: "root", type: "card", title: "Dettagli", description: null },
    { id: "t1", parentId: "box", type: "text", text: "uno" },
    { id: "t2", parentId: "box", type: "text", text: "due" },
  ],
};
const ids = (s: unknown) => (s as Spec).nodes.map((n) => n.id);

test("a patch replaces a node by id and leaves the rest alone", () => {
  const { spec, problems } = applyPatch(base, { nodi: [{ id: "h", parentId: "root", type: "heading", text: "Ordini recenti", level: 1 }] });
  expect(problems).toEqual([]);
  const out = SpecSchema.parse(spec);
  expect(out.nodes[1]).toMatchObject({ id: "h", text: "Ordini recenti" });
  expect(ids(out)).toEqual(ids(base));
  expect(validateSpecTree(out)).toEqual([]);
});

test("a new node goes last among its siblings, and can be moved", () => {
  const added = { id: "t0", parentId: "box", type: "text", text: "zero" };
  expect(ids(applyPatch(base, { nodi: [added] }).spec)).toEqual(["root", "h", "box", "t1", "t2", "t0"]);
  expect(ids(applyPatch(base, { nodi: [added], sposta: [{ id: "t0", dopo: null }] }).spec)).toEqual(["root", "h", "box", "t0", "t1", "t2"]);
  expect(ids(applyPatch(base, { nodi: [added], sposta: [{ id: "t0", dopo: "t1" }] }).spec)).toEqual(["root", "h", "box", "t1", "t0", "t2"]);
});

test("removing a node takes its descendants along", () => {
  expect(ids(applyPatch(base, { rimuovi: ["box"] }).spec)).toEqual(["root", "h"]);
});

test("title, style, variables and collections change only where the patch says", () => {
  const { spec } = applyPatch(base, {
    titolo: "Vendite", stile: { colorScheme: "dark" },
    variabili: [{ name: "stato", type: "string", default: "aperto" }, { name: "anno", type: "number", default: null }],
  });
  expect(spec).toMatchObject({
    title: "Vendite", style: { colorScheme: "dark", radius: "small" },
    variables: [{ name: "stato", default: "aperto" }, { name: "anno" }],
  });
  expect((spec as Spec).nodes).toEqual(base.nodes);
});

test("a patch that points at nothing says so", () => {
  expect(applyPatch(base, { rimuovi: ["x"], sposta: [{ id: "y", dopo: null }, { id: "t1", dopo: "z" }] }).problems)
    .toEqual(["rimuovi: nessun nodo con id x", "sposta: nessun nodo con id y", "sposta: nessun nodo con id z"]);
});

test("an address maps to a route and back", () => {
  expect(routeUrl("/", {})).toBe("");
  expect(routeUrl("/clienti/:id", { id: 7 })).toBe("/clienti/7");
  expect(routeUrl("/note/:titolo", { titolo: "a b/c" })).toBe("/note/a%20b%2Fc");
  const paths = ["/ordini/:id", "/ordini/nuovo", "/clienti/:id"];
  expect(matchRoute(paths, "")).toEqual({ path: "/", params: {} });
  expect(matchRoute(paths, "/clienti/7")).toEqual({ path: "/clienti/:id", params: { id: "7" } });
  expect(matchRoute(paths, "/ordini/nuovo")).toEqual({ path: "/ordini/nuovo", params: {} });
  expect(matchRoute(paths, "/ordini/12")).toEqual({ path: "/ordini/:id", params: { id: "12" } });
  expect(matchRoute(paths, "/altro")).toBeNull();
});

test("a screen edited while looking at one record is still kept for every record", () => {
  const app: Spec = { title: "App", variables: [], nodes: [base.nodes[0]] };
  const scheda: Spec = { title: "Scheda", variables: [{ name: "id", type: "number", default: null }], nodes: [base.nodes[0]] };
  const withScheda = withScreen(app, "/clienti/:id", scheda);
  // What the model is handed (and hands back) carries the record on view as the variable's value.
  const onView = screenSpec(withScheda, { path: "/clienti/:id", params: { id: 12 } })!;
  expect(onView.variables[0].default).toBe(12);
  expect(withScreen(withScheda, "/clienti/:id", onView).screens![0].variables[0].default).toBeNull();
});
