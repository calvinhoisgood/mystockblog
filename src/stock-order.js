export function parseStockOrder(text) {
  const tokens = text
    .split(/\r?\n/)
    .map((line) => line.split("#")[0])
    .join(" ")
    .trim()
    .split(/[\s,，、;；>→]+/)
    .filter(Boolean)
    .map((code) => code.toUpperCase());
  for (const code of tokens)
    if (!/^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(code))
      throw new Error(`排序檔中的股票代碼無效：${code}`);
  return [...new Set(tokens)];
}

export function sortedTickers(reports, priority = []) {
  const ranks = new Map();
  if (Array.isArray(priority))
    for (const code of priority) {
      if (typeof code === "string" && !ranks.has(code.toUpperCase()))
        ranks.set(code.toUpperCase(), ranks.size);
    }
  return [...new Set(reports.map((report) => report.ticker))].sort((a, b) => {
    const rankA = ranks.get(a) ?? Infinity,
      rankB = ranks.get(b) ?? Infinity;
    if (rankA !== rankB) return rankA < rankB ? -1 : 1;
    return a.localeCompare(b, "en");
  });
}
