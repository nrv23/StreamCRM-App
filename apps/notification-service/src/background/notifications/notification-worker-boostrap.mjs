import { register } from "tsx/esm/api";

register();

await import("./notification-worker.ts");