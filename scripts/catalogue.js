import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse } from "parse5";

export function reportTitle(html, filename) {
  const document = parse(html);
  const root = document.childNodes.find((node) => node.tagName === "html");
  const head = root?.childNodes.find((node) => node.tagName === "head");
  const title = head?.childNodes.find((node) => node.tagName === "title");
  const value = title?.childNodes
    .map((node) => node.value || "")
    .join("")
    .trim();
  return (value || filename.replace(/\.html?$/i, "")).slice(0, 500);
}

export function filenameDate(filename) {
  const value = filename.match(/(?:^|\D)(\d{4}-\d{2}-\d{2})(?!\d)/)?.[1];
  if (!value) return null;
  const date = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts === value ? date.toISOString() : null;
}

export async function createCatalogue({
  reportsDir,
  repository = "",
  getDate,
}) {
  if (repository && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
    throw new Error("Invalid GitHub repository name.");
  const folders = await readdir(reportsDir, { withFileTypes: true });
  const reports = [];
  for (const folder of folders) {
    if (folder.name.startsWith(".")) continue;
    if (!folder.isDirectory()) {
      if (/\.html?$/i.test(folder.name))
        throw new Error(
          `${folder.name}：請把 HTML 放進股票代碼資料夾，例如 public/reports/AVGO/。`,
        );
      continue;
    }
    const ticker = folder.name.toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(ticker))
      throw new Error(
        `無效股票資料夾：${folder.name}。請使用 AVGO、NVDA 或 BRK.B 等代碼。`,
      );
    const files = await readdir(path.join(reportsDir, folder.name), {
      withFileTypes: true,
    });
    for (const file of files) {
      if (!file.isFile() || !/\.html?$/i.test(file.name)) continue;
      const absolute = path.join(reportsDir, folder.name, file.name);
      const info = await stat(absolute);
      if (!info.size)
        throw new Error(`${folder.name}/${file.name}：HTML 檔案不能是空的。`);
      const html = await readFile(absolute, "utf8");
      const created =
        filenameDate(file.name) ||
        (getDate ? await getDate(absolute) : info.mtime.toISOString());
      if (Number.isNaN(new Date(created).getTime()))
        throw new Error(`Invalid report date: ${file.name}`);
      const relative = `reports/${encodeURIComponent(folder.name)}/${encodeURIComponent(file.name)}`;
      reports.push({
        id: relative,
        ticker,
        title: reportTitle(html, file.name),
        original_filename: file.name,
        path: relative,
        created_at: created,
      });
    }
  }
  reports.sort(
    (a, b) =>
      new Date(b.created_at) - new Date(a.created_at) ||
      a.id.localeCompare(b.id, "en"),
  );
  return { repository, reports };
}
