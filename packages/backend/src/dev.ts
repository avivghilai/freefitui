import { config } from "dotenv";
config({ path: "../../.env" });

import { serve } from "@hono/node-server";
import app from "./api.js";

const port = parseInt(process.env.PORT ?? "3001", 10);

console.log(`Starting dev server on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
