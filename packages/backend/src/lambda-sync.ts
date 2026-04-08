import { runSync } from "./functions/sync.js";

export const handler = async () => {
  const result = await runSync();
  return { statusCode: 200, body: JSON.stringify(result) };
};
