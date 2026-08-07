import { register } from "tsx/esm/api";

register();

await import("./consumer-dlq-event-worker");