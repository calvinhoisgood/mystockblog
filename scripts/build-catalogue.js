import { execFileSync } from "node:child_process";
import { stat, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCatalogue } from "./catalogue.js";
import { parseStockOrder } from "../src/stock-order.js";

const projectDir = fileURLToPath(new URL("../", import.meta.url));
const reportsDir = path.join(projectDir, "public", "reports");
function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: projectDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}
const remote = git(["remote", "get-url", "origin"]);
const repository =
  process.env.GITHUB_REPOSITORY ||
  remote.match(/(?:github\.com[:/])([^/]+\/[^/]+?)(?:\.git)?$/)?.[1] ||
  "";
const catalogue = await createCatalogue({
  reportsDir,
  repository,
  async getDate(file) {
    return (
      git([
        "log",
        "-1",
        "--format=%cI",
        "--",
        path.relative(projectDir, file),
      ]) || (await stat(file)).mtime.toISOString()
    );
  },
});
catalogue.stock_order = parseStockOrder(
  await readFile(path.join(projectDir, "stock-order.txt"), "utf8"),
);
await writeFile(
  path.join(projectDir, "public", "catalogue.json"),
  JSON.stringify(catalogue, null, 2) + "\n",
);
console.log(
  `Catalogue ready: ${catalogue.reports.length} reports, ${new Set(catalogue.reports.map((r) => r.ticker)).size} tickers.`,
);
