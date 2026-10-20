import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const bundlePath = join(root, "node_modules/.cache/cannonml-test/cml.iife.js");
