import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import fs from "fs";
import path from "path";

const excelManifestGenerator = () => {
  const virtualModuleId = "virtual:excel-manifest";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "excel-manifest-generator",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const excelDir = resolve(__dirname, "public/data/excel");
        const files = fs.readdirSync(excelDir);
        const participantNames = files
          .filter(
            (file) =>
              file.startsWith("Excel-Mundial-2026_") && file.endsWith(".xlsx"),
          )
          .map((file) => {
            const match = file.match(/Excel-Mundial-2026_(.*)\.xlsx/);
            return match ? match[1] : null;
          })
          .filter((name) => name !== null);

        return `export default ${JSON.stringify(participantNames)}`;
      }
    },
  };
};

const footballProxyPlugin = (keys: string[]) => {
  return {
    name: "football-proxy",
    configureServer(server) {
      server.middlewares.use(
        "/.netlify/functions/football",
        async (req, res) => {
          try {
            const qs = req.url?.includes("?")
              ? req.url.slice(req.url.indexOf("?"))
              : "";
            const path = new URLSearchParams(qs).get("path") ?? "";

            let response: Response | null = null;
            for (const key of keys) {
              const r = await fetch(`https://api.football-data.org/v4${path}`, {
                headers: { "X-Auth-Token": key },
              });
              if (r.status !== 429) {
                response = r;
                break;
              }
              console.warn(
                `[proxy] key ...${key.slice(-4)} agotada, rotando...`,
              );
            }

            if (!response) {
              res.statusCode = 429;
              res.end(JSON.stringify({ error: "Todas las API keys agotadas" }));
              return;
            }

            res.setHeader("Content-Type", "application/json");
            res.statusCode = response.status;
            res.end(await response.text());
          } catch (err) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: String(err) }));
          }
        },
      );
    },
  };
};
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const keys = [env.FOOTBALL_API_KEY, env.FOOTBALL_API_KEY_2].filter(Boolean);

  return {
    plugins: [vue(), excelManifestGenerator(), footballProxyPlugin(keys)],
    resolve: { alias: { "@": resolve(__dirname, "src") } },
  };
});
