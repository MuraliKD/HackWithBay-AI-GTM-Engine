// Tiny JSON file cache so the recorded demo never waits on a live API.
// Same input → same cached result. Delete .cache/ to force fresh calls.
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DIR = process.env.VERCEL ? "/tmp/gtm-cache" : path.join(process.cwd(), ".cache");

export async function cached<T>(ns: string, input: unknown, fn: () => Promise<T>): Promise<{ data: T; cached: boolean }> {
  const key = createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 16);
  const file = path.join(DIR, `${ns}-${key}.json`);
  try {
    return { data: JSON.parse(await fs.readFile(file, "utf8")) as T, cached: true };
  } catch {}
  const data = await fn();
  try {
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2));
  } catch {}
  return { data, cached: false };
}
