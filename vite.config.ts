import { readFile } from "node:fs/promises";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function snapshotPlugin() {
  const snapshotPath = process.env.CLAWCO_SNAPSHOT_PATH;

  async function handleSnapshot(req: { url?: string }, res: {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (body?: string) => void;
  }) {
    if (req.url !== "/api/snapshot") {
      return false;
    }

    if (!snapshotPath) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "CLAWCO_SNAPSHOT_PATH is not configured" }));
      return true;
    }

    try {
      const body = await readFile(snapshotPath, "utf8");
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(body);
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }

    return true;
  }

  return {
    name: "clawco-snapshot",
    configureServer(server: {
      middlewares: { use: (fn: (req: { url?: string }, res: any, next: () => void) => void) => void };
    }) {
      server.middlewares.use((req, res, next) => {
        void handleSnapshot(req, res).then((handled) => {
          if (!handled) {
            next();
          }
        });
      });
    },
    configurePreviewServer(server: {
      middlewares: { use: (fn: (req: { url?: string }, res: any, next: () => void) => void) => void };
    }) {
      server.middlewares.use((req, res, next) => {
        void handleSnapshot(req, res).then((handled) => {
          if (!handled) {
            next();
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), snapshotPlugin()],
  build: {
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
