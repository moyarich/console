import databaseUrl from "virtual:search-database";

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<
  number,
  { resolve: (keys: string[]) => void; reject: (error: Error) => void }
>();
export function searchSqlite(query: string): Promise<string[]> {
  if (!worker) {
    worker = new Worker(new URL("./sqliteSearch.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (
      event: MessageEvent<{ id: number; keys?: string[]; error?: string }>,
    ) => {
      const request = pending.get(event.data.id);
      pending.delete(event.data.id);
      if (event.data.error) request?.reject(new Error(event.data.error));
      else request?.resolve(event.data.keys ?? []);
    };
    worker.onerror = () => {
      for (const request of pending.values())
        request.reject(
          new Error("Search could not load. Try searching again."),
        );
      pending.clear();
      worker?.terminate();
      worker = undefined;
    };
  }
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker!.postMessage({
      id,
      query,
      url: new URL(databaseUrl, window.location.href).href,
    });
  });
}
