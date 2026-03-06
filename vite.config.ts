import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import downloadTagHandler from "./api/download/[tag]";
import downloadLatestHandler from "./api/download/latest";
import releasesHandler from "./api/releases";

const apiDevPlugin = (): Plugin => ({
  name: "local-api-routes",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith("/api/")) {
        next();
        return;
      }

      const origin = `http://${req.headers.host ?? "127.0.0.1:5173"}`;
      const request = new Request(new URL(req.url, origin), {
        method: req.method,
        headers: req.headers as HeadersInit,
      });

      let response: Response | null = null;

      if (req.url.startsWith("/api/releases")) {
        response = await releasesHandler(request);
      } else if (req.url.startsWith("/api/download/latest")) {
        response = await downloadLatestHandler(request);
      } else if (/^\/api\/download\/[^/]+/.test(req.url)) {
        response = await downloadTagHandler(request);
      }

      if (!response) {
        next();
        return;
      }

      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.end(await response.text());
    });
  },
});

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
});
