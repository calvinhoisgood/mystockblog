import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  reportTitle,
  filenameDate,
  createCatalogue,
} from "../scripts/catalogue.js";

test("extracts real title and decodes entities without executing content", () => {
  assert.equal(
    reportTitle(
      "<!-- <title>fake</title> --><title>AVGO &amp; AI &#x7814;&#x7A76;</title><script>throw 1</script>",
      "x.html",
    ),
    "AVGO & AI 研究",
  );
  assert.equal(reportTitle("<title> </title>", "report.HTM"), "report");
});
test("filename dates must be valid and use Shanghai timezone", () => {
  assert.equal(
    filenameDate("AVGO_2026-10-04.html"),
    "2026-10-03T16:00:00.000Z",
  );
  assert.equal(filenameDate("x_2026-02-30.html"), null);
  assert.equal(filenameDate("x_2026-13-01.html"), null);
  assert.equal(filenameDate("x.html"), null);
});
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "stock-catalogue-"));
  t.after(() => {
    assert.ok(
      path
        .resolve(root)
        .startsWith(path.resolve(os.tmpdir()) + path.sep + "stock-catalogue-"),
    );
    return rm(root, { recursive: true, force: true });
  });
  return root;
}
test("discovers reports, encodes filenames and sorts newest first", async (t) => {
  const root = await fixture(t);
  await mkdir(path.join(root, "AVGO"));
  await mkdir(path.join(root, "NVDA"));
  await writeFile(
    path.join(root, "AVGO", "研究 #1_2026-10-04.html"),
    "<title>Broadcom</title>",
  );
  await writeFile(path.join(root, "NVDA", "new.htm"), "<h1>No title</h1>");
  await writeFile(path.join(root, "NVDA", "chart.svg"), "<svg/>");
  const result = await createCatalogue({
    reportsDir: root,
    repository: "owner/blog",
    getDate: async () => "2026-10-05T12:00:00Z",
  });
  assert.equal(result.repository, "owner/blog");
  assert.equal(result.reports.length, 2);
  assert.equal(result.reports[0].ticker, "NVDA");
  assert.equal(result.reports[0].title, "new");
  assert.equal(
    result.reports[1].path,
    "reports/AVGO/%E7%A0%94%E7%A9%B6%20%231_2026-10-04.html",
  );
});
test("empty library has no placeholder reports", async (t) => {
  assert.deepEqual(await createCatalogue({ reportsDir: await fixture(t) }), {
    repository: "",
    reports: [],
  });
});
test("misplaced HTML and empty files produce clear errors", async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, "x.html"), "<title>x</title>");
  await assert.rejects(createCatalogue({ reportsDir: root }), /股票代碼資料夾/);
  await rm(path.join(root, "x.html"));
  await mkdir(path.join(root, "AVGO"));
  await writeFile(path.join(root, "AVGO", "empty.html"), "");
  await assert.rejects(createCatalogue({ reportsDir: root }), /不能是空的/);
});
test("invalid tickers and unsafe repository names are rejected", async (t) => {
  const root = await fixture(t);
  await mkdir(path.join(root, "bad ticker"));
  await assert.rejects(createCatalogue({ reportsDir: root }), /無效股票/);
  await assert.rejects(
    createCatalogue({ reportsDir: root, repository: "https://evil.test/" }),
    /Invalid GitHub/,
  );
});
