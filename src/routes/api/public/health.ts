import { createFileRoute } from "@tanstack/react-router";

/**
 * Healthcheck público para Docker/VPS e reverse proxy.
 * Não expõe segredos, URLs privadas nem configuração sensível.
 */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify({ status: "ok" }), {
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        }),
    },
  },
});
