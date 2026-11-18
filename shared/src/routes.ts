const SEGMENT = "(?:[a-z0-9_-]+|:[a-z_][a-z0-9_]*)";
const ROUTE = new RegExp(`^/(?:${SEGMENT}(?:/${SEGMENT})*)?$`);

/** "/", "/clienti", "/clienti/:id/ordini": lowercase segments, parameters as ":nome". */
export const isRoute = (path: string) => ROUTE.test(path);

/** Names of a route's parameters: "/clienti/:id" → ["id"]. */
export const routeParams = (path: string) => path.split("/").filter((s) => s.startsWith(":")).map((s) => s.slice(1));

/** The address of a place in the app: "/clienti/:id" with { id: 7 } → "/clienti/7"; the first screen is "". */
export function routeUrl(path: string, params: Record<string, unknown>): string {
  if (path === "/") return "";
  return path.split("/").map((s) => (s.startsWith(":") ? encodeURIComponent(String(params[s.slice(1)] ?? "")) : s)).join("/");
}

/**
 * The reverse of routeUrl: which of the app's routes an address is, and the values of its parameters (as text).
 * A fixed segment wins over a parameter ("/ordini/nuovo" before "/ordini/:id"). Null when no route fits.
 */
export function matchRoute(paths: string[], url: string): { path: string; params: Record<string, string> } | null {
  const parts = url.split("/").filter(Boolean);
  if (!parts.length) return { path: "/", params: {} };
  const candidates = [...paths].sort((a, b) => routeParams(a).length - routeParams(b).length);
  for (const path of candidates) {
    const segs = path.split("/").filter(Boolean);
    if (segs.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    segs.forEach((s, i) => {
      if (s.startsWith(":")) {
        try { params[s.slice(1)] = decodeURIComponent(parts[i]); } catch { ok = false; }
      } else if (s !== parts[i]) ok = false;
    });
    if (ok) return { path, params };
  }
  return null;
}
