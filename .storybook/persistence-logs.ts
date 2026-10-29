import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/** Local Storybook-only log sink. Never mount this endpoint in production. */
export function persistenceLogsPlugin(): Plugin {
  const directory = resolve(process.cwd(), "logs", "persistence");
  return {
    name: "storybook-local-persistence-logs",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(
        "/__storybook_persistence",
        async (req, res, next) => {
          const path = req.url?.split("?")[0];
          if (path !== "/events.ndjson" && path !== "/console.sqlite")
            return next();
          if (req.method !== "GET" && req.method !== "POST") {
            res.writeHead(405).end();
            return;
          }
          const filename = resolve(directory, path.slice(1));
          try {
            if (req.method === "GET") {
              const contents = await readFile(filename).catch(
                (error: NodeJS.ErrnoException) => {
                  if (error.code === "ENOENT") return null;
                  throw error;
                },
              );
              if (!contents) {
                res.writeHead(404).end();
                return;
              }
              res.writeHead(200, {
                "Content-Type": "application/octet-stream",
                "Cache-Control": "no-store",
              });
              res.end(contents);
              return;
            }
            const chunks: Buffer[] = [];
            let bytes = 0;
            for await (const chunk of req) {
              const buffer = Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk);
              bytes += buffer.length;
              if (bytes > 5 * 1024 * 1024) {
                res.writeHead(413).end();
                return;
              }
              chunks.push(buffer);
            }
            const body = Buffer.concat(chunks);
            await mkdir(directory, { recursive: true });
            if (path === "/events.ndjson") await appendFile(filename, body);
            else await writeFile(filename, body);
            res.writeHead(204).end();
          } catch (error) {
            server.config.logger.error(String(error));
            res.writeHead(500).end();
          }
        },
      );
    },
  };
}
