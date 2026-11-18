import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import type { DatabaseSync } from "node:sqlite";
import { withCollections, type ChatMessage, type DbSchema, type Spec } from "@sibilla/shared";
import { createInterface, type Owner } from "./interfaces";
import { seedDocs, type SeedItem } from "./records";

/** A conversation as exported for the demo: its latest interface, its chat, and the documents of its app. */
type Demo = { nome: string; descrizione: string | null; prompt: string | null; spec: Spec; messages: ChatMessage[]; data: SeedItem[] };

const FILE = new URL("../demo/vault-markdown.json", import.meta.url);
let cached: Demo | undefined;

/**
 * Gives an account the demo conversation: a real one, made with Sibilla, so a new user sees what an app looks like
 * (and how it was asked for) before writing anything. Each account gets its own copy, with its own data.
 */
export function addDemo(db: DatabaseSync, schema: DbSchema, owner: Owner): number {
  cached ??= JSON.parse(readFileSync(FILE, "utf8")) as Demo;
  const { nome, descrizione, prompt, messages, data } = cached;
  const spec: Spec = { ...cached.spec, appId: randomUUID() };
  const { id } = createInterface(db, { nome, descrizione, spec, prompt, messages }, owner);
  const collections = spec.collections ?? [];
  if (collections.length) seedDocs(db, withCollections(schema, collections), { id: spec.appId!, collections }, data);
  return id;
}
