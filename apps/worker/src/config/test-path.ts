import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../../../.env");
console.log("__dirname:", __dirname);
console.log("envPath:", envPath);
console.log("exists:", existsSync(envPath));
