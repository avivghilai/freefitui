import { handle } from "hono/aws-lambda";
import app from "./api.js";

export const handler = handle(app);
