import test from "node:test";
import assert from "node:assert/strict";
import { parseStockOrder, sortedTickers } from "../src/stock-order.js";

const reports = [
  { ticker: "AVGO" },
  { ticker: "NVDA" },
  { ticker: "ON" },
  { ticker: "RDDT" },
  { ticker: "NVDA" },
];
test("explicit priority orders existing stock entries without duplicating them", () => {
  assert.deepEqual(sortedTickers(reports, ["NVDA", "AVGO", "ON", "RDDT"]), [
    "NVDA",
    "AVGO",
    "ON",
    "RDDT",
  ]);
});
test("new and unlisted stocks are appended alphabetically; missing stocks stay hidden", () => {
  assert.deepEqual(sortedTickers(reports, ["NVDA", "TSLA"]), [
    "NVDA",
    "AVGO",
    "ON",
    "RDDT",
  ]);
  assert.deepEqual(sortedTickers(reports, []), ["AVGO", "NVDA", "ON", "RDDT"]);
});
test("order text accepts newlines, separators and comments and retains first occurrence", () => {
  assert.deepEqual(
    parseStockOrder("# 優先順序\nnvda、AVGO\nNVDA # 重複\nON → RDDT"),
    ["NVDA", "AVGO", "ON", "RDDT"],
  );
});
test("bad symbols are rejected when building the configuration", () => {
  assert.throws(() => parseStockOrder("NVDA\n<script>"), /股票代碼/);
});
